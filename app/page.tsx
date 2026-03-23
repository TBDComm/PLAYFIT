'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { RecommendationCard, ErrorCode, SavedGame } from '@/types'
import { trackEvent } from '@/lib/analytics'
import JsonLd from './components/JsonLd'
import LoadingOverlay from './components/LoadingOverlay'
import TagScatter from './components/TagScatter'
import styles from './page.module.css'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PREVIEW_TILES = [
  { appid: 1245620, name: 'Elden Ring',      tags: ['Souls-like', 'Open World', 'Action RPG', 'Difficult'] },
  { appid: 1145360, name: 'Hades',           tags: ['Roguelike', 'Action', 'Fast-Paced', 'Story Rich'] },
  { appid: 413150,  name: 'Stardew Valley',  tags: ['Farming Sim', 'Relaxing', 'Pixel Graphics', 'Indie'] },
  { appid: 367520,  name: 'Hollow Knight',   tags: ['Metroidvania', 'Souls-like', 'Atmospheric', 'Indie'] },
  { appid: 292030,  name: 'The Witcher 3',   tags: ['Open World', 'RPG', 'Story Rich', 'Dark Fantasy'] },
  { appid: 105600,  name: 'Terraria',        tags: ['Sandbox', 'Crafting', 'Building', 'Exploration'] },
  { appid: 504230,  name: 'Celeste',         tags: ['Platformer', 'Difficult', 'Pixel Art', 'Story Rich'] },
  { appid: 588650,  name: 'Dead Cells',      tags: ['Roguelike', 'Action', 'Metroidvania', 'Fast-Paced'] },
] as const

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Guildeline',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${BASE_URL}/#app`,
      name: 'Guildeline',
      description: '스팀 플레이 기록과 예산을 기반으로 내 취향에 맞는 게임을 추천해 드립니다.',
      url: BASE_URL,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#org`,
      name: 'Guildeline',
      url: BASE_URL,
    },
  ],
}

type AuthState = 'loading' | 'steam' | 'linked' | 'unlinked_auth' | 'anon'

