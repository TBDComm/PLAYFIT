'use client'

import dynamic from 'next/dynamic'
import styles from './page.module.css'

function SettingsSkeleton() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.skeleton} />
      </div>
    </main>
  )
}

// ssr:false prevents createBrowserClient from running server-side
const SettingsClient = dynamic(() => import('./SettingsClient'), {
  ssr: false,
  loading: () => <SettingsSkeleton />,
})

export default function SettingsWrapper() {
  return <SettingsClient />
}
