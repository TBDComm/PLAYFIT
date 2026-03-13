'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RecommendationCard, ErrorCode } from '@/types'
import styles from './page.module.css'

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  PRIVATE_PROFILE:      '스팀 프로필을 공개로 설정해주세요',
  INSUFFICIENT_HISTORY: '플레이 기록이 5개 이상 필요해요',
  NO_GAMES_IN_BUDGET:   '예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요',
  AI_PARSE_FAILURE:     '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요',
  INVALID_URL:          '올바른 스팀 프로필 URL을 입력해주세요',
  GENERAL_ERROR:        '잠시 후 다시 시도해주세요',
}

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const budgetValue = budget.trim() ? Number(budget) : undefined

      const steamRes = await fetch('/api/steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), budget: budgetValue }),
      })
      const steamData = await steamRes.json() as {
        steamId?: string
        playHistory?: unknown
        candidates?: unknown
        error?: ErrorCode
      }

      if (!steamRes.ok || steamData.error) {
        setError(ERROR_MESSAGES[steamData.error ?? 'GENERAL_ERROR'])
        return
      }

      const recommendRes = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamId: steamData.steamId,
          playHistory: steamData.playHistory,
          candidates: steamData.candidates,
        }),
      })
      const recommendData = await recommendRes.json() as {
        recommendations?: RecommendationCard[]
        error?: ErrorCode
      }

      if (!recommendRes.ok || recommendData.error) {
        setError(ERROR_MESSAGES[recommendData.error ?? 'GENERAL_ERROR'])
        return
      }

      sessionStorage.setItem('playfit_recommendations', JSON.stringify(recommendData.recommendations))
      sessionStorage.setItem('playfit_steam_id', steamData.steamId ?? '')
      sessionStorage.setItem('playfit_play_profile', JSON.stringify(
        (steamData.playHistory as { name: string; playtime_hours: number }[] ?? []).slice(0, 5)
      ))
      router.push('/result')
    } catch {
      setError(ERROR_MESSAGES.GENERAL_ERROR)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.logo}>
            <span className={styles.logoAccent}>PLAY</span>FIT
          </h1>
          <p className={styles.tagline}>나한테 맞는 게임을 찾아드립니다</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.inputWrapper}>
            <label className={styles.label} htmlFor="steam-url">
              Steam 프로필 URL
            </label>
            <input
              id="steam-url"
              name="steam-url"
              type="url"
              className={styles.input}
              placeholder="스팀 프로필 URL을 입력하세요…"
              value={url}
              onChange={e => setUrl(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
            />
          </div>

          <div className={styles.inputWrapper}>
            <label className={styles.label} htmlFor="budget">
              예산 (선택)
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              inputMode="numeric"
              className={styles.input}
              placeholder="예산 입력 (예: 10000)"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              autoComplete="off"
              min={0}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !url.trim()}
          >
            {loading ? '플레이 기록 분석 중…' : '내 게임 찾기'}
          </button>
        </form>

        {error && (
          <p className={styles.error} role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
