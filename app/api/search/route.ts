import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  // English name search against games_cache
  const { data, error } = await supabase
    .from('games_cache')
    .select('appid, name')
    .ilike('name', `%${q}%`)
    .limit(10)

  if (error) return NextResponse.json([], { status: 500 })

  return NextResponse.json(
    (data ?? []).map(row => ({ appid: Number(row.appid), name: row.name as string }))
  )
}
