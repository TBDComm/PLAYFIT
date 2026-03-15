'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { RecommendationCard, ErrorCode } from '@/types'
import styles from './page.module.css'

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  PRIVATE_PROFILE:        '스팀 프로필을 공개로 설정해주세요',
  INSUFFICIENT_HISTORY:   '플레이 기록이 5개 이상 필요해요',
  NO_GAMES_IN_BUDGET:     '예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요',
  AI_PARSE_FAILURE:       '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요',
  INVALID_URL:            '올바른 스팀 프로필 URL을 입력해주세요',
  GENERAL_ERROR:          '잠시 후 다시 시도해주세요',
  DB_NOT_READY:           'DB가 아직 준비되지 않았어요',
  GAME_NOT_FOUND:         '게임을 찾을 수 없어요',
  TAG_EXTRACTION_FAILED:  '플레이 기록에서 태그를 추출할 수 없어요',
}

type ManualGame = { appid: number | null; name: string; playtime: string }

const EMPTY_MANUAL_GAMES: ManualGame[] = Array.from({ length: 5 }, () => ({
  appid: null,
  name: '',
  playtime: '',
}))

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'steam' | 'manual'>('steam')
  const [url, setUrl] = useState('')
  const [manualGames, setManualGames] = useState<ManualGame[]>(EMPTY_MANUAL_GAMES)
  const [budget, setBudget] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateManualGame(idx: number, field: 'name' | 'playtime', value: string) {
    setManualGames(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g))
  }

  function switchMode(next: 'steam' | 'manual') {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const budgetValue = !freeOnly && budget.trim() ? Number(budget) : undefined

      if (mode === 'steam') {
        const steamRes = await fetch('/api/steam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        })
        const steamData = await steamRes.json() as {
          steamId?: string
          playHistory?: unknown
          ownedAppIds?: number[]
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
            ownedAppIds: steamData.ownedAppIds,
            budget: budgetValue,
            freeOnly,
          }),
        })
        const recommendData = await recommendRes.json() as {
          recommendations?: RecommendationCard[]
          error?: ErrorCode
          filters?: { budget?: number; freeOnly?: boolean }
        }

        if (!recommendRes.ok || recommendData.error) {
          if (recommendData.error === 'NO_GAMES_IN_BUDGET') {
            const f = recommendData.filters
            if (f?.freeOnly) setError('현재 무료 게임 중 추천 가능한 게임이 없어요')
            else setError('예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요')
          } else {
            setError(ERROR_MESSAGES[recommendData.error ?? 'GENERAL_ERROR'])
          }
          return
        }

        sessionStorage.setItem('playfit_recommendations', JSON.stringify(recommendData.recommendations))
        sessionStorage.setItem('playfit_steam_id', steamData.steamId ?? '')
        sessionStorage.setItem('playfit_play_profile', JSON.stringify(
          (steamData.playHistory as { name: string; playtime_hours: number }[] ?? []).slice(0, 5)
        ))
        router.push('/result')
      } else {
        const filledGames = manualGames.filter(g => g.name.trim() && g.playtime.trim())
        if (filledGames.length === 0) {
          setError('게임을 최소 1개 이상 입력해주세요')
          return
        }

        const recommendRes = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manualGames: filledGames.map(g => ({
              appid: g.appid,
              name: g.name.trim(),
              playtime_hours: parseFloat(g.playtime) || 0,
            })),
            budget: budgetValue,
            freeOnly,
          }),
        })
        const recommendData = await recommendRes.json() as {
          recommendations?: RecommendationCard[]
          error?: ErrorCode
          filters?: { budget?: number; freeOnly?: boolean }
        }

        if (!recommendRes.ok || recommendData.error) {
          if (recommendData.error === 'NO_GAMES_IN_BUDGET') {
            if (freeOnly) setError('현재 무료 게임 중 추천 가능한 게임이 없어요')
            else setError('예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요')
          } else {
            setError(ERROR_MESSAGES[recommendData.error ?? 'GENERAL_ERROR'])
          }
          return
        }

        sessionStorage.setItem('playfit_recommendations', JSON.stringify(recommendData.recommendations))
        sessionStorage.setItem('playfit_steam_id', '')
        sessionStorage.setItem('playfit_play_profile', JSON.stringify(
          filledGames.slice(0, 5).map(g => ({
            name: g.name.trim(),
            playtime_hours: parseFloat(g.playtime) || 0,
          }))
        ))
        router.push('/result')
      }
    } catch {
      setError(ERROR_MESSAGES.GENERAL_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = mode === 'steam'
    ? !!url.trim()
    : manualGames.some(g => g.name.trim() && g.playtime.trim())

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
          {mode === 'steam' ? (
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
              <button
                type="button"
                className={styles.modeToggle}
                onClick={() => switchMode('manual')}
                disabled={loading}
              >
                스팀 계정 없이 추천받기 →
              </button>
            </div>
          ) : (
            <div className={styles.inputWrapper}>
              <span className={styles.label}>
                플레이한 게임 입력 (최대 5개)
              </span>
              <div className={styles.manualRows} role="group" aria-label="게임 목록">
                {manualGames.map((g, i) => (
                  <div key={i} className={styles.manualRow}>
                    <span className={styles.manualRowNum} aria-hidden="true">{i + 1}</span>
                    <input
                      type="text"
                      name={`game-name-${i}`}
                      className={styles.input}
                      placeholder="게임 이름 검색…"
                      value={g.name}
                      onChange={e => updateManualGame(i, 'name', e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      disabled={loading}
                      aria-label={`게임 ${i + 1} 이름`}
                    />
                    <input
                      type="number"
                      name={`game-playtime-${i}`}
                      className={`${styles.input} ${styles.inputNarrow}`}
                      placeholder="시간…"
                      value={g.playtime}
                      onChange={e => updateManualGame(i, 'playtime', e.target.value)}
                      autoComplete="off"
                      inputMode="decimal"
                      min={0}
                      disabled={loading}
                      aria-label={`게임 ${i + 1} 플레이 시간 (시간)`}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.modeToggle}
                onClick={() => switchMode('steam')}
                disabled={loading}
              >
                ← 스팀 계정으로 추천받기
              </button>
            </div>
          )}

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
              placeholder="예산 입력 (예: 10000)…"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              autoComplete="off"
              min={0}
              disabled={loading || freeOnly}
            />
            <label className={`${styles.toggleRow}${loading ? ` ${styles.toggleRowDisabled}` : ''}`}>
              <input
                type="checkbox"
                name="free-only"
                className={styles.toggleCheckbox}
                checked={freeOnly}
                onChange={e => {
                  setFreeOnly(e.target.checked)
                  if (e.target.checked) setBudget('')
                }}
                disabled={loading}
              />
              무료 게임만 보기
            </label>
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !canSubmit}
          >
            {loading ? '분석 중…' : '내 게임 찾기'}
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
