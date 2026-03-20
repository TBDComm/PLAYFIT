'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './NavLogo.module.css'

export default function NavLogo() {
  const pathname = usePathname()

  // Home page already has the large PLAYFIT wordmark — no logo needed
  if (pathname === '/') return null

  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.wordmark} aria-label="PlayFit 홈">
        <span className={styles.play}>PLAY</span>FIT
      </Link>
    </header>
  )
}
