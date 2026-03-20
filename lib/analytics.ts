declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  const fire = () => window.gtag('event', eventName, params)
  // Defer to idle time so analytics never blocks user interaction (INP)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(fire)
  } else {
    // Safari fallback
    setTimeout(fire, 0)
  }
}
