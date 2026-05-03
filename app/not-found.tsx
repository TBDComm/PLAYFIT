import Link from 'next/link'
import styles from './error.module.css'

export default function NotFound() {
  return (
    <main id="main-content" className={styles.main}>
      <p className={styles.label}>404</p>
      <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
      <Link href="/" className={styles.link}>
        홈으로 →
      </Link>
    </main>
  )
}
