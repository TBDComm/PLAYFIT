# Async Parallel — Eliminating Waterfalls

**Impact: CRITICAL**
Source: [vercel-labs/agent-skills — React Best Practices v1.0.0](https://github.com/vercel-labs/agent-skills)

Waterfalls are the #1 performance killer. Each sequential `await` adds full network latency. Eliminating them yields the largest gains.

---

## 1.1 Defer Await Until Needed

**Impact: HIGH (avoids blocking unused code paths)**

Move `await` operations into the branches where they're actually used.

**Incorrect: blocks both branches**
```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)
  if (skipProcessing) {
    return { skipped: true } // waited for userData unnecessarily
  }
  return processUserData(userData)
}
```

**Correct: only blocks when needed**
```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    return { skipped: true } // returns immediately without waiting
  }
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

---

## 1.2 Dependency-Based Parallelization

**Impact: CRITICAL (2-10× improvement)**

For operations with partial dependencies, start each task at the earliest possible moment.

**Incorrect: profile waits for config unnecessarily**
```typescript
const [user, config] = await Promise.all([fetchUser(), fetchConfig()])
const profile = await fetchProfile(user.id)
```

**Correct: config and profile run in parallel**
```typescript
const userPromise = fetchUser()
const profilePromise = userPromise.then(user => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise,
])
```

Alternative with `better-all` (auto-maximizes parallelism based on declared dependencies):
```typescript
import { all } from 'better-all'

const { user, config, profile } = await all({
  async user() { return fetchUser() },
  async config() { return fetchConfig() },
  async profile() { return fetchProfile((await this.$.user).id) }
})
```

---

## 1.3 Prevent Waterfall Chains in API Routes

**Impact: CRITICAL (2-10× improvement)**

Start independent operations immediately, even before awaiting them.

**Incorrect: config waits for auth, data waits for both**
```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

**Correct: auth and config start immediately**
```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id),
  ])
  return Response.json({ data, config })
}
```

---

## 1.4 Promise.all() for Independent Operations

**Impact: CRITICAL (2-10× improvement)**

When async operations have no interdependencies, execute them concurrently.

**Incorrect: sequential — 3 round trips**
```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**Correct: parallel — 1 round trip**
```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments(),
])
```

---

## 1.5 Strategic Suspense Boundaries

**Impact: HIGH (faster initial paint)**

Use Suspense to show wrapper UI immediately while data loads in a child component.

**Incorrect: wrapper blocked by data fetching**
```tsx
async function Page() {
  const data = await fetchData() // blocks entire page
  return (
    <div>
      <div>Sidebar</div>
      <div>{data.content}</div>
      <div>Footer</div>
    </div>
  )
}
```

**Correct: layout renders immediately**
```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <Suspense fallback={<Skeleton />}>
        <DataDisplay />
      </Suspense>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // only blocks this component
  return <div>{data.content}</div>
}
```

**Sharing a promise across components (avoids duplicate fetches):**
```tsx
function Page() {
  const dataPromise = fetchData() // start immediately, don't await

  return (
    <Suspense fallback={<Skeleton />}>
      <DataDisplay dataPromise={dataPromise} />
      <DataSummary dataPromise={dataPromise} />
    </Suspense>
  )
}

function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise)
  return <div>{data.content}</div>
}
```

**When NOT to use Suspense deferral:**
- Critical data needed for layout decisions
- SEO-critical content above the fold
- Small, fast queries where overhead isn't worth it
- When avoiding layout shift is priority
