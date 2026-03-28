'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import type { SavedGame } from '@/types'
import styles from '../page.module.css'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type PanelState = { game: SavedGame; top: number; left: number }

export default function SavedGames() {
  const [authState, setAuthState] = useState<'loading' | 'authed' | 'anon'>('loading')
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [failedSavedImages, setFailedSavedImages] = useState<Set<string>>(new Set())

  // Hover panel state
  const [hoveredPanel, setHoveredPanel] = useState<PanelState | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const hoveredPanelRef = useRef<PanelState | null>(null)
  const panelLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? 'authed' : 'anon')
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session ? 'authed' : 'anon')
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (authState !== 'authed') return
    const fetchSavedGames = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await fetch('/api/saved-games', { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (res.ok) {
          const { saved } = await res.json() as { saved: SavedGame[] }
          setSavedGames(saved)
        }
      } catch { /* silent fail */ }
    }
    void fetchSavedGames()
  }, [authState])

  async function handleUnsave(appid: string) {
    setSavedGames(prev => prev.filter(g => g.appid !== appid))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    fetch(`/api/saved-games/${appid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => { /* silent fail */ })
  }

  function handleCardEnter(game: SavedGame, el: HTMLElement) {
    if (panelLeaveTimer.current) clearTimeout(panelLeaveTimer.current)
    if (panelHideTimer.current) clearTimeout(panelHideTimer.current)
    if (hoveredPanelRef.current) setPanelVisible(true)

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

  function handleCardLeave() {
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

  return (
    <section className={styles.savedSection}>
      <div className={styles.inner}>
      <p className={styles.previewLabel}>내 저장 목록</p>
      <p className={styles.previewTitle}>내가 저장한 게임</p>

      {authState === 'loading' && (
        <div className={styles.savedStrip}>
          {[...Array(4)].map((_, i) => <div key={i} className={styles.savedPlaceholder} />)}
        </div>
      )}

      {authState === 'anon' && (
        <>
          <div className={styles.savedStrip}>
            {[...Array(4)].map((_, i) => <div key={i} className={styles.savedPlaceholder} />)}
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

      {authState === 'authed' && savedGames.length === 0 && (
        <>
          <div className={styles.savedStrip}>
            {[...Array(4)].map((_, i) => <div key={i} className={styles.savedPlaceholder} />)}
          </div>
          <p className={styles.savedStatusMsg}>추천받은 게임을 저장하면 여기에 표시돼요</p>
          <a href="#recommend-form" className={styles.savedLoginBtn}>지금 추천받기 ↑</a>
        </>
      )}

      {authState === 'authed' && savedGames.length > 0 && (
        <ul className={styles.savedStrip}>
          {savedGames.map(game => (
            <li
              key={game.appid}
              className={`${styles.savedCard}${hoveredPanel?.game.appid === game.appid ? ` ${styles.savedCardActive}` : ''}${hoveredPanel && hoveredPanel.game.appid !== game.appid ? ` ${styles.savedCardDimmed}` : ''}`}
              onMouseEnter={(e) => handleCardEnter(game, e.currentTarget)}
              onMouseLeave={handleCardLeave}
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
                <button
                  className={styles.savedCardKbdUnsave}
                  onClick={() => handleUnsave(game.appid)}
                  onFocus={(e) => { const li = e.currentTarget.closest('li') as HTMLElement | null; if (li) handleCardEnter(game, li) }}
                  onBlur={handleCardLeave}
                  aria-label={`${game.name} 저장 취소`}
                >
                  저장 취소
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hoveredPanel && typeof document !== 'undefined' && createPortal(
        <div
          className={`${styles.savedFloatingPanel}${panelVisible ? ` ${styles.savedFloatingPanelVisible}` : ''}`}
          style={{ top: hoveredPanel.top, left: hoveredPanel.left }}
          onMouseEnter={cancelPanelLeave}
          onMouseLeave={handleCardLeave}
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
            onClick={() => { handleUnsave(hoveredPanel.game.appid); dismissPanel() }}
            aria-label={`${hoveredPanel.game.name} 저장 취소`}
          >
            저장 취소
          </button>
        </div>,
        document.body
      )}
      </div>
    </section>
  )
}
