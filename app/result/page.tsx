'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { RecommendationCard } from '@/types'
import { trackEvent } from '@/lib/analytics'
import AdUnit from '@/app/components/AdUnit'
import styles from './page.module.css'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResultPage() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<RecommendationCard[] | null>(null)
  const [feedbackSent, setFeedbackSent] = useState<Record<number, boolean>>({})
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const [authState, setAuthState] = useState<'loading' | 'authed' | 'anon'>('loading')
  const [savedAppIds, setSavedAppIds] = useState<Set<string>>(new Set())
  const [accessToken, setAccessToken] = useState<string | null>(null)

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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setAuthState('anon'); return }
      setAccessToken(session.access_token)
      try {
        const res = await fetch('/api/saved-games', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const json = await res.json() as { saved: Array<{ appid: string }> }
          setSavedAppIds(new Set(json.saved.map(g => g.appid)))
        }
      } catch { /* silent fail */ }
      setAuthState('authed')
    })
  }, [])

  function handleFeedback(card: RecommendationCard, rating: 'positive' | 'negative') {
    trackEvent('feedback_submitted', { rating, game_name: card.name })
    setFeedbackSent(prev => ({ ...prev, [card.appid]: true }))

    const steamId = sessionStorage.getItem('playfit_steam_id') ?? undefined
    const playProfile = (() => {
      try { return JSON.parse(sessionStorage.getItem('playfit_play_profile') ?? '[]') }
      catch { return [] }
    })()

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

  function handleSaveToggle(card: RecommendationCard) {
    if (!accessToken) return
    const appidStr = String(card.appid)
    const isSaved = savedAppIds.has(appidStr)

    // Optimistic update
    setSavedAppIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.delete(appidStr)
      else next.add(appidStr)
      return next
    })

    if (isSaved) {
      fetch(`/api/saved-games/${appidStr}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {
        // Revert on failure
        setSavedAppIds(prev => { const next = new Set(prev); next.add(appidStr); return next })
      })
    } else {
      fetch('/api/saved-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          appid: appidStr,
          name: card.name,
          reason: card.reason,
          price_krw: card.price_krw,
          metacritic_score: card.metacritic_score,
        }),
      }).catch(() => {
        // Revert on failure
        setSavedAppIds(prev => { const next = new Set(prev); next.delete(appidStr); return next })
      })
    }
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
          {recommendations.map(card => {
            const appidStr = String(card.appid)
            const isSaved = savedAppIds.has(appidStr)
            return (
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

                  <div className={styles.cardActions}>
                    {authState === 'authed' && (
                      <button
                        className={isSaved ? styles.saveBtnSaved : styles.saveBtnUnsaved}
                        onClick={() => handleSaveToggle(card)}
                      >
                        {isSaved ? '★ 저장됨' : '☆ 저장'}
                      </button>
                    )}

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
                </div>
              </li>
            )
          })}
        </ul>

        {/* Ad — below game cards, never above fold */}
        <AdUnit slot="0000000000" format="auto" minHeight={250} className={styles.adUnit} />
      </div>
    </main>
  )
}
