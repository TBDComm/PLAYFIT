import Link from 'next/link'
import type { Metadata } from 'next'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: '개인정보처리방침 — PlayFit',
  description: 'PlayFit 서비스의 개인정보 수집·이용·보관 정책을 안내합니다.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLogo} aria-label="PlayFit 홈으로">
        <span className={styles.logoMark} aria-hidden="true">P</span>
        <span className={styles.logoName}>PlayFit</span>
      </Link>
      <h1>개인정보처리방침</h1>
      <p className={styles.updated}>최종 업데이트: 2026년 3월 18일</p>

      <h2>1. 수집하는 개인정보</h2>
      <p>PlayFit은 서비스 제공을 위해 아래 정보를 수집합니다.</p>
      <ul>
        <li>이메일 주소 — 이메일·비밀번호 또는 Google 계정으로 가입 시</li>
        <li>Steam ID / 프로필 URL — Steam 계정 연동 또는 Steam 로그인 시</li>
        <li>Steam 플레이 기록 — 게임 추천 생성 시 Steam Web API를 통해 실시간으로 가져오며, 서버에 저장하지 않습니다</li>
        <li>게임 태그 가중치 — 추천 결과에 대한 피드백을 바탕으로 Supabase에 저장되는 취향 데이터</li>
      </ul>

      <h2>2. 쿠키 및 추적 기술</h2>
      <p>PlayFit은 다음 목적으로 쿠키와 유사 기술을 사용합니다.</p>
      <ul>
        <li>로그인 세션 유지 (Supabase 인증 쿠키)</li>
        <li>Google Analytics 4 — 페이지 조회 및 상호작용 측정 (익명 데이터)</li>
        <li>Google AdSense — 관심 기반 광고 게재 (향후 적용 예정)</li>
      </ul>
      <p>
        브라우저 설정에서 쿠키를 비활성화할 수 있으나, 일부 기능이 제한될 수 있습니다.
      </p>

      <h2>3. 제3자 서비스</h2>
      <ul>
        <li>Steam Web API (Valve Corporation) — 게임 정보 및 플레이 기록 조회</li>
        <li>Google OAuth — Google 계정 로그인</li>
        <li>Google Analytics 4 — 서비스 이용 통계</li>
        <li>Google AdSense — 광고 서비스 (향후 적용 예정)</li>
        <li>Supabase — 사용자 인증 및 데이터 저장 (EU 표준 계약 조항 준수)</li>
        <li>Anthropic Claude API — AI 게임 추천 생성 (입력 데이터는 모델 학습에 사용되지 않습니다)</li>
      </ul>

      <h2>4. 개인정보 보관 및 삭제</h2>
      <p>
        계정 삭제를 요청하시면 저장된 이메일, Steam ID, 태그 가중치 데이터를 삭제합니다.
        삭제 요청은 아래 이메일로 보내주세요.
      </p>

      <h2>5. 미성년자</h2>
      <p>
        PlayFit은 만 14세 미만 아동으로부터 의도적으로 개인정보를 수집하지 않습니다.
        미성년자의 정보가 수집되었음을 인지한 경우 즉시 삭제합니다.
      </p>

      <h2>6. 문의</h2>
      <p>
        개인정보 관련 문의는{' '}
        <a href="mailto:contact@playfit.gg">contact@playfit.gg</a>로 보내주세요.
      </p>
    </main>
  )
}
