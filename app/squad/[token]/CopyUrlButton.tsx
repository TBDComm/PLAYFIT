'use client'

import { useState } from 'react'
import styles from './page.module.css'

export default function CopyUrlButton() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API 실패 시 조용히 무시
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className={styles.copyButton}
        aria-label="스쿼드 URL 복사"
      >
        {copied ? '복사됨 ✓' : '이 스쿼드 공유하기'}
      </button>
      <span aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {copied ? '복사됨' : ''}
      </span>
    </>
  )
}
