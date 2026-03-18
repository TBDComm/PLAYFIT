import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import Header from './components/Header'
import Footer from './components/Footer'
import './globals.css'

// Space Grotesk: technical, characterful font (rules/frontend-design.md — Inter/Arial banned)
// font-display: swap applied (rules/web-design-guidelines.md)
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://playfit.pages.dev'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'PLAYFIT — 나한테 맞는 게임 추천',
  description: '스팀 플레이 기록과 예산을 기반으로 내 취향에 맞는 게임을 추천해 드립니다.',
  themeColor: '#09090b',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'PLAYFIT — 나한테 맞는 게임 추천',
    description: '스팀 플레이 기록과 예산을 기반으로 내 취향에 맞는 게임을 추천해 드립니다.',
    url: '/',
    siteName: 'PlayFit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLAYFIT — 나한테 맞는 게임 추천',
    description: '스팀 플레이 기록과 예산을 기반으로 내 취향에 맞는 게임을 추천해 드립니다.',
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
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
