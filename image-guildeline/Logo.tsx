// components/Logo.tsx
// Guildeline — Primary Logo Component
// Font: Space Grotesk 900 (next/font/google)
// Icon: Hexagon + double chevron (SVG, no external deps)

import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
})

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
  lightBg?: boolean
}

const sizes = {
  sm: { icon: 28, fontSize: 20, gap: 10 },
  md: { icon: 40, fontSize: 28, gap: 14 },
  lg: { icon: 56, fontSize: 40, gap: 18 },
}

export function Logo({ size = 'md', iconOnly = false, lightBg = false }: LogoProps) {
  const s = sizes[size]
  const limeColor  = '#C5F135'
  const whiteColor = lightBg ? '#0A0A0A' : '#F5F5F0'
  const hexStroke  = lightBg ? 'rgba(0,0,0,0.5)' : limeColor
  const hexFill    = lightBg ? 'rgba(0,0,0,0.05)' : '#c5f135'
  const chevColor  = lightBg ? '#0A0A0A' : limeColor
  const chevDim    = lightBg ? 'rgba(0,0,0,0.3)' : '#c5f135'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <GuildelineIcon
        size={s.icon}
        hexFill={hexFill}
        hexStroke={hexStroke}
        chevColor={chevColor}
        chevDim={chevDim}
      />
      {!iconOnly && (
        <span
          className={spaceGrotesk.className}
          style={{ fontSize: s.fontSize, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}
        >
          <span style={{ color: limeColor }}>GUILD</span>
          <span style={{ color: whiteColor }}>ELINE</span>
        </span>
      )}
    </div>
  )
}

// ── Icon-only mark (also used for favicon) ────────────────────────────────────
interface IconProps {
  size?: number
  hexFill?: string
  hexStroke?: string
  chevColor?: string
  chevDim?: string
}

export function GuildelineIcon({
  size = 40,
  hexFill    = 'rgba(197,241,53,0.07)',
  hexStroke  = '#C5F135',
  chevColor  = '#C5F135',
  chevDim    = 'rgba(197, 241, 53, 0.38)',
}: IconProps) {
  // Hexagon: flat-top, viewBox 0 0 52 52, center (26,26), radius 24
  // Points: 6 vertices at -90° + 60°*i
  const cx = 26, cy = 26, r = 23
  const hex = Array.from({ length: 6 }, (_, i) => {
    const deg = -90 + 60 * i
    const rad = (deg * Math.PI) / 180
    return `${(cx + r * Math.cos(rad)).toFixed(2)},${(cy + r * Math.sin(rad)).toFixed(2)}`
  }).join(' ')

  // Double chevron — centered at (26,26)
  // Each chevron: width=9, height=12 (half), gap=7 between two chevrons
  // Total width = 9+7+9 = 25 → start x = 26 - 25/2 = 13.5
  const ch = 12  // half-height
  const cw = 9   // width of one chevron
  const cg = 7   // gap between chevrons
  const x0 = cx - (cw * 2 + cg) / 2

  const c1 = `${x0},${cy - ch} ${x0 + cw},${cy} ${x0},${cy + ch}`
  const c2 = `${x0 + cw + cg},${cy - ch} ${x0 + cw * 2 + cg},${cy} ${x0 + cw + cg},${cy + ch}`

  return (
    <svg
      viewBox="0 0 52 52"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon */}
      <polygon
        points={hex}
        fill={hexFill}
        stroke={hexStroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Chevron 1 — bright */}
      <polyline
        points={c1}
        stroke={chevColor}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Chevron 2 — dim */}
      <polyline
        points={c2}
        stroke={chevColor}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={chevDim === '#c5f135' ? 0.38 : 0.3}
      />
    </svg>
  )
}
