'use client'

import { useEffect } from 'react'

interface AdUnitProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  responsive?: boolean
  className?: string
  // Fixed height for CLS prevention — match expected ad size
  minHeight?: number
}

const adClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

export default function AdUnit({ slot, format = 'auto', responsive = true, className, minHeight = 90 }: AdUnitProps) {
  useEffect(() => {
    if (!adClientId) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle.push({})
    } catch {
      // adsbygoogle not loaded yet — safe to ignore
    }
  }, [])

  if (!adClientId) return null

  return (
    <div className={className} style={{ minHeight: `${minHeight}px` }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}
