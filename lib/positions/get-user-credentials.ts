import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export async function getUserKalshiCredentials(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('kalshi_api_key, kalshi_api_secret')
    .eq('user_id', userId)
    .single()
  
  if (error || !data?.kalshi_api_key) {
    throw new Error('Kalshi credentials not found')
  }
  
  return {
    apiKey: decrypt(data.kalshi_api_key),
    apiSecret: decrypt(data.kalshi_api_secret)
  }
}

