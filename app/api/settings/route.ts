import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return NextResponse.json({
          timezone: 'America/New_York',
          default_target_pct: 65.00,
          email_notifications: true,
        })
      }
      throw error
    }

    // Don't return encrypted keys
    const { kalshi_api_key, kalshi_api_secret, ...settings } = data

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.timezone) updates.timezone = body.timezone
    if (body.default_target_pct !== undefined) updates.default_target_pct = body.default_target_pct
    if (body.email_notifications !== undefined) updates.email_notifications = body.email_notifications

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...updates,
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

