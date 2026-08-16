# Aim Trainer

A browser-based 3D FPS aim trainer built with Vite and Three.js. Every attempt
is timed, its mouse trajectory is buffered in memory, and the result is written
to a Supabase table.

## Requirements

- Node.js 18+ and npm
- A Chromium-based browser (Chrome or Edge) on Windows

## Install

```powershell
npm install
```

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run the contents of `schema.sql`. It creates the
   `telemetry_logs` table and the anon insert policy.
3. Copy `.env.example` to `.env.local` and fill in your project URL and anon key:

```powershell
Copy-Item .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your-key
```

The URL is under **Project Settings → Data API**, the key under **Project Settings
→ API Keys**. Use the bare origin — `https://<project-ref>.supabase.co`, with no
`/rest/v1` path and no trailing slash; the client appends the path itself. Use the publishable key (`sb_publishable_...`), or the legacy anon
key on older projects — both resolve to the `anon` role that `schema.sql` grants
insert to. Never use the secret or `service_role` key: `VITE_` variables are
inlined into the JS bundle and would be readable by anyone.

`.env.local` is gitignored. Without it the trainer still runs — it logs one
warning and drops telemetry instead of persisting it.

## Run the dev server

```powershell
npm run dev
```

Open http://localhost:5173/, click to start, and left-click to shoot. `Esc`
unlocks the pointer and pauses; clicking again starts a new session.

## Build

```powershell
npm run build
```

The static bundle is emitted to `dist/`. Preview it with:

```powershell
npm run preview
```

## Bot Mode

Bot Mode replaces the player with a programmatic driver that flicks to each
target and clicks it, to generate labeled non-human telemetry. It is hidden:
enable it with a query parameter.

```
http://localhost:5173/?bot=linear
http://localhost:5173/?bot=smoothed
```

- `linear` — constant angular velocity straight to the target, zero jerk.
- `smoothed` — cubic Bezier ease-in-out, smooth acceleration and deceleration.

Click once to lock the pointer, then the bot plays on its own; real mouse
movement and clicks are ignored while it runs. Flick duration is randomized per
attempt and stretches slightly with angular distance. Rows from Bot Mode carry
`is_human = false` and `bot_mode = 'linear'` or `'smoothed'`; every human row is
`is_human = true` with a null `bot_mode`.

## Telemetry

One row lands in `telemetry_logs` per attempt, containing the session id, the
target distance at spawn, time to click, hit or miss, the click offset from
target center on a hit, and the full `{t, dx, dy}` mouse trajectory for that
attempt. Inserts are fire-and-forget: failures are logged to the console and
never interrupt play.

## Notes

- Sensitivity is a hardcoded constant in `src/constants.js`; there is no UI for
  it, and no smoothing or acceleration is applied to mouse input.
- Targets spawn in a 3D volume, so distance varies per attempt. Target radius is
  fixed in world space, which means far targets really are harder to hit.
- HUD counters are per session: they reset each time the pointer re-locks, which
  is also when a new `session_id` is generated.
