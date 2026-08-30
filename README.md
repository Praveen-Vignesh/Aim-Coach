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

One row in `telemetry_logs` is one **segment** of play — a shape that fits every
routine. A segment closes with an `outcome`:

- `hit` / `miss` — a click in a destructible routine (flick, gridshot,
  spidershot, switching).
- `timeout` — a spidershot target expired before it was clicked; the failed
  attempt is kept, not discarded.
- `track` — a tracking routine (strafing) has no click, so it is logged in fixed
  ~1-second windows and once more when the session ends.

Every row carries the session id, the `routine` and `difficulty` it came from,
the `outcome`, the number of targets on screen and their layout at segment start
(`target_count`, `targets`), and — on click segments — time to click, dwell time,
target distance, and the click offset from target center. The `trajectory` is the
per-frame stream, one sample per rendered frame:

```
{ t, dx, dy, yaw, pitch, tx, ty, tz, on }
```

`dx`/`dy` are the raw device counts for that frame (they vary with DPI and OS
sensitivity); `yaw`/`pitch` are the camera's resulting angles in radians, which
are DPI-independent and the better signal for aim analysis or bot detection;
`tx`/`ty`/`tz` are the engaged target's world position that frame — so tracking
error is recoverable even while the target moves; and `on` is whether the
crosshair was over a target that frame. Inserts are fire-and-forget: failures are
logged to the console and never interrupt play.

## Notes

- Sensitivity is a hardcoded constant in `src/constants.js`; there is no UI for
  it, and no smoothing or acceleration is applied to mouse input.
- Targets spawn in a 3D volume, so distance varies per attempt. Target radius is
  fixed in world space, which means far targets really are harder to hit.
- HUD counters are per session: they reset each time the pointer re-locks, which
  is also when a new `session_id` is generated.
