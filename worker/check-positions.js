import { KalshiAPI } from './lib/kalshi-api.js'
import { decrypt } from './lib/encryption.js'
import { sellPosition } from './sell-position.js'

export async function checkUserPositions(supabase, userId, positions) {
  let soldCount = 0

  try {
    // Get user's Kalshi credentials
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('kalshi_api_key, kalshi_api_secret')
      .eq('user_id', userId)
      .single()

    if (settingsError || !settings?.kalshi_api_key) {
      console.log(`[SKIP] User ${userId} has no Kalshi credentials`)
      return 0
    }

    // Initialize Kalshi client
    let apiKey, apiSecret
    try {
      apiKey = decrypt(settings.kalshi_api_key)
      apiSecret = decrypt(settings.kalshi_api_secret)
    } catch (decryptError) {
      console.error(`[ERROR] Failed to decrypt credentials for user ${userId}:`, decryptError)
      return 0
    }

    const kalshi = new KalshiAPI({ apiKey, apiSecret })

    // Get current prices for all markets (deduplicate market IDs)
    const marketIds = [...new Set(positions.map(p => p.market_id))]
    const pricePromises = marketIds.map(async (id) => {
      try {
        return { id, price: await kalshi.getMarketPrice(id) }
      } catch (err) {
        console.error(`[ERROR] Failed to get price for ${id}:`, err.message)
        return { id, price: null }
      }
    })

    const priceResults = await Promise.all(pricePromises)
    const priceMap = Object.fromEntries(
      priceResults.map(r => [r.id, r.price])
    )

    // Check each position
    for (const position of positions) {
      const currentPrice = priceMap[position.market_id]

      if (currentPrice === null || currentPrice === undefined) {
        console.error(`[ERROR] No price for position ${position.id}`)
        continue
      }

      const currentPct = currentPrice * 100

      // Update position with current price
      await supabase
        .from('positions')
        .update({
          current_price: currentPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', position.id)

      // Check if we should sell
      if (currentPct >= position.target_sell_pct) {
        console.log(
          `[SELL] Position ${position.id} hit target! ` +
          `${currentPct.toFixed(1)}% >= ${position.target_sell_pct}%`
        )
        const success = await sellPosition(supabase, userId, position, kalshi)
        if (success) soldCount++
      }
    }

    return soldCount
  } catch (error) {
    console.error(`[ERROR] Failed to check positions for user ${userId}:`, error)

    // Log error to database
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'monitoring_error',
      details: { error: error.message },
    })

    return soldCount
  }
}

