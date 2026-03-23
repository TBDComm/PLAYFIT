export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: Request, context: { params: Promise<{ appid: string }> }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: { user }, error: userError }, { appid }] = await Promise.all([
    supabase.auth.getUser(token),
    context.params,
  ])
  if (userError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('saved_games')
    .delete()
    .eq('user_id', user.id)
    .eq('appid', appid)

  if (error) return Response.json({ error: 'DB error' }, { status: 500 })
  return Response.json({ ok: true })
}
