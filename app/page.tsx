import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import JsonLd from './components/JsonLd'
import TagScatter from './components/TagScatter'
import RecommendationForm from './components/RecommendationForm'
import SavedGames from './components/SavedGames'
import Preview from './components/Preview'
import styles from './page.module.css'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${BASE_URL}/#website`, url: BASE_URL, name: 'Guildeline' },
    {
      '@type': 'WebApplication', '@id': `${BASE_URL}/#app`,
      name: 'Guildeline', description: '스팀 플레이 기록과 예산을 기반으로 내 취향에 맞는 게임을 추천해 드립니다.',
      url: BASE_URL, applicationCategory: 'GameApplication', operatingSystem: 'Web',
    },
    { '@type': 'Organization', '@id': `${BASE_URL}/#org`, name: 'Guildeline', url: BASE_URL },
  ],
}

// A static component for the hero statistics
function HeroStats() {
  return (
    <p className={styles.heroStat}>
      <span suppressHydrationWarning>{new Intl.NumberFormat('ko-KR').format(82816)}</span>개 Steam 게임 중에서 골라드립니다
    </p>
  )
}

export default async function Home() {
  return (
    <main id="main-content" className={styles.page}>
      <JsonLd data={homeJsonLd} />
      <div className={styles.pageNav}>
        <Link href="/genre" className={styles.pageNavLink}>장르별 탐색</Link>
        <Link href="/blog" className={styles.pageNavLink}>블로그</Link>
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.tagScatterWrap}><TagScatter /></div>
        <div className={styles.heroInner}>
          <header className={styles.header}>
            <h1 className={styles.logo}>
              <span className={styles.logoAccent}>GUILD</span>ELINE
              <span className={styles.srOnly}> — 스팀 취향 게임 추천</span>
            </h1>
            <h2 className={styles.headline}>내 플레이 기록이 곧 취향이다</h2>
            <HeroStats />
            <a href="#recommend-form" className={styles.heroCta}>지금 시작하기 <span className={styles.ctaArrow} aria-hidden="true">↓</span></a>
          </header>
        </div>
      </section>

      {/* Recommendation Form (Client Component) */}
      <Suspense fallback={<div className={styles.formSkeleton} />}>
        <RecommendationForm />
      </Suspense>

      {/* Sample Card (Static) */}
      <section className={styles.sampleSection}>
        <div className={styles.inner}>
          <p className={styles.previewLabel}>추천 예시</p>
          <div className={styles.sampleCard}>
            <Image
              unoptimized
              src="https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg"
              alt="Hades 게임 썸네일" width={460} height={215} className={styles.sampleThumb}
            />
            <div className={styles.sampleBody}>
              <p className={styles.sampleName}>Hades</p>
              <p className={styles.sampleReason}>
                <span className={styles.sampleReasonLabel}>추천 설명</span><br />
                로그라이크와 액션을 즐기는 취향에 딱 맞아요. 매 플레이마다 새로운 전략이 펼쳐지고, 깊이 있는 스토리까지 즐길 수 있어요.
              </p>
              <div className={styles.sampleMeta}>
                <span className={styles.samplePrice}>₩22,500</span>
                <span className={styles.sampleScore}>
                  <span className={styles.scoreLabelFull}>Metacritic Score</span>
                  <span className={styles.scoreLabelShort}>MC</span>
                  &nbsp;93
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section (Static Component) */}
      <Preview />

      {/* Squad Feature Section */}
      <section className={styles.squadFeature}>
        <div className={styles.squadFeatureInner}>
          <p className={styles.squadFeatureEyebrow}>SQUAD ANALYZER</p>
          <h2 className={styles.squadFeatureTitle}>
            친구들과 함께 즐길 게임<br />
            <span className={styles.squadFeatureAccent}>취향 교집합</span>으로 찾아드립니다
          </h2>
          <ul className={styles.squadFeaturePills} aria-label="주요 기능">
            <li>최대 4명</li>
            <li>공통 취향 분석</li>
            <li>Steam 연동 가능</li>
          </ul>
          <Link href="/squad" className={styles.squadFeatureBtn}>
            스쿼드 분석 시작하기 →
          </Link>
        </div>
      </section>

      {/* Saved Games (Client Component) */}
      <Suspense fallback={<div className={styles.savedGamesSkeleton} />}>
        <SavedGames />
      </Suspense>

    </main>
  )
}
