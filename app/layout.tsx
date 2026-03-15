import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

// Space Grotesk: technical, characterful font (rules/frontend-design.md — Inter/Arial banned)
// font-display: swap applied (rules/web-design-guidelines.md)
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PLAYFIT — 나한테 맞는 게임 추천',
  description: '스팀 플레이 기록과 예산을 기반으로 내 취향에 맞는 게임을 추천해 드립니다.',
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // color-scheme: dark is declared in globals.css
    <html lang="ko" className={spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  )
}
