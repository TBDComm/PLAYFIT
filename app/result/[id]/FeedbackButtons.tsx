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
    } catch { /* silent fail */ } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.feedbackContainer}>
      <button
        onClick={() => handleFeedback('up')}
        className={`${styles.feedbackButton} ${feedback === 'up' ? styles.selectedUp : ''}`}
        disabled={sending || feedback !== null}
        aria-label="잘 맞아요"
      >
        ▲
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className={`${styles.feedbackButton} ${feedback === 'down' ? styles.selectedDown : ''}`}
        disabled={sending || feedback !== null}
        aria-label="아니에요"
      >
        ▼
      </button>
    </div>
  )
}
