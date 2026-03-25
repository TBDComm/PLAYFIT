// app/icon.tsx  (or app/favicon.tsx)
// Next.js App Router — generates favicon automatically via ImageResponse
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons

import { ImageResponse } from 'next/og'

export const size      = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const cx = 16, cy = 16, r = 14
  const hex = Array.from({ length: 6 }, (_, i) => {
    const rad = ((-90 + 60 * i) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
  })
  const hexPath = hex.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

  // Double chevron — centered
  const ch = 7, cw = 5.5, cg = 4.5
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
          {/* Hex */}
          <path d={hexPath} fill="#0A0A0A" stroke="#C5F135" strokeWidth="0.8" strokeLinejoin="round"/>
          {/* Chevron 1 */}
          <polyline
            points={`${x0},${cy-ch} ${x0+cw},${cy} ${x0},${cy+ch}`}
            stroke="#C5F135" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            fill="none"
          />
          {/* Chevron 2 */}
          <polyline
            points={`${x0+cw+cg},${cy-ch} ${x0+cw*2+cg},${cy} ${x0+cw+cg},${cy+ch}`}
            stroke="#C5F135" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            fill="none" opacity={0.38}
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
