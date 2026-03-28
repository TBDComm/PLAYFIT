'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
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

const PREVIEW_POOL = [
  { appid: 1245620, name: 'Elden Ring',           tags: ['Souls-like', 'Open World', 'Action RPG', 'Difficult'] },
  { appid: 1145360, name: 'Hades',                tags: ['Roguelike', 'Action', 'Fast-Paced', 'Story Rich'] },
  { appid: 413150,  name: 'Stardew Valley',       tags: ['Farming Sim', 'Relaxing', 'Pixel Art', 'Indie'] },
  { appid: 367520,  name: 'Hollow Knight',        tags: ['Metroidvania', 'Souls-like', 'Atmospheric', 'Indie'] },
  { appid: 292030,  name: 'The Witcher 3',        tags: ['Open World', 'RPG', 'Story Rich', 'Dark Fantasy'] },
  { appid: 105600,  name: 'Terraria',             tags: ['Sandbox', 'Crafting', 'Building', 'Exploration'] },
  { appid: 504230,  name: 'Celeste',              tags: ['Platformer', 'Difficult', 'Pixel Art', 'Story Rich'] },
  { appid: 588650,  name: 'Dead Cells',           tags: ['Roguelike', 'Action', 'Metroidvania', 'Fast-Paced'] },
  { appid: 620,     name: 'Portal 2',             tags: ['Puzzle', 'Co-op', 'Physics', 'First-Person'] },
  { appid: 1086940, name: "Baldur's Gate 3",      tags: ['RPG', 'Turn-Based', 'Co-op', 'Story Rich'] },
  { appid: 1091500, name: 'Cyberpunk 2077',       tags: ['Open World', 'RPG', 'Action', 'Sci-Fi'] },
  { appid: 814380,  name: 'Sekiro',               tags: ['Souls-like', 'Action', 'Difficult', 'Stealth'] },
  { appid: 548430,  name: 'Deep Rock Galactic',   tags: ['Co-op', 'FPS', 'Mining', 'Procedural'] },
  { appid: 1794680, name: 'Vampire Survivors',    tags: ['Roguelike', 'Bullet Hell', 'Pixel Art', 'Survival'] },
  { appid: 646570,  name: 'Slay the Spire',       tags: ['Card Game', 'Roguelike', 'Strategy', 'Turn-Based'] },
  { appid: 582010,  name: 'Monster Hunter World', tags: ['Action RPG', 'Co-op', 'Open World', 'Hunting'] },
  { appid: 590380,  name: 'Into the Breach',      tags: ['Strategy', 'Turn-Based', 'Roguelike', 'Sci-Fi'] },
  { appid: 632470,  name: 'Disco Elysium',        tags: ['RPG', 'Story Rich', 'Detective', 'Philosophical'] },
  { appid: 1868140, name: 'Dave the Diver',       tags: ['Adventure', 'Fishing', 'Pixel Art', 'Management'] },
  { appid: 264710,  name: 'Subnautica',           tags: ['Survival', 'Open World', 'Underwater', 'Exploration'] },
  { appid: 391540,  name: 'Undertale',            tags: ['RPG', 'Indie', 'Pixel Art', 'Comedy'] },
  { appid: 1174180, name: 'Red Dead Redemption 2',tags: ['Open World', 'Action', 'Western', 'Story Rich'] },
]

const PREVIEW_COUNT = 15

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Guildeline',
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

type PanelState = { game: SavedGame; top: number; left: number }

