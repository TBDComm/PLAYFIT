'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './NavLogo.module.css'

export default function NavLogo() {
  const pathname = usePathname()

  // Home page already has the large GUILDELINE wordmark — no logo needed
  if (pathname === '/') return null

  return (
    <div className={styles.bar}>
      <Link href="/" className={styles.wordmark} aria-label="Guildeline 홈">
        <Image
          src="/guildeline-logo.png"
          alt=""
          width={22}
          height={19}
          className={styles.logoImg}
          unoptimized
        />
        <span className={styles.play}>GUILD</span>ELINE
      </Link>
    </div>
  )
}
