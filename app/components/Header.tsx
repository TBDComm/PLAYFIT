'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import styles from './Header.module.css'

export default function Header() {
  const [session, setSession] = useState<Session | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        if (event === 'SIGNED_IN') setShowLoginModal(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Close modal on Escape; focus first button on open
  useEffect(() => {
    if (!showLoginModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLoginModal(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    modalRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showLoginModal])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    router.push('/')
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
      },
    })
  }

  const handleSteamLogin = () => {
    window.location.href = '/api/auth/steam'
  }

  return (
    <>
      <header className={styles.header}>
        <span className={styles.logo}>PLAYFIT</span>
        <div>
          {session ? (
            <button onClick={handleLogout} className={styles.logoutBtn}>
              로그아웃
            </button>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className={styles.loginBtn}>
              로그인
            </button>
          )}
        </div>
      </header>

      {showLoginModal && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false) }}
        >
          <div className={styles.modal} ref={modalRef}>
            <div className={styles.modalHeader}>
              <h2 id="login-modal-title" className={styles.modalTitle}>로그인</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className={styles.closeBtn}
                aria-label="모달 닫기"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <button onClick={handleGoogleLogin} className={styles.googleBtn}>
                Google로 로그인
              </button>
              <button onClick={handleSteamLogin} className={styles.steamBtn}>
                Steam으로 로그인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
