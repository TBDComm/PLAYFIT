'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import LoadingOverlay from '@/app/components/LoadingOverlay'
import type { ErrorCode } from '@/types'
import styles from './page.module.css'

const STEAM_URL_REGEX = /steamcommunity\.com\/(id|profiles)\//

const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  INVALID_URL: '올바른 Steam 프로필 URL을 입력해주세요',
  ALL_PRIVATE: '모든 멤버의 프로필이 비공개예요. 공개로 설정 후 시도해주세요',
  NOT_ENOUGH_MEMBERS: '유효한 멤버가 2명 이상 필요해요',
  NO_GAMES_IN_BUDGET: '예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요',
  AI_PARSE_FAILURE: '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요',
  GENERAL_ERROR: '오류가 발생했어요. 잠시 후 다시 시도해주세요',
  DB_NOT_READY: '서버가 아직 준비 중이에요. 잠시 후 다시 시도해주세요',
  TAG_EXTRACTION_FAILED: '취향 태그를 추출할 수 없어요',
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'private' | 'insufficient' | 'resolve_failed' | 'invalid_url'

const VALIDATION_MESSAGES: Partial<Record<ValidationStatus, string>> = {
  private: '비공개 프로필이에요. Steam 설정에서 공개로 변경해주세요',
  insufficient: '플레이 기록이 너무 적어요 (최소 5개 게임이 필요합니다)',
  resolve_failed: 'Steam 프로필을 찾을 수 없어요',
  invalid_url: '올바른 Steam 프로필 URL을 입력해주세요',
}

const INVALID_STATUSES: ValidationStatus[] = ['private', 'insufficient', 'resolve_failed', 'invalid_url']

