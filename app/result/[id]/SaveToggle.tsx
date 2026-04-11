'use client'

import { useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import styles from './page.module.css'

// 모듈 스코프 — 매 렌더마다 재생성 방지
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SaveToggleProps {
  appid: string
  name: string
  reason?: string
  price_krw?: number | null
  metacritic_score?: number | null
  initialSaved: boolean
}

export default function SaveToggle({
  appid,
  name,
  reason,
  price_krw,
  metacritic_score,
  initialSaved,
}: SaveToggleProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [pending, setPending] = useState(false)
  const [hasError, setHasError] = useState(false)
  // ref로 가드 — await 전에 동기적으로 설정해 더블클릭 레이스 컨디션 방지
  const pendingRef = useRef(false)

  async function handleToggle() {
    // pendingRef: 동기적 가드 (pending state 렌더 이전에도 즉시 차단)
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    setHasError(false)

    try {
      // 클릭 시점에 세션 확인 — 렌더 후 로그아웃 케이스 대응
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.dispatchEvent(new CustomEvent('guildeline:open-login'))
        return
      }

      const nextSaved = !saved
      setSaved(nextSaved) // 낙관적 업데이트

      if (nextSaved) {
        const res = await fetch('/api/saved-games', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            appid,
            name,
            reason: reason ?? null,
            price_krw: price_krw ?? null,
            metacritic_score: metacritic_score ?? null,
          }),
        })
        if (!res.ok) throw new Error('save failed')
      } else {
        const res = await fetch(`/api/saved-games/${appid}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error('delete failed')
      }
    } catch {
      // 실패: 낙관적 업데이트 롤백 + 에러 메시지 유지 (다음 시도 시 handleToggle 첫줄에서 초기화)
      setSaved(s => !s) // functional setState — stale closure 방지 (§5.10)
      setHasError(true)
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    // aria-live: 에러 메시지 변경 시 스크린리더에 알림
    <span className={styles.saveToggleWrap} aria-live="polite">
      <button
        className={`${styles.saveToggle}${saved ? ` ${styles.saveToggleSaved}` : ''}${hasError ? ` ${styles.saveToggleHasErr}` : ''}`}
        onClick={handleToggle}
        disabled={pending}
        aria-label={saved ? `${name} 저장 취소` : `${name} 저장`}
        aria-pressed={saved}
      >
        {saved ? '★' : '☆'}
      </button>
      {hasError && (
        <span className={styles.saveToggleErrMsg} aria-hidden="true">저장 실패</span>
      )}
    </span>
  )
}
