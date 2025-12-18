import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KalshiAPI } from '@/lib/kalshi/api'
import { decrypt } from '@/lib/encryption'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { api_key, api_secret } = await request.json()

    if (!api_key || !api_secret) {
      return NextResponse.json({ error: 'API key and secret are required' }, { status: 400 })
    }

    // Test connection
    try {
      const kalshi = new KalshiAPI({ apiKey: api_key, apiSecret: api_secret })
      const isValid = await kalshi.testConnection()
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Kalshi API credentials' }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Connection successful' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to connect to Kalshi API', details: error.message },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error testing Kalshi connection:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

