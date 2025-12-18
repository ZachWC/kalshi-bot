import { checkUserPositions } from './check-positions.js'

export async function monitoringLoop(supabase, interval) {
  while (true) {
    const runStartTime = Date.now()

    try {
      console.log('[MONITOR] Starting monitoring cycle...')

      // Create monitoring run record
      const { data: monitoringRun, error: runError } = await supabase
        .from('monitoring_runs')
        .insert({ status: 'running' })
        .select()
        .single()

      if (runError) {
        console.error('[ERROR] Failed to create monitoring run:', runError)
      }

      // Get all active positions
      const { data: activePositions, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .eq('status', 'active')

      if (positionsError) {
        throw positionsError
      }

      console.log(`[MONITOR] Checking ${activePositions?.length || 0} positions`)

      let positionsSold = 0
      let errors = 0

      // Group by user to batch API calls
      const positionsByUser = {}
      for (const position of activePositions || []) {
        if (!positionsByUser[position.user_id]) {
          positionsByUser[position.user_id] = []
        }
        positionsByUser[position.user_id].push(position)
      }

      // Check each user's positions
      for (const [userId, positions] of Object.entries(positionsByUser)) {
        try {
          const sold = await checkUserPositions(supabase, userId, positions)
          positionsSold += sold
        } catch (error) {
          console.error(`[ERROR] Failed for user ${userId}:`, error)
          errors++

          // Log error to database
          await supabase.from('activity_logs').insert({
            user_id: userId,
            action: 'monitoring_error',
            details: { error: error.message },
          })
        }
      }

      // Complete monitoring run
      if (monitoringRun) {
        await supabase
          .from('monitoring_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            positions_checked: activePositions?.length || 0,
            positions_sold: positionsSold,
            errors,
          })
          .eq('id', monitoringRun.id)
      }

      console.log(`[MONITOR] Cycle complete. Sold: ${positionsSold}, Errors: ${errors}`)
    } catch (error) {
      console.error('[MONITOR] Error in monitoring loop:', error)
    }

    // Wait for next cycle
    const elapsed = Date.now() - runStartTime
    const waitTime = Math.max(interval - elapsed, 0)
    console.log(`[MONITOR] Waiting ${Math.floor(waitTime / 1000)}s until next cycle...`)
    await sleep(waitTime)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}



