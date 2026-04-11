'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { ErrorCode } from '@/types'
import { useAuth } from '@/app/context/AuthContext'
import type { LibraryGame } from '@/lib/steam'
import { trackEvent } from '@/lib/analytics'
import LoadingOverlay from './LoadingOverlay'
import LibraryPickerModal from './LibraryPickerModal'
import styles from '../page.module.css'

type SearchResult = { appid: number; name: string }

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  PRIVATE_PROFILE: '스팀 프로필을 공개로 설정해주세요',
  INSUFFICIENT_HISTORY: '플레이 기록이 5개 이상 필요해요',
  NO_GAMES_IN_BUDGET: '예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요',
  AI_PARSE_FAILURE: '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요',
  INVALID_URL: '올바른 스팀 프로필 URL을 입력해주세요',
  GENERAL_ERROR: '잠시 후 다시 시도해주세요',
  DB_NOT_READY: 'DB가 아직 준비되지 않았어요',
  TAG_EXTRACTION_FAILED: '플레이 기록에서 태그를 추출할 수 없어요',
}

type ManualGame = { appid: number | null; name: string; playtime: string }

const EMPTY_MANUAL_GAMES: ManualGame[] = Array.from({ length: 5 }, () => ({
  appid: null,
  name: '',
  playtime: '',
}))

