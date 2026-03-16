# Bundle Size Optimization

**Impact: CRITICAL (200-800ms import cost, slow builds)**
Source: [vercel-labs/agent-skills — React Best Practices v1.0.0](https://github.com/vercel-labs/agent-skills)

Import directly from source files instead of barrel files to avoid loading thousands of unused modules.

**Barrel files** are entry points that re-export multiple modules (e.g., `index.js` that does `export * from './module'`).

Popular icon and component libraries can have **up to 10,000 re-exports** in their entry file. For many React packages, **it takes 200-800ms just to import them**, affecting both development speed and production cold starts.

**Why tree-shaking doesn't help:** When a library is marked as external (not bundled), the bundler can't optimize it.

---

## Rule

**Incorrect: imports entire library**
```tsx
import { Check, X, Menu } from 'lucide-react'
// Loads 1,583 modules, takes ~2.8s extra in dev
// Runtime cost: 200-800ms on every cold start

import { Button, TextField } from '@mui/material'
// Loads 2,225 modules, takes ~4.2s extra in dev
```

**Correct: imports only what you need**
```tsx
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
// Loads only 3 modules (~2KB vs ~1MB)

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
// Loads only what you use
```

---

## Next.js Alternative (13.5+)

Use `optimizePackageImports` to keep ergonomic barrel imports while auto-transforming at build time:

```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mui/material'],
  },
}

// Then you can write:
import { Check, X, Menu } from 'lucide-react'
// Automatically transformed to direct imports at build time
```

---

## Performance Impact

| Metric | Improvement |
|--------|-------------|
| Dev boot | 15-70% faster |
| Build time | 28% faster |
| Cold starts | 40% faster |
| HMR | Significantly faster |

---

## Commonly Affected Libraries

`lucide-react`, `@mui/material`, `@mui/icons-material`, `@tabler/icons-react`, `react-icons`, `@headlessui/react`, `@radix-ui/react-*`, `lodash`, `ramda`, `date-fns`, `rxjs`, `react-use`

---

Reference: [How we optimized package imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

---

## 2.2 Conditional Module Loading

**Impact: HIGH (loads large data only when needed)**

Load large modules or data only when a feature is activated. The `typeof window !== 'undefined'` check prevents bundling for SSR.

```tsx
useEffect(() => {
  if (enabled && !data && typeof window !== 'undefined') {
    import('./heavy-module.js')
      .then(mod => setData(mod.data))
      .catch(() => setEnabled(false))
  }
}, [enabled, data, setEnabled])
```

---

## 2.3 Defer Non-Critical Third-Party Libraries

**Impact: MEDIUM (analytics/logging load after hydration)**

Analytics, logging, and error tracking don't block user interaction. Load after hydration with `{ ssr: false }`.

```tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => m.Analytics),
  { ssr: false }
)
```

---

## 2.4 Dynamic Imports for Heavy Components

**Impact: CRITICAL (directly affects TTI and LCP)**

Lazy-load large components not needed on initial render.

**Incorrect: bundles with main chunk**
```tsx
import { MonacoEditor } from './monaco-editor'
```

**Correct: loads on demand**
```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)
```

---

## 2.5 Preload Based on User Intent

**Impact: MEDIUM (reduces perceived latency)**

Trigger preload on hover/focus before user clicks.

```tsx
function EditorButton({ onClick }: { onClick: () => void }) {
  const preload = () => {
    if (typeof window !== 'undefined') void import('./monaco-editor')
  }
  return (
    <button onMouseEnter={preload} onFocus={preload} onClick={onClick}>
      Open Editor
    </button>
  )
}
```
