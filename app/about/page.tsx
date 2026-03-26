import Link from 'next/link'
import type { Metadata } from 'next'
import styles from '../legal.module.css'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '서비스 소개 — Guildeline',
  description: 'Guildeline은 Steam 플레이 기록과 예산을 바탕으로 AI가 게임을 추천해 주는 서비스입니다. 서비스 운영 주체와 목적을 소개합니다.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLogo} aria-label="GUILDELINE 홈으로">
        <span className={styles.backLogoAccent}>GUILD</span>ELINE
      </Link>
      <h1>서비스 소개</h1>
      <p className={styles.updated}>Guildeline — AI 게임 추천 서비스</p>

      <h2>무엇을 하는 서비스인가요?</h2>
      <p>
        Guildeline은 Steam 플레이 기록을 분석해 취향에 맞는 게임을 AI가 추천해 주는 서비스입니다.
        장르, 플레이 시간, 선호 태그를 종합해 예산 범위 내에서 실제로 좋아할 만한 게임을 찾아드립니다.
      </p>
      <p>
        Steam ID 하나만 있으면 충분합니다. 별도 설치나 가입 없이도 바로 추천을 받을 수 있습니다.
      </p>

      <h2>어떻게 만들어졌나요?</h2>
      <p>
        Guildeline은 개인 개발자가 만든 독립 프로젝트입니다. &ldquo;이미 가진 게임 라이브러리를 기반으로
        다음에 뭘 사야 할지 알고 싶다&rdquo;는 단순한 문제의식에서 출발했습니다.
      </p>
      <p>
        Steam Web API, Claude AI, Supabase를 조합해 만들어졌으며,
        Valve Corporation 및 Steam과 무관한 독립 서비스입니다.
      </p>

      <h2>누가 운영하나요?</h2>
      <p>
        개인 개발자가 운영하는 소규모 서비스입니다. 서비스 관련 문의나 피드백은
        아래 이메일로 보내주시면 최대한 빠르게 답변드리겠습니다.
      </p>

      <h2>문의</h2>
      <p>
        <a href="mailto:contact@guildeline.com">contact@guildeline.com</a>
      </p>
      <p>
        개인정보 처리 방식은{' '}
        <Link href="/privacy">개인정보처리방침</Link>을,
        서비스 이용 조건은{' '}
        <Link href="/terms">이용약관</Link>을 참고해 주세요.
      </p>
    </main>
  )
}
