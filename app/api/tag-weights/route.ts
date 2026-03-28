export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUser(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = getSupabase()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return { user, supabase }
}

export async function GET(req: Request) {
  const auth = await getUser(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { user, supabase } = auth

  // Profile and user_id weights have no dependency on each other — fetch in parallel
  const [profileResult, byUserId] = await Promise.all([
    supabase.from('user_profiles').select('steam_id').eq('id', user.id).maybeSingle(),
    supabase.from('user_tag_weights').select('tag, weight').eq('user_id', user.id),
  ])

  const steamId = profileResult.data?.steam_id ?? null

  // steam_id query depends on steamId — run after profile resolves
  const bySteamId = steamId
    ? await supabase
        .from('user_tag_weights')
        .select('tag, weight')
        .eq('steam_id', steamId)
        .is('user_id', null)  // only rows not already claimed by a user_id
    : { data: [] }

  // Merge: user_id rows win for the same tag
  const merged = new Map<string, number>()
  for (const row of (bySteamId.data ?? [])) {
    merged.set(row.tag, row.weight)
  }
  for (const row of (byUserId.data ?? [])) {
    merged.set(row.tag, row.weight)  // overwrites steam_id entry for same tag
  }

  const weights = Array.from(merged.entries())
    .map(([tag, weight]) => ({ tag, weight }))
    .sort((a, b) => b.weight - a.weight)

  return Response.json({ weights })
}

export async function PUT(req: Request) {
  const [auth, body] = await Promise.all([
    getUser(req),
    req.json() as Promise<{ weights?: unknown }>,
  ])
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!Array.isArray(body.weights)) {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const rows = (body.weights as Array<{ tag?: unknown; weight?: unknown }>)
    .filter(
      (r) =>
        typeof r.tag === 'string' &&
        r.tag.length > 0 &&
        typeof r.weight === 'number' &&
        r.weight >= 0.1 &&
        r.weight <= 3.0
    )
    .map((r) => ({
      user_id: auth.user.id,
      tag: r.tag as string,
      weight: Math.round((r.weight as number) * 100) / 100,
      updated_at: new Date().toISOString(),
    }))

  if (rows.length === 0) {
    return Response.json({ ok: true })
  }

  const { error } = await auth.supabase
    .from('user_tag_weights')
    .upsert(rows, { onConflict: 'user_id,tag' })

  if (error) return Response.json({ error: 'DB error' }, { status: 500 })
  return Response.json({ ok: true })
}
