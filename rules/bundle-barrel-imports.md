# Bundle Size — Avoid Barrel File Imports

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
