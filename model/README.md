# Bot detection model

Offline Python pipeline that pulls `telemetry_logs` rows out of Supabase to
train a human-vs-bot classifier on segment/trajectory data. It is separate
from the Vite app in `src/` — no runtime dependency in either direction, and
nothing here ships to the browser.

## Setup

```powershell
cd model
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Fill in `.env` with the project URL and the **service_role** key (Project
Settings -> API Keys -> secret). `telemetry_logs` grants `anon` insert-only
with no select policy (`schema.sql`), so reading rows back out requires that
privileged key. Keep `model/.env` local — it is gitignored, and this key must
never end up in the Vite app's `.env.local` or any client bundle.

## Pull data

```powershell
python -m src.fetch_telemetry
python -m src.fetch_telemetry --routine flick --is-human false --out data/bot_flick.parquet
```

Writes every matching segment to `data/` (`.parquet`, `.csv`, or `.json`,
picked from `--out`'s extension). `data/` and `models/` are gitignored aside
from a `.gitkeep`: pulled datasets and trained model artifacts are
regenerable and don't belong in version control.

## Layout

- `src/config.py` — loads `model/.env` and builds the Supabase client.
- `src/fetch_telemetry.py` — pages through `telemetry_logs` (PostgREST caps a
  single response at 1000 rows) and saves the result.
- `data/` — pulled datasets.
- `models/` — trained model artifacts.
