import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KalshiAPI } from '@/lib/kalshi/api'
import { getUserKalshiCredentials } from '@/lib/positions/get-user-credentials'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get position
    const { data: position, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    if (position.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only sell active positions' },
        { status: 400 }
      )
    }

    if (!position.shares_owned || position.shares_owned === 0) {
      return NextResponse.json(
        { error: 'No shares to sell' },
        { status: 400 }
      )
    }

    // Get credentials
    const credentials = await getUserKalshiCredentials(user.id)
    const kalshi = new KalshiAPI(credentials)

    // Execute sell order
    try {
      const sellOrder = await kalshi.createMarketOrder({
        market_id: position.market_id,
        side: 'yes',
        quantity: position.shares_owned,
        type: 'market',
      })

      if (!sellOrder.avg_price) {
        throw new Error('Order executed but avg_price is missing')
      }

      const sellPrice = sellOrder.avg_price

      // Calculate P&L
      const profitLoss = position.avg_buy_price
        ? (sellPrice - position.avg_buy_price) * position.shares_owned
        : null

      // Record trade
      await supabase.from('trades').insert({
        user_id: user.id,
        position_id: position.id,
        market_id: position.market_id,
        trade_type: 'sell',
        shares: position.shares_owned,
        price: sellPrice,
        total_amount: sellPrice * position.shares_owned,
        profit_loss: profitLoss,
        kalshi_order_id: sellOrder.order_id || null,
      })

      // Update position status
      await supabase
        .from('positions')
        .update({
          status: 'sold',
          current_price: sellPrice,
          sold_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', position.id)

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        position_id: position.id,
        action: 'position_sold_manual',
        details: {
          shares: position.shares_owned,
          price: sellPrice,
          profit_loss: profitLoss,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Position sold successfully',
      })
    } catch (sellError: any) {
      // Mark position as error
      await supabase
        .from('positions')
        .update({
          status: 'error',
          error_message: sellError.message || 'Failed to execute sell order',
          updated_at: new Date().toISOString(),
        })
        .eq('id', position.id)

      return NextResponse.json(
        { error: 'Failed to execute sell order', details: sellError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error force selling position:', error)
    return NextResponse.json(
      { error: 'Failed to sell position', details: error.message },
      { status: 500 }
    )
  }
}

