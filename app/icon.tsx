// app/icon.tsx
// Next.js App Router — generates /favicon.ico + /icon.png automatically
// Uses guildeline-logo.png (mark only, transparent bg)

import { ImageResponse } from 'next/og'

export const size      = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, background: 'transparent', display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${base}/guildeline-logo.png`} width={32} height={32} alt="" />
      </div>
    ),
    { ...size }
  )
}
