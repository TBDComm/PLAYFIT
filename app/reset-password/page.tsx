'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import styles from './page.module.css'
import GuildelineMark from '@/app/components/GuildelineMark'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent) => {
        if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async () => {
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않아요')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('비밀번호 변경에 실패했어요. 링크가 만료됐을 수 있어요')
    } else {
      setDone(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <GuildelineMark size={48} />
        <h1 className={styles.title}>새 비밀번호 설정</h1>
        <div className={styles.card}>
          {done ? (
            <p className={styles.desc}>비밀번호가 변경됐어요. 홈으로 이동합니다…</p>
          ) : !sessionReady ? (
            <p className={styles.desc}>링크를 확인하는 중…</p>
          ) : (
            <>
              <div className={styles.fieldGroup}>
                <label htmlFor="new-password" className={styles.fieldLabel}>새 비밀번호</label>
                <input
                  id="new-password"
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  className={styles.input}
                  placeholder="6자 이상…"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="confirm-password" className={styles.fieldLabel}>비밀번호 확인</label>
                <input
                  id="confirm-password"
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  className={styles.input}
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  spellCheck={false}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && password && passwordConfirm) void handleSubmit()
                  }}
                />
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button
                onClick={handleSubmit}
                className={styles.primaryBtn}
                disabled={loading || !password || !passwordConfirm}
              >
                {loading ? '변경 중…' : '비밀번호 변경'}
              </button>
            </>
          )}
        </div>
        <div className={styles.footer}>
          <Link href="/" className={styles.footerLink}>← 홈으로</Link>
        </div>
      </div>
    </main>
  )
}
