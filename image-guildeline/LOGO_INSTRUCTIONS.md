# Guildeline Logo — Claude Code Instructions

## Files
- `Logo.tsx` → `components/Logo.tsx`
- `favicon.tsx` → `app/icon.tsx`
- `apple-icon.tsx` → `app/apple-icon.tsx`

## Install font
```bash
# Space Grotesk is already in next/font/google — no install needed
```

## Usage

```tsx
// Header, Navbar 등에서
import { Logo } from '@/components/Logo'

<Logo size="md" />              // 기본 (아이콘 + 워드마크)
<Logo size="sm" />              // 작은 버전
<Logo size="lg" />              // 큰 버전
<Logo iconOnly />               // 아이콘만 (모바일 헤더 등)
<Logo lightBg />                // 흰 배경용 (다크 색상 반전)
```

## Design spec
- Font: Space Grotesk 700 (next/font/google)
- GUILD: #C5F135 (lime)
- ELINE: #F5F5F0 (white) or #0A0A0A (light bg)
- Icon: Hexagon (flat-top) + double chevron centered
- Chevron 1: full opacity | Chevron 2: 38% opacity
- Background: transparent (hex fill: #0A0A0A)
- Accent: #C5F135 (Lime)

## next/font setup (if not already in layout.tsx)
```tsx
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export default function RootLayout({ children }) {
  return (
    <html className={spaceGrotesk.variable}>
      ...
    </html>
  )
}
```

## favicon & apple-icon
Next.js App Router automatically picks up:
- `app/icon.tsx` → `/favicon.ico` + `/icon.png`
- `app/apple-icon.tsx` → `/apple-touch-icon.png`

No manual `<link>` tags needed.
