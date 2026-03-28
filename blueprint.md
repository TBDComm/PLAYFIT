# Guildeline Performance Improvement Blueprint

## 1. Overview

This document outlines a plan to diagnose and resolve performance bottlenecks in the Guildeline application. The primary user complaint is excessive loading times across the site. The root cause appears to be slow data fetching from external APIs (Steam) and on-demand, compute-intensive recommendation logic, without adequate caching or modern data loading strategies.

Our goal is to transform the user experience from slow and frustrating to fast and responsive by implementing caching, streaming, and architectural optimizations.

## 2. Current Architecture Analysis

- **Framework:** Next.js with App Router
- **Backend:** Next.js API Routes, Supabase (for user data/sessions), external Steam API, external Claude API.
- **Core Feature:** Steam game recommendation based on user library analysis.
- **Primary Bottleneck:** The recommendation generation process (`/api/recommend`) is slow. It involves fetching large amounts of data from the Steam API and performing real-time analysis for every request. Other pages also suffer from unoptimized data fetching.

## 3. Improvement Plan

### Step 1: Analyze Core Logic and Dependencies
- **Action:** Read `package.json` to identify key libraries.
- **Action:** Analyze the main recommendation API route (`app/api/recommend/route.ts`) to understand the data flow and business logic.
- **Action:** Analyze related library files (`lib/steam.ts`, `lib/claude.ts`) to pinpoint slow external API interactions.

### Step 2: Implement Caching & Streaming (Immediate Wins)
- **Caching API Responses:**
    - **Target:** All external API calls, especially to the Steam API.
    - **Method:** Wrap data fetching functions in `lib/` with React's `cache()` function. This will memoize requests on the server within a request-response lifecycle, preventing redundant API calls for the same data. For more persistent caching, a time-based revalidation strategy will be used.
- **Streaming UI with Suspense:**
    - **Target:** Pages that wait for slow data, like the main page (`app/page.tsx`) and the results page (`app/result/page.tsx`).
    - **Method:** Wrap the data-dependent components in `<Suspense>` with a loading fallback component (e.g., a skeleton loader). This will allow the server to stream the initial UI instantly while the slower data loads in the background, dramatically improving perceived performance.
- **Converting `page.tsx`:**
    - **Target:** The main `page.tsx`.
    - **Method:** Convert the main component to an `async` component to enable server-side data fetching and Suspense.

### Step 3: Architectural Enhancements (Long-Term Stability)
- **Static Site Generation (SSG) for Content:**
    - **Target:** Blog posts (`app/blog/[slug]/page.tsx`) and other static content pages.
    - **Method:** Ensure these pages are rendered at build time using SSG. They are currently dynamic, which is unnecessary. This will make them load instantly from a CDN.
- **Moving API Logic to the Edge:**
    - **Target:** The recommendation API (`app/api/recommend/route.ts`).
    - **Method:** Add `export const runtime = 'edge'` to the route file. This moves the serverless function to the Edge, which has lower latency for users globally. This requires ensuring all dependent libraries (like database clients) are edge-compatible.
- **Background Data Sync (Advanced):**
    - **Target:** User Steam library data.
    - **Method:** Instead of fetching the entire library on each recommendation, fetch it once when the user links their account and store it in Supabase. Use a background job (e.g., a cron job via GitHub Actions or Vercel Cron Jobs) to periodically sync the library, so the data is always fresh and ready for fast lookups.

This plan will be executed step-by-step to monitor improvements and ensure stability.
