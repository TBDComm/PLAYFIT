'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { LibraryGame } from '@/lib/steam'
import styles from './LibraryPickerModal.module.css'

interface Props {
  steamId: string
  externalLoading: boolean
  onClose: () => void
  onConfirm: (games: LibraryGame[]) => void
}

export default function LibraryPickerModal({ steamId, externalLoading, onClose, onConfirm }: Props) {
  const [mounted, setMounted] = useState(false)
  const [games, setGames] = useState<LibraryGame[] | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [retryCount, setRetryCount] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    // 이전 요청 취소 후 새 컨트롤러 생성
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setGames(null)
    setFetchError(null)

    const timeoutId = setTimeout(() => controller.abort(), 10000)

    fetch(`/api/steam/library?steamId=${steamId}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data: { games?: LibraryGame[]; error?: string }) => {
        clearTimeout(timeoutId)
        if (data.error) setFetchError('라이브러리를 불러올 수 없어요')
        else setGames(data.games ?? [])
      })
      .catch(() => {
        clearTimeout(timeoutId)
        setFetchError('라이브러리를 불러올 수 없어요')
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [steamId, retryCount])

  useEffect(() => {
    if (games !== null) searchRef.current?.focus()
  }, [games])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = games
    ? games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : []

  function toggleGame(appid: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(appid)) {
        next.delete(appid)
      } else if (next.size < 5) {
        next.add(appid)
      }
      return next
    })
  }

  function handleConfirm() {
    const selectedGames = (games ?? []).filter(g => selected.has(g.appid))
    onConfirm(selectedGames)
  }

  const content = (
    <div
      className={styles.backdrop}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="라이브러리에서 게임 선택"
      >
        <div className={styles.header}>
          <span className={styles.title}>라이브러리에서 선택</span>
          <span className={`${styles.count}${selected.size >= 5 ? ` ${styles.countFull}` : ''}`}>
            {selected.size >= 5 ? '최대 선택 완료' : `${selected.size} / 5 선택`}
          </span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className={styles.searchWrap}>
          <input
            ref={searchRef}
            type="text"
            name="game-search"
            aria-label="게임 검색"
            className={styles.searchInput}
            placeholder="게임 검색…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.list} role="listbox" aria-multiselectable="true" aria-label="게임 목록">
          {games === null && !fetchError && (
            <p className={styles.statusMsg}>라이브러리 불러오는 중…</p>
          )}
          {fetchError && (
            <>
              <p className={styles.statusMsg}>{fetchError}</p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => setRetryCount(c => c + 1)}
              >
                다시 시도
              </button>
            </>
          )}
          {games !== null && filtered.length === 0 && (
            <p className={styles.statusMsg}>검색 결과가 없어요</p>
          )}
          {filtered.map(game => {
            const isSelected = selected.has(game.appid)
            const isDisabled = !isSelected && selected.size >= 5
            return (
              <button
                key={game.appid}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.gameRow}${isSelected ? ` ${styles.gameRowSelected}` : ''}${isDisabled ? ` ${styles.gameRowDisabled}` : ''}`}
                onClick={() => toggleGame(game.appid)}
                disabled={isDisabled}
              >
                <img
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/capsule_sm_120.jpg`}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  width={80}
                  height={30}
                  className={styles.thumb}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <span className={styles.gameName}>{game.name}</span>
                {game.playtime_hours > 0 && (
                  <span className={styles.playtime}>{game.playtime_hours}h</span>
                )}
                <span className={styles.checkbox} aria-hidden="true">
                  {isSelected ? '☑' : '☐'}
                </span>
              </button>
            )
          })}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={selected.size === 0 || externalLoading}
          >
            {externalLoading ? '분석 중…' : selected.size === 0 ? '게임을 선택해 주세요' : `${selected.size}개 게임으로 추천받기`}
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
