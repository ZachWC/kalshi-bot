import { createClient } from '@supabase/supabase-js'
import { monitoringLoop } from './monitoring-loop.js'

const MONITORING_INTERVAL = parseInt(process.env.WORKER_INTERVAL_MS || '60000', 10)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('[WORKER] Starting Kalshi Auto-Sell Worker')
console.log(`[WORKER] Monitoring interval: ${MONITORING_INTERVAL}ms`)

// Start the monitoring loop
monitoringLoop(supabase, MONITORING_INTERVAL).catch(error => {
  console.error('[FATAL] Worker crashed:', error)
  process.exit(1)
})

