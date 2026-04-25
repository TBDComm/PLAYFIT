import type { Metadata, Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import Header from './components/Header'
import NavLogo from './components/NavLogo'
import Footer from './components/Footer'
import { AuthProvider } from './context/AuthContext'
import './globals.css'

// Space Grotesk: technical, characterful font (rules/frontend-design.md — Inter/Arial banned)
// font-display: swap applied (rules/web-design-guidelines.md)
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

export const viewport: Viewport = {
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: '내 스팀 취향에 맞는 게임 추천 | Guildeline',
  description: '82,816개 Steam 게임을 분석해 내 플레이 기록과 예산에 맞는 게임을 추천합니다. 태그 기반 취향 분석으로 다음 플레이할 게임을 지금 찾아보세요.',
  icons: {
    icon: '/guildeline-logo.png',
    apple: '/guildeline-logo.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '내 스팀 취향에 맞는 게임 추천 | Guildeline',
    description: '82,816개 Steam 게임을 분석해 내 플레이 기록과 예산에 맞는 게임을 추천합니다. 태그 기반 취향 분석으로 다음 플레이할 게임을 지금 찾아보세요.',
    url: '/',
    siteName: 'Guildeline',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Guildeline — 스팀 취향 게임 추천' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '내 스팀 취향에 맞는 게임 추천 | Guildeline',
    description: '82,816개 Steam 게임을 분석해 내 플레이 기록과 예산에 맞는 게임을 추천합니다. 태그 기반 취향 분석으로 다음 플레이할 게임을 지금 찾아보세요.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // color-scheme: dark is declared in globals.css
    <html lang="ko" className={spaceGrotesk.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.akamai.steamstatic.com" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">본문으로 바로가기</a>
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
        {adClientId && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaMeasurementId}');`}
            </Script>
          </>
        )}
        <AuthProvider>
          <Header />
          <NavLogo />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
