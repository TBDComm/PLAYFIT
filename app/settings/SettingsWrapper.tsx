'use client'

import dynamic from 'next/dynamic'

// ssr:false prevents createBrowserClient from running server-side
const SettingsClient = dynamic(() => import('./SettingsClient'), { ssr: false })

export default function SettingsWrapper() {
  return <SettingsClient />
}
