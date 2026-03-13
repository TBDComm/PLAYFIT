export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      game_id?: unknown
      game_name?: unknown
      steam_id?: unknown
      play_profile?: unknown
      rating?: unknown
    }

    const { error } = await supabase.from('feedback').insert({
      game_id:     typeof body.game_id   === 'string' ? body.game_id   : null,
      game_name:   typeof body.game_name === 'string' ? body.game_name : null,
      steam_id:    typeof body.steam_id  === 'string' ? body.steam_id  : null,
      play_profile: Array.isArray(body.play_profile)  ? body.play_profile : null,
      rating:      typeof body.rating    === 'string' ? body.rating    : null,
    })

    if (error) return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }
}
