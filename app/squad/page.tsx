'use client'

import { useState, useEffect, useRef } from 'react'
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

export default function SquadPage() {
  const router = useRouter()
  const { steamId: contextSteamId } = useAuth()

  // Steam URL 입력 행 목록 — 최소 2개, 최대 4개
  const [urls, setUrls] = useState<string[]>(['', ''])
  const [budget, setBudget] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  // 호스트 Steam URL 자동 채우기
  useEffect(() => {
    if (contextSteamId) {
      setUrls(prev => {
        const next = [...prev]
        next[0] = `https://steamcommunity.com/profiles/${contextSteamId}`
        return next
      })
    }
  }, [contextSteamId])

  // 에러 발생 시 포커스 이동
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  function setUrl(index: number, value: string) {
    setUrls(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function addMember() {
    if (urls.length < 4) setUrls(prev => [...prev, ''])
  }

  function removeMember(index: number) {
    setUrls(prev => prev.filter((_, i) => i !== index))
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
              const isValid = url.trim() && STEAM_URL_REGEX.test(url)
              return (
                <div key={index} className={styles.urlRow}>
                  <label htmlFor={`url-${index}`} className={styles.urlLabel}>
                    {index === 0 ? '호스트 (나)' : `멤버 ${index + 1}`}
                  </label>
                  <div className={styles.urlInputWrap}>
                    <input
                      id={`url-${index}`}
                      name={`member-url-${index}`}
                      type="url"
                      value={url}
                      onChange={e => setUrl(index, e.target.value)}
                      placeholder="예: https://steamcommunity.com/id/username"
                      className={styles.input}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {isValid && (
                      <span className={styles.urlValid} aria-hidden="true">✓</span>
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
                무료만
              </button>
            </div>

            {!freeOnly && (
              <div className={styles.budgetWrap}>
                <label htmlFor="budget" className={styles.budgetLabel}>
                  예산
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
