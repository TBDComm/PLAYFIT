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

  async function handleFeedback(vote: 'up' | 'down') {
    if (sending || feedback !== null) return
    setFeedback(vote)
    setSending(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      await fetch('/api/feedback', {
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
    } catch { /* 조용히 실패 */ } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={`${styles.feedbackSide}${feedback !== null ? ` ${styles.confirmedSide}` : ''}`}
      aria-live="polite"
    >
      {feedback !== null ? (
        <>
          <span className={styles.confirmedCheck} aria-hidden="true">✓</span>
          <span className={styles.confirmedText}>반영됐어요</span>
        </>
      ) : (
        <>
          <button
            onClick={() => handleFeedback('up')}
            className={`${styles.feedbackBtn} ${styles.up}`}
            disabled={sending}
            aria-label="잘 맞아요"
          >
            <span className={styles.sign}>+</span>
            <span className={styles.label}>잘 맞아요</span>
          </button>
          <button
            onClick={() => handleFeedback('down')}
            className={`${styles.feedbackBtn} ${styles.down}`}
            disabled={sending}
            aria-label="안 맞아요"
          >
            <span className={styles.sign}>−</span>
            <span className={styles.label}>안 맞아요</span>
          </button>
        </>
      )}
    </div>
  )
}
