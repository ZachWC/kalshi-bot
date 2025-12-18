import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: position, error } = await supabase
      .from('positions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Position not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ position })
  } catch (error: any) {
    console.error('Error fetching position:', error)
    return NextResponse.json(
      { error: 'Failed to fetch position', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    if (body.target_sell_pct !== undefined) {
      if (body.target_sell_pct <= 0 || body.target_sell_pct > 100) {
        return NextResponse.json(
          { error: 'Target sell percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
      updates.target_sell_pct = body.target_sell_pct
    }

    const { data: position, error } = await supabase
      .from('positions')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Position not found' }, { status: 404 })
      }
      throw error
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      position_id: params.id,
      action: 'position_updated',
      details: updates,
    })

    return NextResponse.json({ success: true, position })
  } catch (error: any) {
    console.error('Error updating position:', error)
    return NextResponse.json(
      { error: 'Failed to update position', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if position exists and belongs to user
    const { data: position, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    // Only allow cancellation of pending or active positions
    if (position.status !== 'pending' && position.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only cancel pending or active positions' },
        { status: 400 }
      )
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('positions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      position_id: params.id,
      action: 'position_cancelled',
      details: {},
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling position:', error)
    return NextResponse.json(
      { error: 'Failed to cancel position', details: error.message },
      { status: 500 }
    )
  }
}

