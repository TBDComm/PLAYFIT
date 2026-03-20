// scripts/build-games-db.ts
// Phase 1: Collect appids from SteamSpy pages
// Phase 2: Fetch individual appdetails (with tags) per game
//
// Run:    npx tsx --env-file=.env.local scripts/build-games-db.ts
// Resume: safe to re-run — skips entries updated within 30 days

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const DELAY_MS = 300 // SteamSpy rate limit
const SKIP_IF_UPDATED_WITHIN_DAYS = 30

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface SteamSpyListEntry {
  appid: number
  name: string
}

interface SteamSpyDetail {
  appid: number
  name: string
  genre: string
  tags: Record<string, number>
}

// Load all appids already in DB with their updated_at timestamps
async function loadExistingEntries(): Promise<Map<string, Date>> {
  const map = new Map<string, Date>()
  let offset = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('games_cache')
      .select('appid, updated_at')
      .range(offset, offset + pageSize - 1)

    if (error) throw new Error(`Failed to load existing entries: ${error.message}`)
    if (!data || data.length === 0) break
    for (const row of data) map.set(row.appid, new Date(row.updated_at))
    if (data.length < pageSize) break
    offset += pageSize
  }

  return map
}

// Phase 1: Collect all appids from SteamSpy pages (with retry on failure)
async function collectAllAppIds(): Promise<SteamSpyListEntry[]> {
  const all: SteamSpyListEntry[] = []
  let page = 0
  const MAX_RETRIES = 3

  while (true) {
    let entries: SteamSpyListEntry[] = []
    let success = false

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`https://steamspy.com/api.php?request=all&page=${page}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Guildeline/1.0)' },
        })
        if (!res.ok) {
          console.error(`  Page ${page} HTTP ${res.status} (attempt ${attempt}) — retrying...`)
          await sleep(DELAY_MS * attempt * 3)
          continue
        }
        const data = await res.json() as Record<string, SteamSpyListEntry>
        entries = Object.values(data)
        success = true
        break
      } catch (e) {
        console.error(`  Page ${page} parse error (attempt ${attempt}): ${e} — retrying...`)
        await sleep(DELAY_MS * attempt * 3)
      }
    }

    if (!success) {
      console.error(`  Page ${page} failed after ${MAX_RETRIES} attempts — stopping`)
      break
    }
    if (entries.length === 0) break

    all.push(...entries)
    console.log(`  Collected page ${page} (${all.length} total)`)
    page++
    await sleep(DELAY_MS)
  }

  return all
}

// Phase 2: Fetch individual SteamSpy appdetails (includes tags)
async function fetchAppDetail(appid: number): Promise<SteamSpyDetail | null> {
  try {
    const res = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Guildeline/1.0)' },
    })
    if (!res.ok) return null
    const data = await res.json() as SteamSpyDetail
    if (!data.name || data.name === 'error') return null
    return data
  } catch {
    return null
  }
}

async function main() {
  console.log('Loading existing DB entries...')
  const existing = await loadExistingEntries()
  console.log(`Found ${existing.size} entries already in DB`)

  console.log('\nPhase 1: Collecting app list from SteamSpy...')
  const allApps = await collectAllAppIds()
  console.log(`Total apps collected: ${allApps.length}\n`)

  const cutoff = new Date(Date.now() - SKIP_IF_UPDATED_WITHIN_DAYS * 24 * 60 * 60 * 1000)

  let processed = 0
  let inserted = 0
  let skipped = 0
  let failed = 0

  console.log('Phase 2: Fetching tags for each game...')

  for (const app of allApps) {
    const appidStr = app.appid.toString()

    // Skip if updated recently
    const lastUpdated = existing.get(appidStr)
    if (lastUpdated && lastUpdated > cutoff) {
      skipped++
      processed++
      if (processed % 1000 === 0) {
        console.log(`  ${processed}/${allApps.length} — inserted: ${inserted} skipped: ${skipped} failed: ${failed}`)
      }
      continue
    }

    const detail = await fetchAppDetail(app.appid)
    await sleep(DELAY_MS)

    if (!detail || !detail.tags || Object.keys(detail.tags).length === 0) {
      failed++
    } else {
      const genres = detail.genre
        ? detail.genre.split(',').map(g => g.trim()).filter(Boolean)
        : []

      const { error } = await supabase.from('games_cache').upsert({
        appid: appidStr,
        name: app.name,
        genres,
        tags: detail.tags,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error(`  [error] appid=${app.appid} "${app.name}": ${error.message}`)
        failed++
      } else {
        inserted++
      }
    }

    processed++

    if (processed % 1000 === 0) {
      console.log(`  ${processed}/${allApps.length} — inserted: ${inserted} skipped: ${skipped} failed: ${failed}`)
    }
  }

  console.log(`\nDone. processed=${processed} inserted=${inserted} skipped=${skipped} failed=${failed}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
