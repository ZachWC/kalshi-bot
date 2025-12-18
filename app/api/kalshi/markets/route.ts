import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KalshiAPI } from '@/lib/kalshi/api'
import { getUserKalshiCredentials } from '@/lib/positions/get-user-credentials'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const credentials = await getUserKalshiCredentials(user.id)
    const kalshi = new KalshiAPI(credentials)

    const markets = await kalshi.searchMarkets(query)

    return NextResponse.json({ markets })
  } catch (error: any) {
    console.error('Error searching markets:', error)
    return NextResponse.json(
      { error: 'Failed to search markets', details: error.message },
      { status: 500 }
    )
  }
}

