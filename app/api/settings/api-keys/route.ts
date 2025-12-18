import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'
import { KalshiAPI } from '@/lib/kalshi/api'

export const dynamic = 'force-dynamic'

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

    // Validate credentials work
    try {
      const kalshi = new KalshiAPI({ apiKey: api_key, apiSecret: api_secret })
      const isValid = await kalshi.testConnection()
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Kalshi API credentials' }, { status: 400 })
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to validate credentials', details: error.message },
        { status: 400 }
      )
    }

    // Encrypt before storing
    const encryptedKey = encrypt(api_key)
    const encryptedSecret = encrypt(api_secret)

    // Store in database (upsert to handle existing user)
    const { error: dbError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        kalshi_api_key: encryptedKey,
        kalshi_api_secret: encryptedSecret,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