type SearchResult = { appid: number; name: string }

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  PRIVATE_PROFILE:        '스팀 프로필을 공개로 설정해주세요',
  INSUFFICIENT_HISTORY:   '플레이 기록이 5개 이상 필요해요',
  NO_GAMES_IN_BUDGET:     '예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요',
  AI_PARSE_FAILURE:       '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요',
  INVALID_URL:            '올바른 스팀 프로필 URL을 입력해주세요',
  GENERAL_ERROR:          '잠시 후 다시 시도해주세요',
  DB_NOT_READY:           'DB가 아직 준비되지 않았어요',
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
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [mode, setMode] = useState<'steam' | 'manual'>('steam')
  const [url, setUrl] = useState('')
  const [manualGames, setManualGames] = useState<ManualGame[]>(EMPTY_MANUAL_GAMES)
  const [budget, setBudget] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dropdowns, setDropdowns] = useState<Array<SearchResult[] | null>>(Array(5).fill(null))
  const [rowErrors, setRowErrors] = useState<Array<string | null>>(Array(5).fill(null))
  const nameInputRefs = useRef<Array<HTMLInputElement | null>>(Array(5).fill(null))
  const debounceRefs = useRef<Array<ReturnType<typeof setTimeout> | null>>(Array(5).fill(null))
  const searchGenRef = useRef<number[]>(Array(5).fill(0))

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setAuthState('anon'); return }
      const { data } = await supabase
        .from('user_profiles').select('steam_id').eq('id', session.user.id).maybeSingle()
      const sid: string | null = data?.steam_id ?? null
      const isSteam = session.user.email?.endsWith('@steam.playfit') ?? false
      if (isSteam && sid) {
        setUrl(`https://steamcommunity.com/profiles/${sid}`)
        setAuthState('steam')
      } else if (!isSteam && sid) {
        setUrl(`https://steamcommunity.com/profiles/${sid}`)
        setAuthState('linked')
      } else {
        setAuthState('unlinked_auth')
      }
    })
  }, [])

  useEffect(() => {
    if (authState === 'loading' || authState === 'anon') return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      try {
        const res = await fetch('/api/saved-games', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const json = await res.json() as { saved: SavedGame[] }
          setSavedGames(json.saved)
        }
      } catch { /* silent fail */ }
    })
  }, [authState])

  function handleUnsaveFromHome(appid: string) {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setSavedGames(prev => prev.filter(g => g.appid !== appid))
      fetch(`/api/saved-games/${appid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => { /* silent fail */ })
    })
  }

  function updateManualGame(idx: number, field: 'playtime', value: string) {
    setManualGames(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g))
  }

  function handleNameChange(idx: number, value: string) {
    setManualGames(prev => prev.map((g, i) => i === idx ? { ...g, name: value, appid: null } : g))
    setRowErrors(prev => prev.map((e, i) => i === idx ? null : e))
    if (!value.trim()) {
      setDropdowns(prev => prev.map((d, i) => i === idx ? null : d))
      if (debounceRefs.current[idx]) clearTimeout(debounceRefs.current[idx]!)
      debounceRefs.current[idx] = null
      return
    }
    if (debounceRefs.current[idx]) clearTimeout(debounceRefs.current[idx]!)
    const gen = ++searchGenRef.current[idx]
    debounceRefs.current[idx] = setTimeout(() => { void fetchSearch(idx, value, gen) }, 150)
  }

  async function fetchSearch(idx: number, query: string, gen: number) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json() as SearchResult[]
      // Discard stale responses — a newer request has already been issued
      if (gen !== searchGenRef.current[idx]) return
      setDropdowns(prev => prev.map((d, i) => i === idx ? data : d))
    } catch {
      // silently fail — autocomplete is non-critical
    }
  }

  function selectGame(idx: number, appid: number, name: string) {
    trackEvent('search_used', { game_name: name })
    setManualGames(prev => prev.map((g, i) => i === idx ? { ...g, appid, name } : g))
    setDropdowns(prev => prev.map((d, i) => i === idx ? null : d))
    setRowErrors(prev => prev.map((e, i) => i === idx ? null : e))
  }

  function handleNameBlur(idx: number) {
    // Delay close so onMouseDown on dropdown items fires before blur removes them
    setTimeout(() => {
      setDropdowns(prev => prev.map((d, i) => i === idx ? null : d))
    }, 150)
    const game = manualGames[idx]
    if (game.name.trim() && game.appid === null) {
      setRowErrors(prev => prev.map((e, i) => i === idx ? '드롭다운에서 게임을 선택해주세요' : e))
    }
  }

  function switchMode(next: 'steam' | 'manual') {
    setMode(next)
    setError(null)
    setDropdowns(Array(5).fill(null))
    setRowErrors(Array(5).fill(null))
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
        trackEvent('recommendation_generated', { mode: 'steam' })
        router.push('/result')
      } else {
        // Block submit if any filled row has no appid (text typed but not selected from dropdown)
        const newRowErrors: Array<string | null> = Array(5).fill(null)
        let hasRowError = false
        for (let i = 0; i < manualGames.length; i++) {
          const g = manualGames[i]
          if (g.name.trim() && g.appid === null) {
            newRowErrors[i] = '드롭다운에서 게임을 선택해주세요'
            hasRowError = true
          }
        }
        if (hasRowError) {
          setRowErrors(newRowErrors)
          setLoading(false)
          const firstErrorIdx = newRowErrors.findIndex(e => e !== null)
          if (firstErrorIdx >= 0) nameInputRefs.current[firstErrorIdx]?.focus()
          return
        }

        const filledGames = manualGames.filter(g => g.name.trim() && g.appid !== null && g.playtime.trim())
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
        trackEvent('recommendation_generated', { mode: 'manual' })
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
    : manualGames.some(g => g.name.trim() && g.appid !== null && g.playtime.trim())

  return (
    <main className={styles.page}>
      {loading && (
        <LoadingOverlay
          message={mode === 'manual' ? '취향 분석 중…' : '플레이 기록 분석 중…'}
        />
      )}
      <JsonLd data={homeJsonLd} />
      <div className={styles.pageNav}>
        <Link href="/genre" className={styles.pageNavLink}>장르별 탐색</Link>
        <Link href="/blog" className={styles.pageNavLink}>블로그</Link>
      </div>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <TagScatter />
        <div className={styles.inner}>
          <header className={styles.header}>
            <h1 className={styles.logo}>
              <span className={styles.logoAccent}>GUILD</span>ELINE
            </h1>
            <h2 className={styles.headline}>내 플레이 기록이 곧 취향이다</h2>
            <p className={styles.heroStat}>82,816개 Steam 게임 중에서 AI가 골라드립니다</p>
            <a href="#recommend-form" className={styles.heroCta}>지금 시작하기 ↓</a>
          </header>
        </div>
      </section>

      {/* ── Form ── */}
      <section className={styles.formSection}>
        <div className={styles.inner}>
          <form id="recommend-form" className={styles.form} onSubmit={handleSubmit} noValidate>
            {mode === 'steam' && authState === 'steam' ? (
              <div className={styles.inputWrapper}>
                <p className={styles.steamAuthNotice}>Steam 계정이 연동되어 있어요</p>
              </div>
            ) : mode === 'steam' ? (
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
                <p className={styles.manualNotice}>
                  게임 이름은 영문으로 정확히 입력해야 분석이 가능해요 (예: Elden Ring, Stardew Valley)
                </p>
                <div className={styles.manualRows} role="group" aria-label="게임 목록">
                  {manualGames.map((g, i) => (
                    <div key={i}>
                      <div className={styles.manualRow}>
                        <span className={styles.manualRowNum} aria-hidden="true">{i + 1}</span>
                        <div className={styles.dropdownWrapper}>
                          <input
                            ref={el => { nameInputRefs.current[i] = el }}
                            type="text"
                            name={`game-name-${i}`}
                            className={styles.input}
                            placeholder="게임 이름 검색…"
                            value={g.name}
                            onChange={e => handleNameChange(i, e.target.value)}
                            onBlur={() => handleNameBlur(i)}
                            autoComplete="off"
                            spellCheck={false}
                            disabled={loading}
                            aria-label={`게임 ${i + 1} 이름`}
                            aria-autocomplete="list"
                            aria-expanded={!!dropdowns[i]?.length}
                            aria-haspopup="listbox"
                            aria-controls={`game-dropdown-${i}`}
                            role="combobox"
                          />
                          {!!dropdowns[i]?.length && (
                            <div id={`game-dropdown-${i}`} className={styles.dropdown} role="listbox" aria-label={`게임 ${i + 1} 검색 결과`}>
                              {dropdowns[i]!.map(item => (
                                <button
                                  key={item.appid}
                                  type="button"
                                  className={styles.dropdownItem}
                                  role="option"
                                  aria-selected={false}
                                  onMouseDown={() => selectGame(i, item.appid, item.name)}
                                >
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                      {rowErrors[i] && (
                        <p className={styles.rowError} role="alert">
                          {rowErrors[i]}
                        </p>
                      )}
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
                <p className={styles.manualNotice}>
                  스팀 계정 없이는 피드백이 저장되지 않아요. 같은 계정으로 여러 번 추천받을수록 정확해지는 방식이라, 첫 추천은 다소 부정확할 수 있어요.
                </p>
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
              {loading
                ? (mode === 'manual' ? '취향 분석 중…' : '플레이 기록 분석 중…')
                : authState === 'steam' ? '내 게임 추천받기' : '내 게임 찾기'
              }
            </button>
          </form>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* ── Preview ── */}
      <section className={styles.previewSection}>
        <div className={styles.inner}>
          <p className={styles.previewLabel}>미리보기</p>
          <p className={styles.previewTitle}>이런 추천을 받았어요</p>
        </div>
        <div className={styles.previewStrip}>
          {PREVIEW_TILES.map(tile => (
            <Link
              href={`/games/${tile.appid}`}
              key={tile.appid}
              className={styles.previewTile}
            >
              <Image
                unoptimized
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${tile.appid}/header.jpg`}
                width={460}
                height={215}
                alt={tile.name}
                className={styles.previewTileImg}
              />
              <div className={styles.previewTileOverlay}>
                <span className={styles.previewTileName}>{tile.name}</span>
                <div className={styles.previewTileChips}>
                  {tile.tags.map(t => (
                    <span key={t} className={styles.previewTileChip}>{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className={styles.inner}>
          <a href="#recommend-form" className={styles.previewCta}>내 추천 받기 ↑</a>
        </div>
        <div className={styles.inner} style={{ marginTop: '3rem' }}>
          <p className={styles.previewLabel}>내 저장 목록</p>
          <p className={styles.previewTitle}>내가 저장한 게임</p>

          {authState === 'loading' && (
            <>
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
            </>
          )}

          {authState === 'anon' && (
            <>
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
              <p className={styles.savedStatusMsg}>로그인하면 저장한 게임이 여기에 표시돼요</p>
              <button
                className={styles.savedLoginBtn}
                onClick={() => window.dispatchEvent(new CustomEvent('guildeline:open-login'))}
              >
                로그인하기 →
              </button>
            </>
          )}

          {(authState === 'steam' || authState === 'linked' || authState === 'unlinked_auth') && savedGames.length === 0 && (
            <>
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
              <p className={styles.savedStatusMsg}>추천받은 게임을 저장하면 여기에 표시돼요</p>
              <a href="#recommend-form" className={styles.savedLoginBtn}>지금 추천받기 ↑</a>
            </>
          )}

          {(authState === 'steam' || authState === 'linked' || authState === 'unlinked_auth') && savedGames.length > 0 && (
            <ul className={styles.savedCards}>
              {savedGames.map(game => (
                <li key={game.appid} className={styles.savedCard}>
                  <span className={styles.savedCardName}>{game.name}</span>
                  {game.reason && (
                    <span className={styles.savedCardReason}>{game.reason}</span>
                  )}
                  <div className={styles.savedCardMeta}>
                    {game.price_krw !== null && (
                      <span className={styles.savedCardPrice}>
                        ₩{new Intl.NumberFormat('ko-KR').format(game.price_krw)}
                      </span>
                    )}
                    {game.metacritic_score !== null && (
                      <span className={styles.savedCardScore}>
                        메타크리틱 {game.metacritic_score}점
                      </span>
                    )}
                  </div>
                  <button
                    className={styles.savedCardUnsaveBtn}
                    onClick={() => handleUnsaveFromHome(game.appid)}
                  >
                    저장 취소
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.howSection}>
        <div className={styles.inner}>
          <h2 className={styles.howTitle}>어떻게 작동하나요</h2>
          <div className={styles.howSteps}>
            <div className={styles.howStep}>
              <span className={styles.howNum}>01</span>
              <p className={styles.howStepTitle}>Steam 연결</p>
              <p className={styles.howStepDesc}>프로필 URL 또는 직접 입력</p>
            </div>
            <div className={styles.howStep}>
              <span className={styles.howNum}>02</span>
              <p className={styles.howStepTitle}>AI 분석</p>
              <p className={styles.howStepDesc}>플레이 기록 → 태그 가중치 계산</p>
            </div>
            <div className={styles.howStep}>
              <span className={styles.howNum}>03</span>
              <p className={styles.howStepTitle}>취향 게임 추천</p>
              <p className={styles.howStepDesc}>예산 내 딱 맞는 게임 목록</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
