export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

  // 1. Verify with Steam
  const verifyParams = new URLSearchParams()
  verifyParams.set('openid.mode', 'check_authentication')
  searchParams.forEach((value, key) => {
    if (key !== 'openid.mode') verifyParams.set(key, value)
  })

  const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  })
  const verifyText = await verifyRes.text()

  if (!verifyText.includes('is_valid:true')) {
    return Response.redirect(`${BASE_URL}/?auth_error=steam_invalid`)
  }

  // 2. Extract steamid64
  const claimedId = searchParams.get('openid.claimed_id') ?? ''
  const match = claimedId.match(/\/id\/(\d+)$/)
  if (!match) {
    return Response.redirect(`${BASE_URL}/?auth_error=steam_id_missing`)
  }
  const steamId = match[1]
  const email = `${steamId}@steam.playfit`

  // 3. Admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 4. Find existing user_profile with this steam_id
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('steam_id', steamId)
    .maybeSingle()

  // loginEmail: Steam 전용 email이 기본값.
  // Google/이메일 계정에 Steam을 연동한 유저가 Steam 버튼으로 로그인할 경우
  // 실제 계정 email로 교체하지 않으면 새 계정이 생성됨 → 버그.
  let loginEmail = email

  if (!profile) {
    // 5. Create new auth.users + user_profiles row
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    })
    if (createError || !newUser.user) {
      return Response.redirect(`${BASE_URL}/?auth_error=user_create_failed`)
    }
    const { error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({ id: newUser.user.id, steam_id: steamId })
    if (insertError) {
      return Response.redirect(`${BASE_URL}/?auth_error=profile_insert_failed`)
    }
  } else {
    // 5b. Profile exists — 실제 auth user의 email 조회 (Google/이메일 계정일 수 있음)
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    if (userData?.user?.email) {
      loginEmail = userData.user.email
    }
    // 조회 실패 시 loginEmail은 steam email 유지 — 기존 Steam 전용 유저는 정상 로그인됨
  }

  // 6. Generate magic link → Supabase will set session cookie via /api/auth/callback
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: loginEmail,
    options: {
      redirectTo: `${BASE_URL}/api/auth/callback`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return Response.redirect(`${BASE_URL}/?auth_error=session_failed`)
  }

  return Response.redirect(linkData.properties.action_link)
}
