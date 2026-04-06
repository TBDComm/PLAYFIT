'use client'

import { useState } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  async function handleFeedback(vote: 'up' | 'down') {
    // 이미 같은 버튼 선택 중 or 전송 중이면 no-op
    if (sending || feedback === vote) return
    const prev = feedback
    setFeedback(vote)
    setError(null)
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
    } catch {
      // 실패 시 이전 상태로 롤백 + 에러 메시지
      setFeedback(prev)
      setError('저장 실패. 다시 시도해주세요')
    } finally {
      setSending(false)
    }
  }

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
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}
