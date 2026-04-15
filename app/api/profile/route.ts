export const runtime = 'edge'

import { serviceSupabase } from '@/lib/supabase'

const DISPLAY_NAME_MAX = 50
const BIO_MAX = 160

async function getUser(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await serviceSupabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function GET(req: Request) {
  const user = await getUser(req)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await serviceSupabase
    .from('user_profiles')
    .select('display_name, bio, is_public')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return Response.json({ error: 'DB error' }, { status: 500 })

  return Response.json({
    display_name: data?.display_name ?? null,
    bio: data?.bio ?? null,
    is_public: data?.is_public ?? false,
  })
}

export async function PUT(req: Request) {
  const [user, body] = await Promise.all([
    getUser(req),
    req.json() as Promise<{ display_name?: unknown; bio?: unknown; is_public?: unknown }>,
  ])
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : null
  const bio = typeof body.bio === 'string' ? body.bio.trim() : null
  const isPublic = typeof body.is_public === 'boolean' ? body.is_public : false

  if (displayName !== null && displayName.length > DISPLAY_NAME_MAX) {
    return Response.json({ error: 'DISPLAY_NAME_TOO_LONG' }, { status: 400 })
  }
  if (bio !== null && bio.length > BIO_MAX) {
    return Response.json({ error: 'BIO_TOO_LONG' }, { status: 400 })
  }

  const { error } = await serviceSupabase
    .from('user_profiles')
    .update({
      display_name: displayName || null,
      bio: bio || null,
      is_public: isPublic,
    })
    .eq('id', user.id)

  if (error) return Response.json({ error: 'DB error' }, { status: 500 })
  return Response.json({ ok: true })
}
