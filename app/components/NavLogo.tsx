'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './NavLogo.module.css'

// Module-level constants — same geometry ratios as favicon (size=32, r=13)
const S  = 20
const CX = S / 2, CY = S / 2
const R  = CX * (13 / 16)
const hexPts = Array.from({ length: 6 }, (_, i) => {
  const rad = ((-90 + 60 * i) * Math.PI) / 180
  return `${(CX + R * Math.cos(rad)).toFixed(1)},${(CY + R * Math.sin(rad)).toFixed(1)}`
}).join(' ')
const HEX_SW  = S * (1.4 / 32)
const CH      = S * (6.5 / 32)
const CW      = S * (5 / 32)
const CG      = S * (3 / 32)
const CHEV_SW = S * (2.0 / 32)
const X0      = CX - (CW * 2 + CG) / 2

export default function NavLogo() {
  const pathname = usePathname()

  // Home page already has the large GUILDELINE wordmark — no logo needed
  if (pathname === '/') return null

  return (
    <div className={styles.bar}>
      <Link href="/" className={styles.wordmark} aria-label="Guildeline 홈">
        <svg
          viewBox={`0 0 ${S} ${S}`}
          width={S}
          height={S}
          fill="none"
          aria-hidden="true"
          className={styles.logoMark}
        >
          <polygon points={hexPts} fill="rgba(197,241,53,0.08)" stroke="#C5F135" strokeWidth={HEX_SW} strokeLinejoin="round"/>
          <polyline points={`${X0},${CY-CH} ${X0+CW},${CY} ${X0},${CY+CH}`} stroke="#C5F135" strokeWidth={CHEV_SW} strokeLinecap="butt" strokeLinejoin="miter" fill="none"/>
          <polyline points={`${X0+CW+CG},${CY-CH} ${X0+CW*2+CG},${CY} ${X0+CW+CG},${CY+CH}`} stroke="#C5F135" strokeWidth={CHEV_SW} strokeLinecap="butt" strokeLinejoin="miter" fill="none" opacity={0.48}/>
        </svg>
        <span className={styles.play}>GUILD</span>ELINE
      </Link>
    </div>
  )
}
