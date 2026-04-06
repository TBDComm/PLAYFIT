'use client'

import { useState } from 'react'
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

  async function handleToggle() {
    if (pending) return

    // 클릭 시점에 세션 확인 — 렌더 후 로그아웃 케이스 대응
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.dispatchEvent(new CustomEvent('guildeline:open-login'))
      return
    }

    const nextSaved = !saved
    setSaved(nextSaved) // 낙관적 업데이트
    setPending(true)

    try {
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
      // 실패 시 롤백 — functional setState로 stale closure 방지 (rerender-optimization §5.10)
      setSaved(s => !s)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      className={`${styles.saveToggle}${saved ? ` ${styles.saveToggleSaved}` : ''}`}
      onClick={handleToggle}
      disabled={pending}
      aria-label={saved ? `${name} 저장 취소` : `${name} 저장`}
      aria-pressed={saved}
    >
      {saved ? '★' : '☆'}
    </button>
  )
}
