# Rose, Bud, Thorn

A daily check-in app: share a rose (highlight), bud (something hopeful), and thorn (a struggle) with a friend.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the env template and fill in your Supabase keys (found in Supabase → Project Settings → API):
   ```bash
   cp .env.example .env
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

## What's here

- `src/App.jsx` — the whole app UI (home screen, the rose/bud/thorn writing flow, inbox)
- `src/lib/supabase.js` — Supabase client + auth helper functions (email + Google sign-in)
- `.env.example` — the two environment variables you need to set locally (never commit the real `.env`)

## Not yet wired up

This is the UI prototype connected to a Supabase client, but the actual database calls (saving cards, creating groups, fetching connections) still need to be wired into the component state in `App.jsx`. See the project's chat history for the full schema and RLS policies already set up in Supabase.
