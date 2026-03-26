// Guildeline mark + wordmark — used in auth modals and reset-password page
// Inline SVG: always a mathematically regular hexagon, scales to any size

import styles from './GuildelineMark.module.css'

interface GuildelineMarkProps {
  size?: number
}

// Geometry ratios derived from canonical favicon reference (size=32, r=13)
const R_RATIO    = 13 / 16   // r = halfSize * R_RATIO
const HEX_SW     = 1.4 / 32  // hex strokeWidth / size
const CH_R       = 6.5 / 32  // chevron half-height / size
const CW_R       = 5   / 32  // chevron width / size
const CG_R       = 3   / 32  // chevron gap / size
const CHEV_SW    = 2.0 / 32  // chevron strokeWidth / size

export default function GuildelineMark({ size = 48 }: GuildelineMarkProps) {
  const cx = size / 2
  const cy = size / 2
  const r  = cx * R_RATIO

  const hexPts = Array.from({ length: 6 }, (_, i) => {
    const rad = ((-90 + 60 * i) * Math.PI) / 180
    return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`
  }).join(' ')

  const hexSW  = size * HEX_SW
  const ch     = size * CH_R
  const cw     = size * CW_R
  const cg     = size * CG_R
  const chevSW = size * CHEV_SW
  const x0     = cx - (cw * 2 + cg) / 2

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <polygon
          points={hexPts}
          fill="rgba(197,241,53,0.08)"
          stroke="#C5F135"
          strokeWidth={hexSW}
          strokeLinejoin="round"
        />
        <polyline
          points={`${x0},${cy - ch} ${x0 + cw},${cy} ${x0},${cy + ch}`}
          stroke="#C5F135"
          strokeWidth={chevSW}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          fill="none"
        />
        <polyline
          points={`${x0 + cw + cg},${cy - ch} ${x0 + cw * 2 + cg},${cy} ${x0 + cw + cg},${cy + ch}`}
          stroke="#C5F135"
          strokeWidth={chevSW}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          fill="none"
          opacity={0.48}
        />
      </svg>
      <span className={styles.wordmark} style={{ fontSize: Math.round(size * 0.5) }}>
        <span className={styles.accent}>GUILD</span>ELINE
      </span>
    </div>
  )
}
