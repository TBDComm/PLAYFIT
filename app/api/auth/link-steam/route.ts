export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { parseSteamUrl, resolveVanityUrl } from '@/lib/steam'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: false })

  // 1. Verify session
  const supabase = createServerClient(
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

  // Start both independently — auth check and body parse have no dependency
  const sessionPromise = supabase.auth.getSession()
  const bodyPromise = request.json() as Promise<{ steamUrl?: unknown }>

  const { data: { session } } = await sessionPromise
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  // 2. Parse steamUrl → resolve to steam_id
  const body = await bodyPromise
  const steamUrl = typeof body.steamUrl === 'string' ? body.steamUrl.trim() : ''

  const parsed = parseSteamUrl(steamUrl)
  if (parsed.type === 'invalid') {
    return NextResponse.json({ error: 'INVALID_URL' }, { status: 400 })
  }

  const steamId = parsed.type === 'steamid'
    ? parsed.steamId
    : await resolveVanityUrl(parsed.vanity)

  if (!steamId) {
    return NextResponse.json({ error: 'INVALID_URL' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Start step 3 and step 5 independently — both only need steamId
  const existingProfilePromise = supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('steam_id', steamId)
    .maybeSingle()

  const anonWeightsPromise = supabaseAdmin
    .from('user_tag_weights')
    .select('tag, weight')
    .eq('steam_id', steamId)
    .is('user_id', null)

  // 3. Check if steam_id already linked to a different user
  const { data: existing } = await existingProfilePromise

  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: 'STEAM_ALREADY_LINKED' }, { status: 409 })
  }

  // 4. Link steam_id to current user (upsert — email/Google users have no row yet)
  const { error: updateProfileError } = await supabaseAdmin
    .from('user_profiles')
    .upsert({ id: session.user.id, steam_id: steamId }, { onConflict: 'id' })

  if (updateProfileError) {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }

  // 5. Migrate pre-login weights to user_id — merge if tag already exists under user_id
  const { data: anonWeights } = await anonWeightsPromise

  if (anonWeights && anonWeights.length > 0) {
    const anonTags = anonWeights.map((r: { tag: string; weight: number }) => r.tag)
    const { data: existingWeights } = await supabaseAdmin
      .from('user_tag_weights')
      .select('tag, weight')
      .eq('user_id', session.user.id)
      .in('tag', anonTags)

    const existingMap = new Map(
      (existingWeights ?? []).map((r: { tag: string; weight: number }) => [r.tag, r.weight])
    )
    const mergedRows = anonWeights.map(({ tag, weight }: { tag: string; weight: number }) => {
      const existing = existingMap.get(tag)
      const merged = existing !== undefined
        ? Math.min(3.0, Math.max(0.1, (weight + existing) / 2))
        : weight
      return { user_id: session.user.id, tag, weight: merged, updated_at: new Date().toISOString() }
    })

    await Promise.all([
      supabaseAdmin
        .from('user_tag_weights')
        .upsert(mergedRows, { onConflict: 'user_id,tag' }),
      supabaseAdmin
        .from('user_tag_weights')
        .delete()
        .eq('steam_id', steamId)
        .is('user_id', null),
    ])
  }

  return NextResponse.json({ ok: true, steam_id: steamId })
}