export default function RecommendationForm() {
  const router = useRouter()
  const { authState, steamId: contextSteamId } = useAuth()
  const [mode, setMode] = useState<'steam' | 'manual'>('steam')
  const [url, setUrl] = useState('')
  const [manualGames, setManualGames] = useState<ManualGame[]>(EMPTY_MANUAL_GAMES)
  const [budget, setBudget] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const loadingMsgRef = useRef<string>('플레이 기록 분석 중…')
  const [error, setError] = useState<string | null>(null)
  const [dropdowns, setDropdowns] = useState<Array<SearchResult[] | null>>(Array(5).fill(null))
  const [activeIdxs, setActiveIdxs] = useState<number[]>(Array(5).fill(-1))
  const [rowErrors, setRowErrors] = useState<Array<string | null>>(Array(5).fill(null))
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchLiveText, setSearchLiveText] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [formRevealed, setFormRevealed] = useState(false)
  const formRevealRef = useRef<HTMLElement>(null)
  const nameInputRefs = useRef<Array<HTMLInputElement | null>>(Array(5).fill(null))
  const debounceRefs = useRef<Array<ReturnType<typeof setTimeout> | null>>(Array(5).fill(null))
  const searchGenRef = useRef<number[]>(Array(5).fill(0))

  // Sync URL from context steamId — handles login, logout, and page refresh automatically
  useEffect(() => {
    setUrl(contextSteamId ? `https://steamcommunity.com/profiles/${contextSteamId}` : '')
  }, [contextSteamId])

  // CE-27: error 발생 시 에러 요소로 포커스 이동 — setError 호출 경로가 여럿이라 useEffect로 통합
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          if (entry.target === formRevealRef.current) {
            setFormRevealed(true)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    const el = formRevealRef.current
    if (el) obs.observe(el)
    return () => { if (el) obs.unobserve(el) }
  }, [])

  function updateManualGame(idx: number, field: 'playtime', value: string) {
    setManualGames(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g))
  }

  function handleNameChange(idx: number, value: string) {
    setManualGames(prev => prev.map((g, i) => i === idx ? { ...g, name: value, appid: null } : g))
    setRowErrors(prev => prev.map((e, i) => i === idx ? null : e))
    setActiveIdxs(prev => prev.map((v, i) => i === idx ? -1 : v))
    setSearchError(null) // CE-21: 입력 변경 시 검색 에러 초기화
    if (!value.trim()) {
      setDropdowns(prev => prev.map((d, i) => i === idx ? null : d))
      if (debounceRefs.current[idx]) clearTimeout(debounceRefs.current[idx]!)
      debounceRefs.current[idx] = null
      return
    }
    if (debounceRefs.current[idx]) clearTimeout(debounceRefs.current[idx]!)
    const gen = ++searchGenRef.current[idx]
    setSearchLiveText('') // CE-31: 검색 시작 시 이전 결과 수 초기화
    debounceRefs.current[idx] = setTimeout(() => { void fetchSearch(idx, value, gen) }, 150)
  }

  async function fetchSearch(idx: number, query: string, gen: number) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json() as SearchResult[]
      if (gen !== searchGenRef.current[idx]) return
      setDropdowns(prev => prev.map((d, i) => i === idx ? data : d))
      setSearchLiveText(data.length > 0 ? `게임 ${data.length}개 검색됨` : '검색 결과 없음') // CE-31
    } catch {
      setSearchError('게임 검색에 실패했어요. 잠시 후 다시 시도해주세요.') // CE-21
    }
  }

  function selectGame(idx: number, appid: number, name: string) {
    trackEvent('search_used', { game_name: name })
    setManualGames(prev => prev.map((g, i) => i === idx ? { ...g, appid, name } : g))
    setDropdowns(prev => prev.map((d, i) => i === idx ? null : d))
    setActiveIdxs(prev => prev.map((v, i) => i === idx ? -1 : v))
    setRowErrors(prev => prev.map((e, i) => i === idx ? null : e))
    nameInputRefs.current[idx]?.focus()
  }

  function handleNameBlur(idx: number) {
    setTimeout(() => {
      setDropdowns(prev => prev.map((d, i) => i === idx ? null : d))
      setActiveIdxs(prev => prev.map((v, i) => i === idx ? -1 : v))
    }, 150)
    const game = manualGames[idx]
    if (game.name.trim() && game.appid === null) {
      setRowErrors(prev => prev.map((e, i) => i === idx ? '드롭다운에서 게임을 선택해주세요' : e))
    }
  }

  function handleNameKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    const items = dropdowns[idx]
    if (!items?.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdxs(prev => prev.map((v, i) => i === idx ? Math.min(v + 1, items.length - 1) : v))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdxs(prev => prev.map((v, i) => i === idx ? Math.max(v - 1, -1) : v))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const active = activeIdxs[idx]
      if (active >= 0 && items[active]) selectGame(idx, items[active].appid, items[active].name)
    } else if (e.key === 'Escape') {
      setDropdowns(prev => prev.map((d, i) => i === idx ? null : d))
      setActiveIdxs(prev => prev.map((v, i) => i === idx ? -1 : v))
    }
  }

  // 키보드로 이동한 항목이 드롭다운 뷰포트 밖에 있으면 스크롤
  useEffect(() => {
    activeIdxs.forEach((active, idx) => {
      if (active < 0) return
      document.getElementById(`game-option-${idx}-${active}`)?.scrollIntoView({ block: 'nearest' })
    })
  }, [activeIdxs])

  function switchMode(next: 'steam' | 'manual') {
    setMode(next)
    setError(null)
    setDropdowns(Array(5).fill(null))
    setActiveIdxs(Array(5).fill(-1))
    setRowErrors(Array(5).fill(null))
  }

  async function callApi(payload: object, analyticsMode: string): Promise<void> {
    const budgetValue = !freeOnly && budget.trim() ? Number(budget) : undefined
    const res = await fetch('/api/generate-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, budget: budgetValue, freeOnly }),
    })
    const data = await res.json() as { id?: string; error?: ErrorCode; filters?: { budget?: number; freeOnly?: boolean } }
    if (!res.ok || data.error) {
      if (data.error === 'NO_GAMES_IN_BUDGET') {
        if (data.filters?.freeOnly) setError('현재 무료 게임 중 추천 가능한 게임이 없어요')
        else setError('예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요')
      } else {
        setError(ERROR_MESSAGES[data.error ?? 'GENERAL_ERROR'])
      }
      return
    }
    trackEvent('recommendation_generated', { mode: analyticsMode })
    router.push(`/result/${data.id}`)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (authState === 'loading') return
    setError(null)
    // Client-side validation — avoid unnecessary API round-trip
    if (mode === 'steam' && !urlValid) {
      setError(ERROR_MESSAGES.INVALID_URL)
      return
    }
    loadingMsgRef.current = '취향 분석 중…'
    setLoading(true)

    try {
      if (mode === 'steam') {
        await callApi({ url: url.trim() }, 'steam')
      } else {
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
          return
        }
        const filledGames = manualGames.filter(g => g.name.trim() && g.appid !== null && g.playtime.trim())
        if (filledGames.length === 0) {
          setError('게임을 최소 1개 이상 입력해주세요')
          setLoading(false)
          return
        }
        await callApi({
          manualGames: filledGames.map(g => ({ appid: g.appid, name: g.name.trim(), playtime_hours: parseFloat(g.playtime) || 0 })),
        }, 'manual')
      }
    } catch {
      setError(ERROR_MESSAGES.GENERAL_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const urlValid = /steamcommunity\.com\/(id|profiles)\//.test(url)

  const canSubmit = mode === 'steam'
    ? urlValid
    : manualGames.some(g => g.name.trim() && g.appid !== null && g.playtime.trim())

  const [showLibraryPicker, setShowLibraryPicker] = useState(false)
  const steamId = url.match(/\/profiles\/(\d+)/)?.[1] ?? null
  const canUsePicker = authState !== 'anon' && authState !== 'loading' && steamId !== null

  async function handleLibraryConfirm(games: LibraryGame[]) {
    setShowLibraryPicker(false)
    setError(null)
    loadingMsgRef.current = '취향 분석 중…'
    setLoading(true)
    try {
      await callApi({
        manualGames: games.map(g => ({ appid: g.appid, name: g.name, playtime_hours: g.playtime_hours })),
      }, 'library_pick')
    } catch {
      setError(ERROR_MESSAGES.GENERAL_ERROR)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && (
        <LoadingOverlay message={loadingMsgRef.current} />
      )}
      {showLibraryPicker && steamId && (
        <LibraryPickerModal
          steamId={steamId}
          externalLoading={loading}
          onClose={() => setShowLibraryPicker(false)}
          onConfirm={handleLibraryConfirm}
        />
      )}
      <section ref={formRevealRef} className={`${styles.formSection}${formRevealed ? ` ${styles.formSectionRevealed}` : ''}`}>
        <div className={styles.inner}>
          <form id="recommend-form" className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* CE-31: 검색 결과 수 스크린 리더 공지 */}
            <span className={styles.srOnly} aria-live="polite" aria-atomic="true">{searchLiveText}</span>
            {mode === 'steam' && authState === 'steam' ? (
              <div className={styles.inputWrapper}>
                <p className={styles.steamAuthNotice}>Steam 계정이 연동되어 있어요</p>
                <p className={styles.manualNotice}>연동된 계정의 플레이 기록으로 바로 취향을 분석해요</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className={styles.steamAccountLink}>
                  연동 계정 ID: {steamId}
                </a>
                <button type="button" className={styles.modeToggle} onClick={() => setShowLibraryPicker(true)} disabled={loading}>
                  또는 라이브러리에서 직접 선택 →
                </button>
              </div>
            ) : mode === 'steam' ? (
              <div className={styles.inputWrapper}>
                <label className={styles.label} htmlFor="steam-url">
                  Steam 프로필 URL
                </label>
                <div className={styles.urlInputWrap}>
                  <input
                    id="steam-url" name="steam-url" type="url" className={styles.input}
                    placeholder="스팀 프로필 URL을 입력하세요…" value={url} onChange={e => setUrl(e.target.value)}
                    autoComplete="off" spellCheck={false} disabled={loading}
                  />
                  {urlValid && <span className={styles.urlValidIcon} aria-hidden="true">✓</span>}
                </div>
                {canUsePicker && (
                  <button type="button" className={styles.modeToggle} onClick={() => setShowLibraryPicker(true)} disabled={loading}>
                    또는 라이브러리에서 직접 선택 →
                  </button>
                )}
                <button type="button" className={styles.modeToggle} onClick={() => switchMode('manual')} disabled={loading}>
                  스팀 계정 없이 추천받기 →
                </button>
                {(authState === 'anon' || authState === 'unlinked_auth') && (
                  <p className={styles.manualNotice}>스팀 계정 없이는 피드백이 저장되지 않아요.</p>
                )}
              </div>
            ) : (
              <div className={styles.inputWrapper}>
                <span className={styles.label}>플레이한 게임 입력 (최대 5개)</span>
                <p className={styles.manualNotice}>검색창에 이름을 입력하면 드롭다운에서 게임을 선택할 수 있어요</p>
                <div className={styles.manualRows} role="group" aria-label="게임 목록">
                  {manualGames.map((g, i) => (
                    <div key={i}>
                      <div className={styles.manualRow}>
                        <span className={styles.manualRowNum} aria-hidden="true">{i + 1}</span>
                        <div className={styles.dropdownWrapper}>
                          <input
                            ref={el => { nameInputRefs.current[i] = el }}
                            type="text" name={`game-name-${i}`} className={styles.input}
                            placeholder="게임 이름 검색…" value={g.name} onChange={e => handleNameChange(i, e.target.value)}
                            onBlur={() => handleNameBlur(i)} onKeyDown={e => handleNameKeyDown(i, e)}
                            autoComplete="off" spellCheck={false} disabled={loading}
                            aria-label={`게임 ${i + 1} 이름`} aria-autocomplete="list" aria-expanded={!!dropdowns[i]?.length}
                            aria-haspopup="listbox" aria-controls={`game-dropdown-${i}`} role="combobox"
                            aria-activedescendant={activeIdxs[i] >= 0 ? `game-option-${i}-${activeIdxs[i]}` : undefined}
                          />
                          {!!dropdowns[i]?.length && (
                            <div id={`game-dropdown-${i}`} className={styles.dropdown} role="listbox" aria-label={`게임 ${i + 1} 검색 결과`}>
                              {dropdowns[i]!.map((item, j) => (
                                <button
                                  key={item.appid} id={`game-option-${i}-${j}`}
                                  type="button" role="option"
                                  className={`${styles.dropdownItem}${activeIdxs[i] === j ? ` ${styles.dropdownItemActive}` : ''}`}
                                  aria-selected={activeIdxs[i] === j}
                                  onMouseDown={() => selectGame(i, item.appid, item.name)}
                                >
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="number" name={`game-playtime-${i}`} className={`${styles.input} ${styles.inputNarrow}`}
                          placeholder="예: 50시간" value={g.playtime} onChange={e => updateManualGame(i, 'playtime', e.target.value)}
                          autoComplete="off" inputMode="decimal" min={0} disabled={loading} aria-label={`게임 ${i + 1} 플레이 시간 (시간)`}
                        />
                      </div>
                      {rowErrors[i] && <p className={styles.rowError} role="alert">{rowErrors[i]}</p>}
                    </div>
                  ))}
                </div>
                {searchError && <p className={styles.rowError}>{searchError}</p>}
                {!canSubmit && manualGames.some(g => g.name.trim() && g.appid !== null) && (
                  <p className={styles.manualNotice}>이름과 플레이 시간을 모두 입력해야 추천받을 수 있어요</p>
                )}
                <button type="button" className={styles.modeToggle} onClick={() => switchMode('steam')} disabled={loading}>
                  ← 스팀 계정으로 추천받기
                </button>
                <p className={styles.manualNotice}>
                  스팀 계정 없이는 피드백이 저장되지 않아요. 같은 계정으로 여러 번 추천받을수록 정확해지는 방식이라, 첫 추천은 다소 부정확할 수 있어요.
                </p>
              </div>
            )}

            <div className={styles.inputWrapper}>
              <label className={styles.label} htmlFor="budget">예산 (선택)</label>
              <input
                id="budget" name="budget" type="number" inputMode="numeric" className={styles.input}
                placeholder="예: 20000" value={budget} onChange={e => setBudget(e.target.value)}
                autoComplete="off" min={0} disabled={loading || freeOnly}
              />
              <label className={`${styles.toggleRow}${loading ? ` ${styles.toggleRowDisabled}` : ''}`}>
                <input
                  type="checkbox" name="free-only" className={styles.toggleCheckbox} checked={freeOnly}
                  onChange={e => { setFreeOnly(e.target.checked); if (e.target.checked) setBudget('') }}
                  disabled={loading}
                />
                무료 게임만 보기
              </label>
            </div>

            <button type="submit" className={`${styles.button}${loading ? ` ${styles.buttonLoading}` : ''}`} disabled={loading || !canSubmit || authState === 'loading'}>
              {loading
                ? '취향 분석 중…'
                : '게임 추천받기'
              }
            </button>
          </form>

          {error && (
            <p ref={errorRef} tabIndex={-1} className={styles.error} role="alert">{error}</p>
          )}
        </div>
      </section>
    </>
  )
}
