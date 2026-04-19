export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { updateSquadSessionName } from '@/lib/supabase'

interface Props {
  params: Promise<{ token: string }>
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const [cookieStore, { token }] = await Promise.all([cookies(), params])

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json() as { name?: unknown }
  const name = typeof body.name === 'string' ? body.name.slice(0, 60) : ''

  try {
    await updateSquadSessionName(token, session.user.id, name)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }
}