export default function SquadPage() {
  const router = useRouter()
  const { steamId: contextSteamId } = useAuth()

  const [urls, setUrls] = useState<string[]>(['', ''])
  const [validations, setValidations] = useState<ValidationStatus[]>(['idle', 'idle'])
  const [budget, setBudget] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const debounceRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const versionRefs = useRef<Map<number, number>>(new Map())

  // 언마운트 시 debounce 정리
  useEffect(() => {
    const refs = debounceRefs.current
    return () => { refs.forEach(timer => clearTimeout(timer)) }
  }, [])

  const triggerValidation = useCallback((index: number, url: string) => {
    const existing = debounceRefs.current.get(index)
    if (existing) clearTimeout(existing)

    setValidations(prev => {
      const next = [...prev]
      next[index] = 'idle'
      return next
    })

    if (!STEAM_URL_REGEX.test(url)) return

    // 버전 증가 — 구버전 응답 무시용
    const version = (versionRefs.current.get(index) ?? 0) + 1
    versionRefs.current.set(index, version)

    const timer = setTimeout(async () => {
      setValidations(prev => {
        const next = [...prev]
        next[index] = 'checking'
        return next
      })

      try {
        const res = await fetch(`/api/squad/validate?url=${encodeURIComponent(url)}`)
        const data = await res.json() as { status: ValidationStatus }

        if (versionRefs.current.get(index) !== version) return
        setValidations(prev => {
          const next = [...prev]
          next[index] = data.status
          return next
        })
      } catch {
        if (versionRefs.current.get(index) !== version) return
        setValidations(prev => {
          const next = [...prev]
          next[index] = 'idle'
          return next
        })
      }
    }, 700)

    debounceRefs.current.set(index, timer)
  }, [])

  // 호스트 Steam URL 자동 채우기
  useEffect(() => {
    if (contextSteamId) {
      const url = `https://steamcommunity.com/profiles/${contextSteamId}`
      setUrls(prev => {
        const next = [...prev]
        next[0] = url
        return next
      })
      triggerValidation(0, url)
    }
  }, [contextSteamId, triggerValidation])

  // 에러 발생 시 포커스 이동
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  function handleUrlChange(index: number, value: string) {
    setUrls(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
    triggerValidation(index, value)
  }

  function addMember() {
    if (urls.length < 4) {
      setUrls(prev => [...prev, ''])
      setValidations(prev => [...prev, 'idle'])
    }
  }

  function removeMember(index: number) {
    // 버전 bump — 해당 슬롯의 진행 중인 요청 무효화
    versionRefs.current.set(index, (versionRefs.current.get(index) ?? 0) + 1)
    const existing = debounceRefs.current.get(index)
    if (existing) clearTimeout(existing)
    debounceRefs.current.delete(index)
    setUrls(prev => prev.filter((_, i) => i !== index))
    setValidations(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const filled = urls.filter(u => u.trim())
    if (filled.length < 2) {
      setError('Steam URL을 최소 2개 입력해주세요')
      return
    }
    for (const u of filled) {
      if (!STEAM_URL_REGEX.test(u)) {
        setError(ERROR_MESSAGES['INVALID_URL'] ?? '올바른 Steam URL을 입력해주세요')
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/squad', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          memberUrls: filled,
          budget: !freeOnly && budget ? Number(budget) : undefined,
          freeOnly,
        }),
      })

      const data = await res.json() as { shareToken?: string; error?: ErrorCode }

      if (!res.ok || !data.shareToken) {
        const code = data.error ?? 'GENERAL_ERROR'
        setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES['GENERAL_ERROR']!)
        setLoading(false)
        return
      }

      router.push(`/squad/${data.shareToken}`)
    } catch {
      setError(ERROR_MESSAGES['GENERAL_ERROR']!)
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <LoadingOverlay message="스쿼드 취향 분석 중…" />}

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>스쿼드 추천</h1>
          <p className={styles.subtitle}>
            2~4명의 Steam URL을 입력하면 모두가 즐길 수 있는 게임을 찾아드려요.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* URL 입력 행들 */}
          <fieldset className={styles.urlFieldset}>
            <legend className={styles.fieldLabel}>
              멤버 Steam 프로필 URL
              <span className={styles.countBadge}>{urls.length} / 4</span>
            </legend>

            {urls.map((url, index) => {
              const validation = validations[index] ?? 'idle'
              const errorMsg = VALIDATION_MESSAGES[validation] ?? null
              const isInvalid = INVALID_STATUSES.includes(validation)
              return (
                <div key={index} className={styles.urlRow}>
                  <label htmlFor={`url-${index}`} className={styles.urlLabel}>
                    {index === 0 ? '호스트 (나)' : `멤버 ${index + 1}`}
                  </label>
                  <div className={styles.urlFieldCol}>
                    <div className={styles.urlInputWrap}>
                      <input
                        id={`url-${index}`}
                        name={`member-url-${index}`}
                        type="url"
                        value={url}
                        onChange={e => handleUrlChange(index, e.target.value)}
                        placeholder="예: https://steamcommunity.com/id/username"
                        className={`${styles.input} ${isInvalid ? styles.inputError : ''}`}
                        autoComplete="off"
                        spellCheck={false}
                        aria-describedby={errorMsg ? `url-error-${index}` : undefined}
                        aria-invalid={isInvalid ? 'true' : undefined}
                      />
                      {validation === 'checking' && (
                        <span className={styles.urlChecking} aria-hidden="true">…</span>
                      )}
                      {validation === 'valid' && (
                        <span className={styles.urlValid} aria-hidden="true">✓</span>
                      )}
                      {isInvalid && (
                        <span className={styles.urlInvalid} aria-hidden="true">✕</span>
                      )}
                    </div>
                    {errorMsg && (
                      <p
                        id={`url-error-${index}`}
                        className={styles.urlErrorMsg}
                        aria-live="polite"
                      >
                        {errorMsg}
                      </p>
                    )}
                  </div>
                  {/* 행 삭제 — 최소 2개 유지 */}
                  {urls.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className={styles.removeBtn}
                      aria-label={`${index === 0 ? '호스트' : `멤버 ${index + 1}`} 제거`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}

            {urls.length < 4 && (
              <button type="button" onClick={addMember} className={styles.addBtn}>
                + 멤버 추가
              </button>
            )}
          </fieldset>

          {/* 예산 설정 */}
          <div className={styles.optionRow}>
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${!freeOnly ? styles.toggleActive : ''}`}
                onClick={() => setFreeOnly(false)}
                aria-pressed={!freeOnly}
              >
                예산 설정
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${freeOnly ? styles.toggleActive : ''}`}
                onClick={() => setFreeOnly(true)}
                aria-pressed={freeOnly}
              >
                무료게임 추천
              </button>
            </div>

            {!freeOnly && (
              <div className={styles.budgetWrap}>
                <label htmlFor="budget" className={styles.budgetLabel}>
                  예산 설정하기
                </label>
                <div className={styles.budgetInputWrap}>
                  <input
                    id="budget"
                    type="number"
                    inputMode="numeric"
                    name="budget"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="예: 20000"
                    className={`${styles.input} ${styles.budgetInput}`}
                    min={0}
                    aria-describedby="budget-unit"
                  />
                  <span id="budget-unit" className={styles.budgetUnit}>원</span>
                </div>
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p
              ref={errorRef}
              className={styles.errorMsg}
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            취향 분석 시작
          </button>
        </form>
      </main>
    </>
  )
}
