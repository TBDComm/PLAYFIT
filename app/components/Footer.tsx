import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Footer navigation">
        <Link href="/">홈</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/genre">장르별 탐색</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/blog">블로그</Link>
      </nav>
      <nav className={styles.links} aria-label="Footer legal">
        <Link href="/privacy">개인정보처리방침</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/terms">이용약관</Link>
      </nav>
      <p className={styles.copy}>© 2026 Guildeline</p>
    </footer>
  )
}
