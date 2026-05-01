'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { GameComment } from '@/types'
import styles from './page.module.css'

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function shortId(userId: string) {
  return `유저·${userId.slice(0, 8)}`
}

// ── CommentsSection ────────────────────────────────────────────────────────────

interface Props {
  appid: string
}

export default function CommentsSection({ appid }: Props) {
  const [comments, setComments] = useState<GameComment[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [userId, setUserId] = useState<string | null>(null)

  // 루트 댓글 폼
  const [body, setBody] = useState('')
  const [rootError, setRootError] = useState<string | null>(null)

  // 답글 폼
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Supabase 브라우저 클라이언트 — ref로 보관 (재렌더 불필요)
  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${appid}/comments`).then(r => r.json()),
      supabaseRef.current.auth.getSession(),
    ])
      .then(([data, { data: { session } }]) => {
        setComments(data.comments ?? [])
        setUserId(session?.user.id ?? null)
        setLoadState('ok')
      })
      .catch(() => setLoadState('error'))
  }, [appid])

  async function handlePost(parentId: string | null, text: string) {
    if (submitting) return
    const trimmed = text.trim()
    if (!trimmed) return

    setSubmitting(true)
    if (parentId) setReplyError(null)
    else setRootError(null)

    try {
      const res = await fetch(`/api/games/${appid}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed, parent_id: parentId }),
      })
      const json = (await res.json()) as { comment?: GameComment; error?: string }

      if (!res.ok) {
        const msg = json.error ?? '오류가 발생했습니다. 다시 시도해 주세요.'
        if (parentId) setReplyError(msg)
        else setRootError(msg)
      } else if (json.comment) {
        setComments(curr => [json.comment!, ...curr])
        if (parentId) {
          setReplyTo(null)
          setReplyBody('')
        } else {
          setBody('')
        }
      }
    } catch {
      const msg = '네트워크 오류가 발생했습니다.'
      if (parentId) setReplyError(msg)
      else setRootError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await fetch(`/api/games/${appid}/comments?id=${commentId}`, { method: 'DELETE' })
      setComments(curr => curr.filter(c => c.id !== commentId))
    } catch {
      // silent — 댓글 목록은 그대로 유지
    } finally {
      setConfirmDeleteId(null)
    }
  }

  // confirmDeleteId 변경 시 확인 버튼으로 포커스 이동
  useEffect(() => {
    if (confirmDeleteId) confirmBtnRef.current?.focus()
  }, [confirmDeleteId])

  // 답글 폼 열릴 때 textarea로 포커스 이동
  useEffect(() => {
    if (replyTo) replyTextareaRef.current?.focus()
  }, [replyTo])

  function openReply(commentId: string) {
    setReplyTo(commentId)
    setReplyBody('')
    setReplyError(null)
  }

  // 루트 댓글(최신순) + 대댓글(오래된순) 정렬 — 파생값이므로 state 불필요
  const roots = comments
    .filter(c => c.parent_id === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  function getReplies(parentId: string) {
    return comments
      .filter(c => c.parent_id === parentId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  // ── 로딩 / 에러 상태 ────────────────────────────────────────────────────────

  if (loadState === 'loading') {
    return (
      <section className={styles.commentsSection} aria-labelledby="comments-heading">
        <h2 id="comments-heading" className={styles.sectionTitle}>커뮤니티</h2>
        <p className={styles.commentsStatus}>불러오는 중…</p>
      </section>
    )
  }

  if (loadState === 'error') {
    return (
      <section className={styles.commentsSection} aria-labelledby="comments-heading">
        <h2 id="comments-heading" className={styles.sectionTitle}>커뮤니티</h2>
        <p className={styles.commentsStatus}>댓글을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>
      </section>
    )
  }

  // ── 메인 렌더 ───────────────────────────────────────────────────────────────

  return (
    <section className={styles.commentsSection} aria-labelledby="comments-heading">
      <h2 id="comments-heading" className={styles.sectionTitle}>커뮤니티</h2>

      {/* 댓글 작성 폼 — 로그인 유저만 */}
      {userId ? (
        <div className={styles.commentFormWrap}>
          <label htmlFor="comment-body" className={styles.srOnly}>댓글 작성</label>
          <textarea
            id="comment-body"
            name="comment-body"
            className={styles.commentTextarea}
            placeholder="이 게임에 대해 이야기해 보세요… (최대 500자)"
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={500}
            rows={3}
            autoComplete="off"
            aria-describedby={rootError ? 'comment-root-error' : undefined}
          />
          {rootError && (
            <p id="comment-root-error" className={styles.commentError} aria-live="polite">
              {rootError}
            </p>
          )}
          <div className={styles.commentFormFooter}>
            <span className={styles.charCount} aria-hidden="true">{body.length}/500</span>
            <button
              type="button"
              className={styles.commentSubmitBtn}
              onClick={() => handlePost(null, body)}
              disabled={submitting || body.trim().length === 0}
            >
              {submitting && !replyTo ? '등록 중…' : '등록'}
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.commentsLoginPrompt}>댓글을 작성하려면 로그인이 필요합니다.</p>
      )}

      {/* 댓글 목록 */}
      {roots.length === 0 ? (
        <p className={styles.commentsStatus}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
      ) : (
        <ul className={styles.commentsList}>
          {roots.map(comment => {
            const replies = getReplies(comment.id)
            const isOwn = comment.user_id === userId
            const reportHref = `mailto:contact@guildeline.com?subject=${encodeURIComponent('댓글 신고')}&body=${encodeURIComponent(`댓글 ID: ${comment.id}\n게임 appid: ${appid}`)}`

            return (
              <li key={comment.id} className={styles.commentItem}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentAuthor}>{shortId(comment.user_id)}</span>
                  <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
                </div>
                <p className={styles.commentBody}>{comment.body}</p>
                <div className={styles.commentActions}>
                  {userId && replyTo !== comment.id && (
                    <button
                      type="button"
                      className={styles.commentActionBtn}
                      onClick={() => openReply(comment.id)}
                      aria-label={`${shortId(comment.user_id)}의 댓글에 답글 달기`}
                    >
                      답글
                    </button>
                  )}
                  {isOwn && confirmDeleteId !== comment.id && (
                    <button
                      type="button"
                      className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                      onClick={() => setConfirmDeleteId(comment.id)}
                      aria-label="내 댓글 삭제"
                    >
                      삭제
                    </button>
                  )}
                  {isOwn && confirmDeleteId === comment.id && (
                    <span className={styles.deleteConfirm}>
                      <span className={styles.deleteConfirmLabel}>정말 삭제할까요?</span>
                      <button
                        ref={confirmBtnRef}
                        type="button"
                        className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                        onClick={() => handleDelete(comment.id)}
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        className={styles.commentActionBtn}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        취소
                      </button>
                    </span>
                  )}
                  <a
                    href={reportHref}
                    className={styles.commentReportLink}
                    aria-label="이 댓글 신고하기"
                  >
                    신고
                  </a>
                </div>

                {/* 인라인 답글 폼 */}
                {replyTo === comment.id && (
                  <div className={styles.replyForm}>
                    <label htmlFor={`reply-${comment.id}`} className={styles.srOnly}>답글 작성</label>
                    <textarea
                      ref={replyTextareaRef}
                      id={`reply-${comment.id}`}
                      name="reply-body"
                      className={styles.commentTextarea}
                      placeholder="답글을 입력하세요… (최대 500자)"
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      maxLength={500}
                      rows={2}
                      autoComplete="off"
                      aria-describedby={replyError ? `reply-error-${comment.id}` : undefined}
                    />
                    {replyError && (
                      <p
                        id={`reply-error-${comment.id}`}
                        className={styles.commentError}
                        aria-live="polite"
                      >
                        {replyError}
                      </p>
                    )}
                    <div className={styles.commentFormFooter}>
                      <span className={styles.charCount} aria-hidden="true">{replyBody.length}/500</span>
                      <button
                        type="button"
                        className={styles.commentActionBtn}
                        onClick={() => { setReplyTo(null); setReplyBody('') }}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className={styles.commentSubmitBtn}
                        onClick={() => handlePost(comment.id, replyBody)}
                        disabled={submitting || replyBody.trim().length === 0}
                      >
                        {submitting && replyTo === comment.id ? '등록 중…' : '등록'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 대댓글 목록 */}
                {replies.length > 0 && (
                  <ul className={styles.repliesList}>
                    {replies.map(reply => {
                      const isReplyOwn = reply.user_id === userId
                      const replyReportHref = `mailto:contact@guildeline.com?subject=${encodeURIComponent('댓글 신고')}&body=${encodeURIComponent(`댓글 ID: ${reply.id}\n게임 appid: ${appid}`)}`
                      return (
                        <li key={reply.id} className={styles.replyItem}>
                          <div className={styles.commentMeta}>
                            <span className={styles.commentAuthor}>{shortId(reply.user_id)}</span>
                            <span className={styles.commentDate}>{formatDate(reply.created_at)}</span>
                          </div>
                          <p className={styles.commentBody}>{reply.body}</p>
                          <div className={styles.commentActions}>
                            {isReplyOwn && confirmDeleteId !== reply.id && (
                              <button
                                type="button"
                                className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                                onClick={() => setConfirmDeleteId(reply.id)}
                                aria-label="내 답글 삭제"
                              >
                                삭제
                              </button>
                            )}
                            {isReplyOwn && confirmDeleteId === reply.id && (
                              <span className={styles.deleteConfirm}>
                                <span className={styles.deleteConfirmLabel}>정말 삭제할까요?</span>
                                <button
                                  ref={confirmBtnRef}
                                  type="button"
                                  className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                                  onClick={() => handleDelete(reply.id)}
                                >
                                  삭제
                                </button>
                                <button
                                  type="button"
                                  className={styles.commentActionBtn}
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  취소
                                </button>
                              </span>
                            )}
                            <a
                              href={replyReportHref}
                              className={styles.commentReportLink}
                              aria-label="이 답글 신고하기"
                            >
                              신고
                            </a>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
