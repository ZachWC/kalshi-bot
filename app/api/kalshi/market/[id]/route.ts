import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KalshiAPI } from '@/lib/kalshi/api'
import { getUserKalshiCredentials } from '@/lib/positions/get-user-credentials'

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

    const credentials = await getUserKalshiCredentials(user.id)
    const kalshi = new KalshiAPI(credentials)

    const market = await kalshi.getMarket(params.id)

    return NextResponse.json({ market })
  } catch (error: any) {
    console.error('Error fetching market:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market', details: error.message },
      { status: 500 }
    )
  }
}

