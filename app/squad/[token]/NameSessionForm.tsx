'use client'

import { useState } from 'react'
import styles from './page.module.css'

interface Props {
  token: string
  initialName: string | null
}

export default function NameSessionForm({ token, initialName }: Props) {
  const [name, setName] = useState(initialName ?? '')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/squad/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) setSaved(true)
      else setError('저장에 실패했습니다. 다시 시도해 주세요.')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.nameSection}>
      <div className={styles.nameForm}>
        <input
          type="text"
          name="session-name"
          autoComplete="off"
          className={styles.nameInput}
          value={name}
          onChange={e => { setName(e.target.value); setSaved(false); setError(null) }}
          maxLength={60}
          placeholder="이 스쿼드에 이름을 붙여보세요 (예: 주말 파티)"
          aria-label="스쿼드 세션 이름"
        />
        <button
          type="button"
          className={styles.nameSaveBtn}
          onClick={handleSave}
          disabled={loading}
        >
          {saved ? '저장됨 ✓' : '저장'}
        </button>
        <span aria-live="polite" aria-atomic="true" className={styles.srOnly}>
          {saved ? '저장됨' : ''}
        </span>
      </div>
      {error && (
        <p className={styles.nameError} aria-live="polite">{error}</p>
      )}
    </div>
  )
}
