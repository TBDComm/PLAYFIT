# Server-Side Performance

**Impact: HIGH**
Source: [vercel-labs/agent-skills — React Best Practices v1.0.0](https://github.com/vercel-labs/agent-skills)
Deep-dive: `.claude/skills/vercel-react-best-practices/rules/server-*.md` (10 rules total)

Server-side patterns for RSC, edge routes, and API handlers. Complements `async-parallel.md` (which covers general waterfall elimination).

---

## S.1 React.cache() for Per-Request Deduplication

**Impact: MEDIUM (deduplicates within a single request)**

Use `cache()` to avoid duplicate DB/auth queries when `generateMetadata` + page component call the same function.

```tsx
import { cache } from 'react'

export const loadProfile = cache(async (userId: string) => {
  return await db.query('SELECT * FROM profiles WHERE id = $1', [userId])
})
```

**Caveat:** `cache()` uses `Object.is` — pass primitives, not inline objects. `cache(fn)({id: 1})` always misses; `cache(fn)(1)` hits.

Already used in this project: `app/users/[userId]/page.tsx`.

---

## S.2 Hoist Static I/O to Module Level

**Impact: HIGH (avoids repeated file/network I/O per request)**

Static assets (fonts, logos, configs) should be loaded once at module init, not on every request.

**Incorrect: reads font on every request**
```tsx
export async function GET() {
  const fontData = await fetch(new URL('./Inter.ttf', import.meta.url))
    .then(res => res.arrayBuffer())  // runs EVERY time
  return new ImageResponse(/* ... */)
}
```

**Correct: loads once at module init**
```tsx
const fontData = fetch(new URL('./Inter.ttf', import.meta.url))
  .then(res => res.arrayBuffer())  // runs ONCE

export async function GET() {
  const font = await fontData
  return new ImageResponse(/* ... */)
}
```

Applies to: OG image fonts/logos, config files, email templates, any static asset.
Does NOT apply to: per-user data, runtime-changing files, large files that consume too much memory.

---

## S.3 Parallel Fetching via Component Composition

**Impact: CRITICAL (eliminates RSC waterfalls)**

RSC components execute sequentially within a tree. Make sibling components fetch independently.

**Incorrect: Sidebar waits for Header's fetch**
```tsx
export default async function Page() {
  const header = await fetchHeader()  // blocks everything below
  return <div><div>{header}</div><Sidebar /></div>
}
```

**Correct: both fetch simultaneously**
```tsx
async function Header() { const data = await fetchHeader(); return <div>{data}</div> }
async function Sidebar() { const items = await fetchSidebarItems(); return <nav>...</nav> }

export default function Page() {
  return <div><Header /><Sidebar /></div>  // parallel execution
}
```

---

## S.4 Minimize Serialization at RSC Boundaries

**Impact: HIGH (reduces data transfer size)**

Only pass fields the client actually uses across the Server/Client boundary.

**Incorrect: serializes all 50 fields**
```tsx
async function Page() {
  const user = await fetchUser()  // 50 fields
  return <Profile user={user} />  // client component uses 1 field
}
```

**Correct: serializes only what's needed**
```tsx
async function Page() {
  const user = await fetchUser()
  return <Profile name={user.name} />
}
```
