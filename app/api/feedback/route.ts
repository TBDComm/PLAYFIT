export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase'
import type { FeedbackRating } from '@/types'

async function getUserId(request: NextRequest): Promise<string | null> {
  // Prefer explicit Bearer token (sent by result page when logged in)
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (token) {
    const service = serviceSupabase
    const { data: { user } } = await service.auth.getUser(token)
    return user?.id ?? null
  }

  // Fallback: cookie-based session (anon / Steam-only users)
  const response = NextResponse.json({})
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  const { data: { session } } = await supabaseAuth.auth.getSession()
  return session?.user?.id ?? null
}

export async function POST(request: NextRequest) {
  try {
    const [userId, body] = await Promise.all([
      getUserId(request),
      request.json() as Promise<{
        game_id?: unknown
        game_name?: unknown
        steam_id?: unknown
        play_profile?: unknown
        rating?: unknown
        tag_snapshot?: unknown
      }>,
    ])

    const game_id = typeof body.game_id === 'string' ? body.game_id : ''
    const game_name = typeof body.game_name === 'string' ? body.game_name : ''
    const steam_id = typeof body.steam_id === 'string' ? body.steam_id : ''
    const play_profile = Array.isArray(body.play_profile) ? body.play_profile : []
    const rating = (body.rating === 'positive' || body.rating === 'negative')
      ? body.rating as FeedbackRating
      : null
    const tag_snapshot = Array.isArray(body.tag_snapshot)
      ? body.tag_snapshot.filter((t): t is string => typeof t === 'string')
      : []

    if (!game_id || !rating) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    // Weights update requires a rating, at least one identifier, and tags to act on
    const weightFetchNeeded = !!rating && (userId !== null || !!steam_id) && tag_snapshot.length > 0



    // Insert feedback and fetch current weights in parallel
    const [insertResult, existingWeights] = await Promise.all([
      serviceSupabase.from('feedback').insert({
        game_id,
        game_name,
        user_id: userId,
        steam_id: steam_id || null,
        play_profile,
        rating,
        tag_snapshot,
      }),
      weightFetchNeeded
        ? userId !== null
          ? serviceSupabase.from('user_tag_weights').select('tag, weight').eq('user_id', userId).in('tag', tag_snapshot)
          : serviceSupabase.from('user_tag_weights').select('tag, weight').eq('steam_id', steam_id).in('tag', tag_snapshot)
        : Promise.resolve({ data: null }),
    ])

    if (insertResult.error) {
      return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
    }

    if (weightFetchNeeded) {
      const existingMap = new Map(
        (existingWeights.data ?? []).map((r: { tag: string; weight: number }) => [r.tag, r.weight])
      )

      if (userId !== null) {
        // Logged in: upsert by user_id
        const rows = tag_snapshot.map(tag => {
          const current: number | null = existingMap.has(tag) ? existingMap.get(tag)! : null
          const weight = rating === 'positive'
            ? current === null ? 1.2 : Math.min(current + 0.2, 3.0)
            : current === null ? 0.7 : Math.max(current - 0.3, 0.1)
          return { user_id: userId, tag, weight, updated_at: new Date().toISOString() }
        })
        await serviceSupabase.from('user_tag_weights').upsert(rows, { onConflict: 'user_id,tag' })
      } else {
        // No session: upsert by steam_id
        const rows = tag_snapshot.map(tag => {
          const current: number | null = existingMap.has(tag) ? existingMap.get(tag)! : null
          const weight = rating === 'positive'
            ? current === null ? 1.2 : Math.min(current + 0.2, 3.0)
            : current === null ? 0.7 : Math.max(current - 0.3, 0.1)
          return { steam_id, tag, weight, updated_at: new Date().toISOString() }
        })
        await serviceSupabase.from('user_tag_weights').upsert(rows, { onConflict: 'steam_id,tag' })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }
}
