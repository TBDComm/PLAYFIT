// app/icon.tsx
// Next.js App Router — generates /favicon.ico + /icon.png automatically
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons

import { ImageResponse } from 'next/og'

export const size      = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const cx = 16, cy = 16, r = 13
  const hex = Array.from({ length: 6 }, (_, i) => {
    const rad = ((-90 + 60 * i) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
  })
  const hexPath = hex.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

  // Double chevron — cg 4→3 (closer), strokeWidth 2.5→2.0 (thinner)
  const ch = 6.5, cw = 5, cg = 3
  const x0 = cx - (cw * 2 + cg) / 2

  return new ImageResponse(
    (
      <div
        style={{
          width: 32, height: 32,
          background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 32 32" width={32} height={32} fill="none">
          {/* Hex — subtle lime interior + crisp border */}
          <path d={hexPath} fill="rgba(197,241,53,0.08)" stroke="#C5F135" strokeWidth="1.4" strokeLinejoin="round"/>
          {/* Chevron 1 */}
          <polyline
            points={`${x0},${cy-ch} ${x0+cw},${cy} ${x0},${cy+ch}`}
            stroke="#C5F135" strokeWidth="2.0"
            strokeLinecap="butt" strokeLinejoin="miter"
            fill="none"
          />
          {/* Chevron 2 */}
          <polyline
            points={`${x0+cw+cg},${cy-ch} ${x0+cw*2+cg},${cy} ${x0+cw+cg},${cy+ch}`}
            stroke="#C5F135" strokeWidth="2.0"
            strokeLinecap="butt" strokeLinejoin="miter"
            fill="none" opacity={0.48}
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
