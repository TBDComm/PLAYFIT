# Re-render Optimization

**Impact: MEDIUM**
Source: [vercel-labs/agent-skills — React Best Practices v1.0.0](https://github.com/vercel-labs/agent-skills)

Reducing unnecessary re-renders minimizes wasted computation and improves UI responsiveness.

---

## 5.1 Derive State During Rendering

**Impact: MEDIUM (avoids redundant renders and state drift)**

If a value can be computed from current props/state, do NOT store it in state or sync it with an effect. Derive it inline during render.

**Incorrect: state + effect**
```tsx
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(firstName + ' ' + lastName)
}, [firstName, lastName])
```

**Correct: derive during render**
```tsx
const fullName = firstName + ' ' + lastName
```

---

## 5.4 Don't Define Components Inside Components

**Impact: HIGH (prevents remount on every render)**

Defining a component inside another creates a new component type on every render. React sees a different type each time and fully remounts it — destroying state, re-running effects, recreating DOM nodes.

**Incorrect: remounts on every parent render**
```tsx
function UserProfile({ user, theme }) {
  const Avatar = () => <img src={user.avatarUrl} className={theme} /> // BAD
  return <Avatar />
}
```

**Correct: define outside, pass props**
```tsx
function Avatar({ src, theme }: { src: string; theme: string }) {
  return <img src={src} className={theme} />
}

function UserProfile({ user, theme }) {
  return <Avatar src={user.avatarUrl} theme={theme} />
}
```

Symptoms of this bug: inputs lose focus on keystroke, animations restart, effects re-run unexpectedly.

---

## 5.7 Narrow Effect Dependencies

**Impact: LOW (minimizes effect re-runs)**

Use primitive fields instead of whole objects as effect dependencies.

**Incorrect: re-runs on any user field change**
```tsx
useEffect(() => { console.log(user.id) }, [user])
```

**Correct: re-runs only when id changes**
```tsx
useEffect(() => { console.log(user.id) }, [user.id])
```

For derived booleans, compute outside the dependency array:
```tsx
const isMobile = width < 768
useEffect(() => { if (isMobile) enableMobileMode() }, [isMobile])
```

---

## 5.8 Put Interaction Logic in Event Handlers

**Impact: MEDIUM (avoids duplicate side effects)**

If a side effect is triggered by a specific user action, run it in the event handler — not as state + effect. State+effect patterns re-run on unrelated changes and can duplicate the action.

**Incorrect: submitted state + effect**
```tsx
useEffect(() => {
  if (submitted) post('/api/register')
}, [submitted, theme]) // re-runs if theme changes!
```

**Correct: directly in handler**
```tsx
function handleSubmit() {
  post('/api/register')
}
```

---

## 5.10 Use Functional setState Updates

**Impact: MEDIUM (prevents stale closures)**

When updating state based on current value, use the functional form to avoid stale closures and enable stable callback references.

**Incorrect: stale closure risk**
```tsx
const addItem = useCallback((item: Item) => {
  setItems([...items, item]) // items may be stale
}, [items]) // recreated on every items change
```

**Correct: always latest state, stable reference**
```tsx
const addItem = useCallback((item: Item) => {
  setItems(curr => [...curr, item])
}, []) // no dependency needed
```

---

## 5.11 Use Lazy State Initialization

**Impact: MEDIUM (expensive initializer runs only once)**

Pass a function to `useState` for expensive initial values — without it, the initializer runs on every render.

**Incorrect: runs every render**
```tsx
const [index, setIndex] = useState(buildSearchIndex(items))
```

**Correct: runs only on mount**
```tsx
const [index, setIndex] = useState(() => buildSearchIndex(items))
```

---

## 5.13 Use useRef for Transient Values

**Impact: MEDIUM (avoids re-renders for frequent non-UI updates)**

Store values that change frequently but don't need to trigger re-renders (mouse position, timers, flags) in `useRef`. Updating a ref does NOT trigger a re-render.

**Incorrect: re-renders on every mouse move**
```tsx
const [lastX, setLastX] = useState(0)
useEffect(() => {
  window.addEventListener('mousemove', e => setLastX(e.clientX))
}, [])
```

**Correct: no re-render, direct DOM update**
```tsx
const lastXRef = useRef(0)
const dotRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  window.addEventListener('mousemove', e => {
    lastXRef.current = e.clientX
    if (dotRef.current) dotRef.current.style.transform = `translateX(${e.clientX}px)`
  })
}, [])
```
