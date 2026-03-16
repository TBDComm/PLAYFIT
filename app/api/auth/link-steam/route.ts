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

  // 3. Check if steam_id already linked to a different user
  const { data: existing } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('steam_id', steamId)
    .maybeSingle()

  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: 'STEAM_ALREADY_LINKED' }, { status: 409 })
  }

  // 4. Link steam_id to current user
  const { error: updateProfileError } = await supabaseAdmin
    .from('user_profiles')
    .update({ steam_id: steamId })
    .eq('id', session.user.id)

  if (updateProfileError) {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }

  // 5. Migrate pre-login weights to user_id
  await supabaseAdmin
    .from('user_tag_weights')
    .update({ user_id: session.user.id })
    .eq('steam_id', steamId)
    .is('user_id', null)

  return NextResponse.json({ ok: true, steam_id: steamId })
}
