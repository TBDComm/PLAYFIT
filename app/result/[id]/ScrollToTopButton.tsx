'use client'

import styles from './page.module.css'

export default function ScrollToTopButton() {
  return (
    <button
      className={styles.scrollToTop}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      맨 위로 올라가기
    </button>
  )
}
