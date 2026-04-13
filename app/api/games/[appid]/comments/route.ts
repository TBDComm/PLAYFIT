import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { GameComment } from '@/types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// 시간당 유저당 최대 댓글 수
const RATE_LIMIT = 5

function createSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
}

// GET /api/games/[appid]/comments
// 공개. parent_id null인 루트 댓글 + 대댓글 flat 반환 (최신순 100개)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appid: string }> }
) {
  const { appid } = await params
  const cookieStore = await cookies()
  const supabase = createSupabase(cookieStore)

  const { data, error } = await supabase
    .from('game_comments')
    .select('id, appid, user_id, body, parent_id, created_at')
    .eq('appid', appid)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ comments: (data ?? []) as GameComment[] })
}

// POST /api/games/[appid]/comments
// 로그인 필수. body { body: string, parent_id?: string }
// rate limit: 1시간에 5개
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appid: string }> }
) {
  const { appid } = await params
  const [cookieStore, body] = await Promise.all([
    cookies(),
    req.json() as Promise<{ body?: unknown; parent_id?: unknown }>,
  ])
  const supabase = createSupabase(cookieStore)

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const userId = session.user.id

  // 입력 검증
  const commentBody = typeof body.body === 'string' ? body.body.trim() : ''
  if (!commentBody || commentBody.length > 500) {
    return NextResponse.json({ error: '댓글은 1~500자 사이여야 합니다.' }, { status: 400 })
  }
  const parentId = typeof body.parent_id === 'string' ? body.parent_id : null

  // rate limit: 최근 1시간 댓글 수 확인
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('game_comments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo)

  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json(
      { error: '1시간에 최대 5개의 댓글을 작성할 수 있습니다.' },
      { status: 429 }
    )
  }

  // 삽입
  const { data, error } = await supabase
    .from('game_comments')
    .insert({ appid, user_id: userId, body: commentBody, parent_id: parentId })
    .select('id, appid, user_id, body, parent_id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }

  return NextResponse.json({ comment: data as GameComment }, { status: 201 })
}

// DELETE /api/games/[appid]/comments?id=<comment_id>
// 로그인 필수, 본인 댓글만 삭제 (RLS가 이중 보호)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appid: string }> }
) {
  await params // appid 불필요하지만 시그니처 일치
  const commentId = req.nextUrl.searchParams.get('id')
  if (!commentId) {
    return NextResponse.json({ error: '삭제할 댓글 id가 필요합니다.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createSupabase(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // RLS가 본인 댓글만 삭제 허용 — 별도 소유권 쿼리 불필요
  const { error } = await supabase
    .from('game_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', session.user.id) // 명시적 필터 (RLS 이중 보호)

  if (error) {
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
