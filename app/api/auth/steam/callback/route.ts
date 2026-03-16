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

  if (verifyText.includes('is_valid:false')) {
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
  }

  // 6. Generate magic link → Supabase will set session cookie via /api/auth/callback
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${BASE_URL}/api/auth/callback`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return Response.redirect(`${BASE_URL}/?auth_error=session_failed`)
  }

  return Response.redirect(linkData.properties.action_link)
}
