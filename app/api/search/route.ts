import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

type SteamSuggestItem = { id: string; name: string }

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  const isKorean = /[\uAC00-\uD7A3]/.test(q)

  if (isKorean) {
    const steamUrl = `https://store.steampowered.com/search/suggest?term=${encodeURIComponent(q)}&f=games&l=koreana&cc=KR`
    let steamData: SteamSuggestItem[]
    try {
      const steamRes = await fetch(steamUrl)
      if (!steamRes.ok) return NextResponse.json([])
      steamData = await steamRes.json() as SteamSuggestItem[]
      if (!Array.isArray(steamData) || steamData.length === 0) return NextResponse.json([])
    } catch {
      return NextResponse.json([])
    }

    const appids = steamData.slice(0, 10).map(item => Number(item.id)).filter(id => id > 0)
    if (appids.length === 0) return NextResponse.json([])

    const { data, error } = await supabase
      .from('games_cache')
      .select('appid, name')
      .in('appid', appids)

    if (error || !data?.length) return NextResponse.json([])

    const appidToKoreanName: Record<number, string> = {}
    for (const item of steamData) {
      appidToKoreanName[Number(item.id)] = item.name
    }

    return NextResponse.json(
      data.map(row => ({
        appid: Number(row.appid),
        name: row.name as string,
        displayName: appidToKoreanName[Number(row.appid)] ?? row.name,
      }))
    )
  }

  // English search — existing flow
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
