import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Footer navigation">
        <Link href="/privacy">개인정보처리방침</Link>
        <span className={styles.sep} aria-hidden="true">·</span>
        <Link href="/terms">이용약관</Link>
      </nav>
      <p className={styles.copy}>© 2026 PlayFit</p>
    </footer>
  )
}
