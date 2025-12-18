import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete credentials
    const { error: deleteError } = await supabase
      .from('user_settings')
      .update({
        kalshi_api_key: null,
        kalshi_api_secret: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
    }

    // Cancel active positions
    const { error: cancelError } = await supabase
      .from('positions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (cancelError) {
      console.error('Error cancelling positions:', cancelError)
      // Don't fail the request if cancelling positions fails
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'kalshi_disconnected',
      details: {},
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error disconnecting Kalshi:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Kalshi account', details: error.message },
      { status: 500 }
    )
  }
}



