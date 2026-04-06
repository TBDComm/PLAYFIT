'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import styles from './feedback.module.css'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FeedbackButtonsProps {
  appId: number
  gameName: string
  steamId: string | null
}

export default function FeedbackButtons({ appId, gameName, steamId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 언마운트 시 타이머 정리
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  async function handleFeedback(vote: 'up' | 'down') {
    // 이미 같은 버튼 선택 중 or 전송 중이면 no-op
    if (sending || feedback === vote) return
    const prev = feedback
    setFeedback(vote)
    setStatus(null)
    setSending(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          game_id: String(appId),
          game_name: gameName,
          steam_id: steamId,
          play_profile: [],
          rating: vote === 'up' ? 'positive' : 'negative',
          tag_snapshot: [],
        }),
      })
      if (!res.ok) throw new Error('feedback API error')

      // 성공: 1.5초 후 자동 소멸하는 확인 메시지
      if (timerRef.current) clearTimeout(timerRef.current)
      setStatus('success')
      timerRef.current = setTimeout(() => setStatus(null), 1500)
    } catch {
      // 실패 시 이전 상태로 롤백 + 에러 메시지
      setFeedback(prev)
      setStatus('error')
    } finally {
      setSending(false)
    }
  }

  // status에서 메시지 텍스트 파생
  const msgText = status === 'success' ? '저장됐어요' : status === 'error' ? '저장 실패. 다시 시도해주세요' : null

  return (
    <div className={styles.feedbackSide} aria-live="polite">
      <button
        onClick={() => handleFeedback('up')}
        className={`${styles.feedbackBtn} ${styles.up}${feedback === 'up' ? ` ${styles.active}` : ''}`}
        disabled={sending}
        aria-label="잘 맞아요"
        aria-pressed={feedback === 'up'}
      >
        <span className={styles.sign}>+</span>
        <span className={styles.label}>잘 맞아요</span>
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className={`${styles.feedbackBtn} ${styles.down}${feedback === 'down' ? ` ${styles.active}` : ''}`}
        disabled={sending}
        aria-label="안 맞아요"
        aria-pressed={feedback === 'down'}
      >
        <span className={styles.sign}>−</span>
        <span className={styles.label}>안 맞아요</span>
      </button>
      {/* 항상 렌더 — min-height 고정으로 레이아웃 이동 방지 */}
      <p className={`${styles.msgArea}${status ? ` ${styles[status]}` : ` ${styles.msgEmpty}`}`}>
        {msgText}
      </p>
    </div>
  )
}