export default function Home() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [failedSavedImages, setFailedSavedImages] = useState<Set<string>>(new Set())
  const [previewTiles, setPreviewTiles] = useState(() => PREVIEW_POOL.slice(0, PREVIEW_COUNT))
  const [fadingIdx, setFadingIdx] = useState<number | null>(null)
  const [mode, setMode] = useState<'steam' | 'manual'>('steam')
  const [url, setUrl] = useState('')
  const [manualGames, setManualGames] = useState<ManualGame[]>(EMPTY_MANUAL_GAMES)
  const [budget, setBudget] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const statRef = useRef<HTMLSpanElement>(null)
  const urlValid = /steamcommunity\.com\/(id|profiles)\//.test(url)
  const [error, setError] = useState<string | null>(null)
  const [dropdowns, setDropdowns] = useState<Array<SearchResult[] | null>>(Array(5).fill(null))
  const [rowErrors, setRowErrors] = useState<Array<string | null>>(Array(5).fill(null))
  const [formRevealed, setFormRevealed] = useState(false)
  const [sampleRevealed, setSampleRevealed] = useState(false)
  const [previewRevealed, setPreviewRevealed] = useState(false)
  const formRevealRef = useRef<HTMLElement>(null)
  const sampleRevealRef = useRef<HTMLElement>(null)
  const previewRevealRef = useRef<HTMLElement>(null)
  const nameInputRefs = useRef<Array<HTMLInputElement | null>>(Array(5).fill(null))
  const debounceRefs = useRef<Array<ReturnType<typeof setTimeout> | null>>(Array(5).fill(null))
  const searchGenRef = useRef<number[]>(Array(5).fill(0))

  // Saved card hover panel state
  const [hoveredPanel, setHoveredPanel] = useState<PanelState | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const hoveredPanelRef = useRef<PanelState | null>(null)
  const panelLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      const swapIdx = Math.floor(Math.random() * PREVIEW_COUNT)
      setFadingIdx(swapIdx)
      setTimeout(() => {
        setPreviewTiles(prev => {
          const hidden = PREVIEW_POOL.filter(g => !prev.some(d => d.appid === g.appid))
          if (hidden.length === 0) return prev
          const next = [...prev]
          next[swapIdx] = hidden[Math.floor(Math.random() * hidden.length)]
          return next
        })
        setFadingIdx(null)
      }, 350)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n)
    if (!statRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      statRef.current.textContent = fmt(82816)
      return
    }
    const el = statRef.current
    el.textContent = fmt(0)
    const TARGET = 82816
    const DURATION = 1200
    const start = performance.now()
    let raf: number
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = fmt(Math.round(TARGET * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          if (entry.target === formRevealRef.current) {
            setFormRevealed(true)
            obs.unobserve(entry.target)
          } else if (entry.target === sampleRevealRef.current) {
            setSampleRevealed(true)
            obs.unobserve(entry.target)
          } else if (entry.target === previewRevealRef.current) {
            setPreviewRevealed(true)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    if (formRevealRef.current) obs.observe(formRevealRef.current)
    if (sampleRevealRef.current) obs.observe(sampleRevealRef.current)
    if (previewRevealRef.current) obs.observe(previewRevealRef.current)
    return () => obs.disconnect()
  }, [])

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

  function handleSavedCardEnter(game: SavedGame, el: HTMLElement) {
    if (panelLeaveTimer.current) clearTimeout(panelLeaveTimer.current)
    if (panelHideTimer.current) clearTimeout(panelHideTimer.current)
    if (hoveredPanelRef.current) setPanelVisible(true)  // restore if mid-fade

    const rect = el.getBoundingClientRect()
    const PANEL_W = 212
    const GAP = 6
    let left = rect.right + GAP
    if (left + PANEL_W > window.innerWidth - 12) left = rect.left - PANEL_W - GAP
    let top = rect.top
    if (top + 220 > window.innerHeight - 8) top = window.innerHeight - 228
    if (top < 8) top = 8

    const next: PanelState = { game, top, left }
    hoveredPanelRef.current = next
    setHoveredPanel(next)
    requestAnimationFrame(() => setPanelVisible(true))
  }

  function handleSavedCardLeave() {
    if (panelLeaveTimer.current) clearTimeout(panelLeaveTimer.current)
    if (panelHideTimer.current) clearTimeout(panelHideTimer.current)
    panelLeaveTimer.current = setTimeout(() => {
      setPanelVisible(false)
      panelHideTimer.current = setTimeout(() => {
        hoveredPanelRef.current = null
        setHoveredPanel(null)
      }, 100)
    }, 120)
  }

  function cancelPanelLeave() {
    if (panelLeaveTimer.current) clearTimeout(panelLeaveTimer.current)
    if (panelHideTimer.current) clearTimeout(panelHideTimer.current)
    if (hoveredPanelRef.current) setPanelVisible(true)
  }

  function dismissPanel() {
    if (panelLeaveTimer.current) clearTimeout(panelLeaveTimer.current)
    if (panelHideTimer.current) clearTimeout(panelHideTimer.current)
    hoveredPanelRef.current = null
    setHoveredPanel(null)
    setPanelVisible(false)
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
        <div className={styles.tagScatterWrap}><TagScatter /></div>
        <div className={styles.inner}>
          <header className={styles.header}>
            <h1 className={styles.logo}>
              <span className={styles.logoAccent}>GUILD</span>ELINE
              <span className={styles.srOnly}> — 스팀 취향 게임 추천</span>
            </h1>
            <h2 className={styles.headline}>내 플레이 기록이 곧 취향이다</h2>
            <p className={styles.heroStat}><span ref={statRef}>{new Intl.NumberFormat('ko-KR').format(82816)}</span>개 Steam 게임 중에서 AI가 골라드립니다</p>
            <a href="#recommend-form" className={styles.heroCta}>지금 시작하기 <span className={styles.ctaArrow} aria-hidden="true">↓</span></a>
          </header>
        </div>
      </section>

      {/* ── Form ── */}
      <section ref={formRevealRef} className={`${styles.formSection}${formRevealed ? ` ${styles.formSectionRevealed}` : ''}`}>
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
                <div className={styles.urlInputWrap}>
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
                  {urlValid && <span className={styles.urlValidIcon} aria-hidden="true">✓</span>}
                </div>
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
              className={`${styles.button}${loading ? ` ${styles.buttonLoading}` : ''}`}
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

      {/* ── Sample result ── */}
      <section ref={sampleRevealRef} className={`${styles.sampleSection}${sampleRevealed ? ` ${styles.sampleSectionRevealed}` : ''}`}>
        <div className={styles.inner}>
          <p className={styles.previewLabel}>AI 추천 예시</p>
          <p className={styles.previewTitle}>이런 추천을 받을 수 있어요</p>
          <p className={styles.sampleNote}>실제 추천은 내 플레이 기록을 분석해 달라져요</p>
          <div className={styles.sampleCard}>
            <Image
              unoptimized
              src="https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg"
              alt="Hades 게임 썸네일"
              width={460}
              height={215}
              className={styles.sampleThumb}
            />
            <div className={styles.sampleBody}>
              <span className={styles.sampleBadge}>예시</span>
              <p className={styles.sampleName}>Hades</p>
              <p className={styles.sampleReason}>
                <span className={styles.sampleReasonLabel}>왜 나한테 맞냐면</span>
                <br />
                로그라이크와 액션을 즐기는 취향에 딱 맞아요. 매 플레이마다 새로운 전략이 펼쳐지고, 깊이 있는 스토리까지 즐길 수 있어요.
              </p>
              <div className={styles.sampleMeta}>
                <span className={styles.samplePrice}>₩22,500</span>
                <span className={styles.sampleScore}>메타크리틱&nbsp;93점</span>
              </div>
            </div>
          </div>
          <a href="#recommend-form" className={styles.sampleCta}>내 취향으로 추천받기 <span aria-hidden="true">→</span></a>
        </div>
      </section>

      {/* ── Preview ── */}
      <section ref={previewRevealRef} className={`${styles.previewSection}${previewRevealed ? ` ${styles.previewSectionRevealed}` : ''}`}>
        <div className={styles.inner}>
          <p className={styles.previewLabel}>미리보기</p>
          <p className={styles.previewTitle}>Steam 인기 게임</p>
        </div>
        <div className={styles.inner}>
          <div className={styles.previewGrid}>
            {previewTiles.map((tile, idx) => (
              <Link
                href={`/games/${tile.appid}`}
                key={tile.appid}
                className={`${styles.previewTile}${fadingIdx === idx ? ` ${styles.previewTileFading}` : ''}`}
                style={previewRevealed ? { animationDelay: `${idx * 28}ms` } : undefined}
              >
                <Image
                  unoptimized
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${tile.appid}/library_600x900.jpg`}
                  width={600}
                  height={900}
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
        </div>
        <div className={styles.inner}>
          <a href="#recommend-form" className={styles.previewCta}>내 추천 받기 ↑</a>
        </div>
        <div className={styles.inner} style={{ marginTop: '3rem' }}>
          <p className={styles.previewLabel}>내 저장 목록</p>
          <p className={styles.previewTitle}>내가 저장한 게임</p>

          {authState === 'loading' && (
            <div className={styles.savedStrip}>
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
              <div className={styles.savedPlaceholder} />
            </div>
          )}

          {authState === 'anon' && (
            <>
              <div className={styles.savedStrip}>
                <div className={styles.savedPlaceholder} />
                <div className={styles.savedPlaceholder} />
                <div className={styles.savedPlaceholder} />
                <div className={styles.savedPlaceholder} />
              </div>
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
              <div className={styles.savedStrip}>
                <div className={styles.savedPlaceholder} />
                <div className={styles.savedPlaceholder} />
                <div className={styles.savedPlaceholder} />
                <div className={styles.savedPlaceholder} />
              </div>
              <p className={styles.savedStatusMsg}>추천받은 게임을 저장하면 여기에 표시돼요</p>
              <a href="#recommend-form" className={styles.savedLoginBtn}>지금 추천받기 ↑</a>
            </>
          )}

          {(authState === 'steam' || authState === 'linked' || authState === 'unlinked_auth') && savedGames.length > 0 && (
            <ul className={styles.savedStrip}>
              {savedGames.map(game => (
                <li
                  key={game.appid}
                  className={`${styles.savedCard}${hoveredPanel?.game.appid === game.appid ? ` ${styles.savedCardActive}` : ''}${hoveredPanel && hoveredPanel.game.appid !== game.appid ? ` ${styles.savedCardDimmed}` : ''}`}
                  onMouseEnter={(e) => handleSavedCardEnter(game, e.currentTarget)}
                  onMouseLeave={handleSavedCardLeave}
                >
                  <div className={styles.savedCardImgWrap}>
                    {!failedSavedImages.has(game.appid) && (
                      <Image
                        unoptimized
                        src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`}
                        alt={game.name}
                        className={styles.savedCardImg}
                        width={600}
                        height={900}
                        onError={() => setFailedSavedImages(prev => new Set(prev).add(game.appid))}
                      />
                    )}
                    <div className={styles.savedCardOverlay}>
                      <span className={styles.savedCardOverlayName}>{game.name}</span>
                    </div>
                    {/* Keyboard-accessible unsave — visible only on focus-visible */}
                    <button
                      className={styles.savedCardKbdUnsave}
                      onClick={() => handleUnsaveFromHome(game.appid)}
                      onFocus={(e) => { const li = e.currentTarget.closest('li') as HTMLElement | null; if (li) handleSavedCardEnter(game, li) }}
                      onBlur={handleSavedCardLeave}
                      aria-label={`${game.name} 저장 취소`}
                    >
                      저장 취소
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>


      {/* Saved card hover panel — portal to escape overflow container */}
      {hoveredPanel && typeof document !== 'undefined' && createPortal(
        <div
          className={`${styles.savedFloatingPanel}${panelVisible ? ` ${styles.savedFloatingPanelVisible}` : ''}`}
          style={{ top: hoveredPanel.top, left: hoveredPanel.left }}
          onMouseEnter={cancelPanelLeave}
          onMouseLeave={handleSavedCardLeave}
        >
          <span className={styles.savedCardPanelName}>{hoveredPanel.game.name}</span>
          {hoveredPanel.game.reason && (
            <span className={styles.savedCardPanelReason}>{hoveredPanel.game.reason}</span>
          )}
          <div className={styles.savedCardPanelMeta}>
            {hoveredPanel.game.price_krw !== null && (
              <span className={styles.savedCardPanelPrice}>
                ₩{new Intl.NumberFormat('ko-KR').format(hoveredPanel.game.price_krw)}
              </span>
            )}
            {hoveredPanel.game.metacritic_score !== null && (
              <span className={styles.savedCardPanelScore}>
                메타크리틱 {hoveredPanel.game.metacritic_score}점
              </span>
            )}
          </div>
          <button
            className={styles.savedCardUnsaveBtn}
            onClick={() => { handleUnsaveFromHome(hoveredPanel.game.appid); dismissPanel() }}
          >
            저장 취소
          </button>
        </div>,
        document.body
      )}
    </main>
  )
}
