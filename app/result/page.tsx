'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { RecommendationCard } from '@/types'
import { trackEvent } from '@/lib/analytics'
import AdUnit from '@/app/components/AdUnit'
import styles from './page.module.css'

export default function ResultPage() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<RecommendationCard[] | null>(null)
  const [feedbackSent, setFeedbackSent] = useState<Record<number, boolean>>({})
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())

  useEffect(() => {
    const raw = sessionStorage.getItem('playfit_recommendations')
    if (!raw) { router.replace('/'); return }
    try {
      const data = JSON.parse(raw) as RecommendationCard[]
      if (!Array.isArray(data) || data.length === 0) { router.replace('/'); return }
      setRecommendations(data)
    } catch {
      router.replace('/')
    }
  }, [router])

  function handleFeedback(card: RecommendationCard, rating: 'positive' | 'negative') {
    trackEvent('feedback_submitted', { rating, game_name: card.name })
    setFeedbackSent(prev => ({ ...prev, [card.appid]: true }))

    const steamId = sessionStorage.getItem('playfit_steam_id') ?? undefined
    const playProfile = (() => {
      try { return JSON.parse(sessionStorage.getItem('playfit_play_profile') ?? '[]') }
      catch { return [] }
    })()

    // Fire-and-forget
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: String(card.appid),
        game_name: card.name,
        steam_id: steamId,
        play_profile: playProfile,
        rating,
        tag_snapshot: card.tag_snapshot,
      }),
    }).catch(() => { /* silent fail */ })
  }

  if (!recommendations) return null

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.logoLink} aria-label="GUILDELINE 홈으로">
        <h1 className={styles.logo}>
          <span className={styles.logoAccent}>GUILD</span>ELINE
        </h1>
      </Link>

      <div className={styles.inner}>
        <ul className={styles.cards} aria-label="추천 게임 목록">
          {recommendations.map(card => (
            <li key={card.appid} className={styles.card}>
              {!failedImages.has(card.appid) && (
                <Image
                  unoptimized
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${card.appid}/header.jpg`}
                  alt={card.name}
                  className={styles.thumbnail}
                  width={460}
                  height={215}
                  onError={() => setFailedImages(prev => new Set(prev).add(card.appid))}
                />
              )}
              <div className={styles.cardBody}>
              <h2 className={styles.cardName}>{card.name}</h2>

              <p className={styles.reason}>
                <span className={styles.reasonLabel}>왜 나한테 맞냐면</span>
                <br />
                {card.reason}
              </p>

              <div className={styles.meta}>
                <span className={styles.price}>
                  {card.is_free
                    ? '무료'
                    : `₩${new Intl.NumberFormat('ko-KR').format(card.price_krw)}`}
                </span>
                {card.metacritic_score !== undefined && (
                  <span className={`${styles.score} ${
                    card.metacritic_score >= 75 ? styles.scoreHigh
                    : card.metacritic_score >= 50 ? styles.scoreMid
                    : styles.scoreLow
                  }`}>
                    메타크리틱&nbsp;{card.metacritic_score}점
                  </span>
                )}
              </div>

              <a
                href={card.store_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.storeLink}
              >
                스팀에서 보기
              </a>

              <div className={styles.feedback} aria-live="polite">
                {feedbackSent[card.appid] ? (
                  <p className={styles.feedbackThanks}>피드백 감사해요</p>
                ) : (
                  <>
                    <button
                      className={styles.feedbackBtn}
                      onClick={() => handleFeedback(card, 'positive')}
                    >
                      잘 맞아요
                    </button>
                    <button
                      className={`${styles.feedbackBtn} ${styles.feedbackBtnNeg}`}
                      onClick={() => handleFeedback(card, 'negative')}
                    >
                      아니에요
                    </button>
                  </>
                )}
              </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Ad — below game cards, never above fold */}
        <AdUnit slot="0000000000" format="auto" minHeight={250} className={styles.adUnit} />
      </div>
    </main>
  )
}
