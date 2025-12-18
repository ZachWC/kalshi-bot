import { retryWithBackoff } from './lib/retry.js'

export async function sellPosition(supabase, userId, position, kalshi) {
  const MAX_RETRIES = 3

  try {
    // Verify position still exists and is active
    const { data: currentPosition } = await supabase
      .from('positions')
      .select('*')
      .eq('id', position.id)
      .single()

    if (!currentPosition || currentPosition.status !== 'active') {
      console.log(`[SKIP] Position ${position.id} no longer active`)
      return false
    }

    if (!currentPosition.shares_owned || currentPosition.shares_owned === 0) {
      console.log(`[SKIP] Position ${position.id} has no shares to sell`)
      return false
    }

    // Execute sell order with retry logic
    const sellOrder = await retryWithBackoff(
      async () => {
        return await kalshi.createMarketOrder({
          market_id: position.market_id,
          side: 'yes',
          quantity: currentPosition.shares_owned,
          type: 'market',
        })
      },
      MAX_RETRIES
    )

    // Calculate P&L
    const profitLoss = currentPosition.avg_buy_price
      ? (sellOrder.avg_price - currentPosition.avg_buy_price) * currentPosition.shares_owned
      : null

    // Record trade
    await supabase.from('trades').insert({
      user_id: userId,
      position_id: position.id,
      market_id: position.market_id,
      trade_type: 'sell',
      shares: currentPosition.shares_owned,
      price: sellOrder.avg_price,
      total_amount: sellOrder.avg_price * currentPosition.shares_owned,
      profit_loss: profitLoss,
      kalshi_order_id: sellOrder.order_id || null,
    })

    // Update position status
    await supabase
      .from('positions')
      .update({
        status: 'sold',
        current_price: sellOrder.avg_price,
        sold_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', position.id)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      position_id: position.id,
      action: 'position_sold',
      details: {
        shares: currentPosition.shares_owned,
        price: sellOrder.avg_price,
        profit_loss: profitLoss,
      },
    })

    console.log(
      `[SUCCESS] Sold position ${position.id} for $${sellOrder.avg_price.toFixed(4)} ` +
      `(P&L: ${profitLoss !== null ? (profitLoss >= 0 ? '+' : '') : ''}$${profitLoss?.toFixed(2) || 'N/A'})`
    )

    return true
  } catch (error) {
    console.error(`[ERROR] Failed to sell position ${position.id}:`, error)

    // Mark position as error
    await supabase
      .from('positions')
      .update({
        status: 'error',
        error_message: error.message || 'Failed to execute sell order',
        updated_at: new Date().toISOString(),
      })
      .eq('id', position.id)

    // Log error
    await supabase.from('activity_logs').insert({
      user_id: userId,
      position_id: position.id,
      action: 'sell_failed',
      details: { error: error.message },
    })

    return false
  }
}

