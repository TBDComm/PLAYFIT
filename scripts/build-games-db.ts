// scripts/build-games-db.ts
// Populates games_cache from SteamSpy paginated API (1000 games/page, includes tags)
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

const DELAY_MS = 1000 // SteamSpy rate limit: 1 req/sec
const SKIP_IF_UPDATED_WITHIN_DAYS = 30
const LOG_EVERY = 10 // log every 10 pages = every ~10,000 games

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface SteamSpyEntry {
  appid: number
  name: string
  genre: string // comma-separated genres
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

    for (const row of data) {
      map.set(row.appid, new Date(row.updated_at))
    }
    if (data.length < pageSize) break
    offset += pageSize
  }

  return map
}

// Fetch one page from SteamSpy (1000 games per page)
async function fetchSteamSpyPage(page: number): Promise<SteamSpyEntry[]> {
  const res = await fetch(`https://steamspy.com/api.php?request=all&page=${page}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlayFit/1.0)' },
  })
  if (!res.ok) {
    console.error(`  SteamSpy page ${page} HTTP ${res.status}`)
    return []
  }
  const data = await res.json() as Record<string, SteamSpyEntry>
  return Object.values(data)
}

async function main() {
  console.log('Loading existing DB entries...')
  const existing = await loadExistingEntries()
  console.log(`Found ${existing.size} entries already in DB`)

  const cutoff = new Date(Date.now() - SKIP_IF_UPDATED_WITHIN_DAYS * 24 * 60 * 60 * 1000)

  let page = 0
  let totalProcessed = 0
  let totalInserted = 0
  let totalSkipped = 0
  let totalFailed = 0

  while (true) {
    const entries = await fetchSteamSpyPage(page)

    // Empty page = no more data
    if (entries.length === 0) {
      console.log(`\nNo more pages at page ${page}. Done fetching.`)
      break
    }

    for (const entry of entries) {
      const appidStr = entry.appid.toString()

      // Skip if updated recently
      const lastUpdated = existing.get(appidStr)
      if (lastUpdated && lastUpdated > cutoff) {
        totalSkipped++
        totalProcessed++
        continue
      }

      // Skip if no tags (not a real game)
      if (!entry.tags || Object.keys(entry.tags).length === 0) {
        totalFailed++
        totalProcessed++
        continue
      }

      // genres: SteamSpy returns comma-separated string
      const genres = entry.genre
        ? entry.genre.split(',').map(g => g.trim()).filter(Boolean)
        : []

      const { error } = await supabase.from('games_cache').upsert({
        appid: appidStr,
        name: entry.name,
        genres,
        tags: entry.tags,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error(`  [error] appid=${entry.appid} "${entry.name}": ${error.message}`)
        totalFailed++
      } else {
        totalInserted++
      }

      totalProcessed++
    }

    if (page % LOG_EVERY === 0) {
      console.log(
        `  Page ${page} done — processed: ${totalProcessed} inserted: ${totalInserted} skipped: ${totalSkipped} failed: ${totalFailed}`
      )
    }

    page++
    await sleep(DELAY_MS)
  }

  console.log(`\nDone. pages=${page} processed=${totalProcessed} inserted=${totalInserted} skipped=${totalSkipped} failed=${totalFailed}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
