// Guildeline hexagon mark — mirrors app/icon.tsx design
// Used in auth modals and reset-password page

interface GuildelineMarkProps {
  size?: number
}

export default function GuildelineMark({ size = 48 }: GuildelineMarkProps) {
  const cx = 16, cy = 16, r = 14
  const hex = Array.from({ length: 6 }, (_, i) => {
    const rad = ((-90 + 60 * i) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
  })
  const hexPath = hex.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

  const ch = 7, cw = 5.5, cg = 4.5
  const x0 = cx - (cw * 2 + cg) / 2

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path d={hexPath} fill="#0A0A0A" stroke="#C5F135" strokeWidth="0.8" strokeLinejoin="round" />
      <polyline
        points={`${x0},${cy - ch} ${x0 + cw},${cy} ${x0},${cy + ch}`}
        stroke="#C5F135" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <polyline
        points={`${x0 + cw + cg},${cy - ch} ${x0 + cw * 2 + cg},${cy} ${x0 + cw + cg},${cy + ch}`}
        stroke="#C5F135" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        opacity={0.38}
      />
    </svg>
  )
}
