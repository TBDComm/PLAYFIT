// scripts/build-games-db.ts
// Populates games_cache from Steam full app list + SteamSpy tags
//
// Run:    npx tsx --env-file=.env.local scripts/build-games-db.ts
// Resume: safe to re-run — skips entries updated within 30 days

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const STEAM_API_KEY = process.env.STEAM_API_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STEAM_API_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, STEAM_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const DELAY_MS = 200
const SKIP_IF_UPDATED_WITHIN_DAYS = 30
const LOG_EVERY = 100

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
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

// Fetch full Steam app list
async function fetchAllAppIds(): Promise<Array<{ appid: number; name: string }>> {
  const res = await fetch(`https://api.steampowered.com/ISteamApps/GetAppList/v2/?key=${STEAM_API_KEY}`)
  if (!res.ok) throw new Error(`GetAppList HTTP ${res.status}`)
  const data = await res.json()
  return data.applist?.apps ?? []
}

// Fetch Steam genres for one app
async function fetchSteamGenres(appid: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&filters=genres`
    )
    if (!res.ok) return []
    const data = await res.json()
    const entry = data[appid.toString()]
    if (!entry?.success) return []
    return (entry.data?.genres ?? []).map((g: { description: string }) => g.description)
  } catch {
    return []
  }
}

// Fetch SteamSpy tags for one app
async function fetchSteamSpyTags(appid: number): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`)
    if (!res.ok) return null
    const data = await res.json()
    // SteamSpy returns { name: "error" } or no tags when app not found
    if (!data.tags || data.name === 'error') return null
    return data.tags as Record<string, number>
  } catch {
    return null
  }
}

async function main() {
  console.log('Loading existing DB entries...')
  const existing = await loadExistingEntries()
  console.log(`Found ${existing.size} entries already in DB`)

  console.log('Fetching full Steam app list...')
  const allApps = await fetchAllAppIds()
  console.log(`Total apps from Steam: ${allApps.length}`)

  const cutoff = new Date(Date.now() - SKIP_IF_UPDATED_WITHIN_DAYS * 24 * 60 * 60 * 1000)

  let processed = 0
  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const app of allApps) {
    const appidStr = app.appid.toString()

    // Skip if updated recently
    const lastUpdated = existing.get(appidStr)
    if (lastUpdated && lastUpdated > cutoff) {
      skipped++
      processed++
      continue
    }

    // Fetch Steam genres and SteamSpy tags in parallel
    const [genres, tags] = await Promise.all([
      fetchSteamGenres(app.appid),
      fetchSteamSpyTags(app.appid),
    ])

    // Skip if SteamSpy has no data (likely not a real game)
    if (!tags) {
      failed++
    } else {
      const { error } = await supabase.from('games_cache').upsert({
        appid: appidStr,
        name: app.name,
        genres,
        tags,
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

    if (processed % LOG_EVERY === 0) {
      console.log(
        `  ${processed}/${allApps.length} — inserted: ${inserted} skipped: ${skipped} failed: ${failed}`
      )
    }

    await sleep(DELAY_MS)
  }

  console.log(`\nDone. processed=${processed} inserted=${inserted} skipped=${skipped} failed=${failed}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
