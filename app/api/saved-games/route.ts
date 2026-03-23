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
  return { user, token, supabase }
}

export async function GET(req: Request) {
  const auth = await getUser(req)
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await auth.supabase
    .from('saved_games')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('saved_at', { ascending: false })

  if (error) return Response.json({ error: 'DB error' }, { status: 500 })
  return Response.json({ saved: data })
}

export async function POST(req: Request) {
  const [auth, body] = await Promise.all([
    getUser(req),
    req.json() as Promise<{
      appid: string
      name: string
      reason?: string
      price_krw?: number
      metacritic_score?: number
    }>,
  ])
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await auth.supabase
    .from('saved_games')
    .upsert({
      user_id: auth.user.id,
      appid: body.appid,
      name: body.name,
      reason: body.reason ?? null,
      price_krw: body.price_krw ?? null,
      metacritic_score: body.metacritic_score ?? null,
    }, { onConflict: 'user_id,appid' })

  if (error) return Response.json({ error: 'DB error' }, { status: 500 })
  return Response.json({ ok: true })
}
