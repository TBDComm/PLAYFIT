import Link from 'next/link'
import type { Metadata } from 'next'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: '이용약관 — PlayFit',
  description: 'PlayFit 서비스 이용약관을 안내합니다.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLogo} aria-label="PlayFit 홈으로">
        <span className={styles.logoMark} aria-hidden="true">P</span>
        <span className={styles.logoName}>PlayFit</span>
      </Link>
      <h1>이용약관</h1>
      <p className={styles.updated}>최종 업데이트: 2026년 3월 18일</p>

      <h2>1. 서비스 소개</h2>
      <p>
        PlayFit(이하 &ldquo;서비스&rdquo;)은 Steam 플레이 기록과 예산을 바탕으로 AI가 게임을 추천해 주는
        서비스입니다. PlayFit은 Valve Corporation 및 Steam과 무관한 독립 서비스입니다.
      </p>

      <h2>2. 이용 조건</h2>
      <ul>
        <li>만 14세 이상만 이용할 수 있습니다</li>
        <li>Steam 계정을 연동하려면 Steam 프로필을 공개 상태로 설정해야 합니다</li>
        <li>타인의 계정이나 개인정보를 무단으로 사용하는 행위는 금지됩니다</li>
        <li>서비스를 자동화된 방식으로 대량 호출하거나 남용하는 행위는 금지됩니다</li>
        <li>서비스의 정상적인 운영을 방해하는 행위는 금지됩니다</li>
      </ul>

      <h2>3. 추천 결과의 한계</h2>
      <p>
        PlayFit의 게임 추천은 AI 모델을 통해 생성되며, 참고용 정보입니다.
        추천 결과의 정확성이나 적합성을 보증하지 않습니다.
        최종 구매 결정은 이용자 본인의 판단에 따라 이루어져야 합니다.
      </p>

      <h2>4. 지식재산권</h2>
      <p>
        서비스 내 게임 이름, 이미지, 설명 등의 권리는 각 게임 퍼블리셔·개발사에 귀속됩니다.
        PlayFit은 Steam Web API를 통해 공개된 정보를 표시할 뿐이며, 해당 콘텐츠에 대한 소유권을
        주장하지 않습니다.
      </p>

      <h2>5. 서비스 변경 및 중단</h2>
      <p>
        PlayFit은 사전 통지 없이 서비스의 일부 또는 전체를 변경하거나 중단할 수 있습니다.
        서비스 중단으로 인한 손해에 대해 PlayFit은 책임을 지지 않습니다.
      </p>

      <h2>6. 면책 조항</h2>
      <p>
        서비스는 현재 상태(&ldquo;as-is&rdquo;)로 제공됩니다. PlayFit은 서비스의 중단 없는 운영,
        오류 없는 제공, 특정 목적에 대한 적합성을 보증하지 않습니다.
        법률이 허용하는 최대 범위 내에서 일체의 명시적·묵시적 보증을 배제합니다.
      </p>

      <h2>7. 약관 변경</h2>
      <p>
        본 약관은 사전 공지 없이 변경될 수 있습니다. 변경 후에도 서비스를 계속 이용하면
        변경된 약관에 동의한 것으로 간주합니다.
      </p>

      <h2>8. 문의</h2>
      <p>
        약관 관련 문의는{' '}
        <a href="mailto:contact@playfit.gg">contact@playfit.gg</a>로 보내주세요.
      </p>
    </main>
  )
}
