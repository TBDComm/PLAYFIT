import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ debug: 'q is empty', received: url.searchParams.get('q') })

  const { data, error } = await supabase
    .from('games_cache')
    .select('appid, name')
    .ilike('name', `%${q}%`)
    .limit(10)

  if (error) return NextResponse.json({ debug: 'supabase_error', error: error.message, code: error.code, q }, { status: 500 })

  return NextResponse.json({ debug: 'ok', q, count: data?.length ?? 0, data: data ?? [] })
}
