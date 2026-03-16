export const runtime = 'edge'

export async function GET(request: Request) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${BASE_URL}/api/auth/steam/callback`,
    'openid.realm': BASE_URL,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  return Response.redirect(`https://steamcommunity.com/openid/login?${params}`)
}
