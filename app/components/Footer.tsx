import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Footer links">
        <Link href="/articles">게임 추천</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/blog">블로그</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/about">서비스 소개</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/privacy">개인정보처리방침</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/terms">이용약관</Link>
      </nav>
      <p className={styles.copy}>© 2026 Guildeline</p>
    </footer>
  )
}
