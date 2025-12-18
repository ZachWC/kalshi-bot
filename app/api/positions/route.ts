import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KalshiAPI } from '@/lib/kalshi/api'
import { getUserKalshiCredentials } from '@/lib/positions/get-user-credentials'
import { validatePosition } from '@/lib/positions/validate-position'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ positions: positions || [] })
  } catch (error: any) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { market_id, buy_amount, target_sell_pct } = body

    // Validate inputs
    const validation = validatePosition({ market_id, buy_amount, target_sell_pct })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    // Get user's Kalshi credentials
    let credentials
    try {
      credentials = await getUserKalshiCredentials(user.id)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Kalshi API keys not configured. Please connect your account in settings.' },
        { status: 400 }
      )
    }

    // Initialize Kalshi client
    const kalshi = new KalshiAPI(credentials)

    // Get market details
    let market
    try {
      market = await kalshi.getMarket(market_id)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Market not found or inaccessible', details: error.message },
        { status: 400 }
      )
    }

    const currentPrice = market.yes_ask || 0

    if (currentPrice === 0) {
      return NextResponse.json({ error: 'Unable to get current market price' }, { status: 400 })
    }

    // Calculate shares to buy
    const sharesToBuy = Math.floor(buy_amount / currentPrice)

    if (sharesToBuy === 0) {
      return NextResponse.json(
        { error: 'Buy amount too small for current price' },
        { status: 400 }
      )
    }

    // Create position record (status: pending)
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .insert({
        user_id: user.id,
        market_id,
        market_title: market.title || market_id,
        buy_amount,
        target_sell_pct,
        status: 'pending',
      })
      .select()
      .single()

    if (positionError) {
      throw positionError
    }

    // Execute buy order
    try {
      const buyOrder = await kalshi.createMarketOrder({
        market_id,
        side: 'yes',
        quantity: sharesToBuy,
        type: 'market',
      })

      // Update position with purchase details
      const { error: updateError } = await supabase
        .from('positions')
        .update({
          shares_owned: buyOrder.filled_quantity || sharesToBuy,
          avg_buy_price: buyOrder.avg_price || currentPrice,
          current_price: buyOrder.avg_price || currentPrice,
          status: 'active',
          purchased_at: new Date().toISOString(),
        })
        .eq('id', position.id)

      if (updateError) throw updateError

      // Record trade
      await supabase.from('trades').insert({
        user_id: user.id,
        position_id: position.id,
        market_id,
        trade_type: 'buy',
        shares: buyOrder.filled_quantity || sharesToBuy,
        price: buyOrder.avg_price || currentPrice,
        total_amount: (buyOrder.filled_quantity || sharesToBuy) * (buyOrder.avg_price || currentPrice),
        kalshi_order_id: buyOrder.order_id || null,
      })

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        position_id: position.id,
        action: 'position_created',
        details: {
          market_id,
          shares: buyOrder.filled_quantity || sharesToBuy,
          price: buyOrder.avg_price || currentPrice,
        },
      })

      // Fetch updated position
      const { data: updatedPosition } = await supabase
        .from('positions')
        .select('*')
        .eq('id', position.id)
        .single()

      return NextResponse.json({
        success: true,
        position: updatedPosition,
      })
    } catch (buyError: any) {
      // Mark position as error
      await supabase
        .from('positions')
        .update({
          status: 'error',
          error_message: buyError.message || 'Failed to execute buy order',
        })
        .eq('id', position.id)

      return NextResponse.json(
        { error: 'Failed to execute buy order', details: buyError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error creating position:', error)
    return NextResponse.json(
      { error: 'Failed to create position', details: error.message },
      { status: 500 }
    )
  }
}

