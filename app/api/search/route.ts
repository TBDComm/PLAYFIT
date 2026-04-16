import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  // LIKE 와일드카드 이스케이프 — `%`와 `_`는 SQL LIKE 특수문자
  const escaped = q.replace(/[%_\\]/g, '\\$&')

  // English name search against games_cache
  const { data, error } = await supabase
    .from('games_cache')
    .select('appid, name')
    .ilike('name', `%${escaped}%`)
    .limit(10)

  if (error) return NextResponse.json([], { status: 500 })

  return NextResponse.json(
    (data ?? []).map(row => ({ appid: Number(row.appid), name: row.name as string }))
  )
}
