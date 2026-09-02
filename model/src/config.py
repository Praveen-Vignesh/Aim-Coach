"""Supabase client wiring for the offline bot-detection pipeline.

Server-side only. telemetry_logs (schema.sql) grants anon insert-only with no
select policy, so this loads the service_role key, which bypasses RLS and
must never reach the Vite app or a browser bundle.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

MODEL_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = MODEL_ROOT / "data"

# Load model/.env explicitly rather than relying on cwd, since scripts here
# may be run from the repo root or from model/.
load_dotenv(MODEL_ROOT / ".env")

_URL_VAR = "SUPABASE_URL"
_KEY_VAR = "SUPABASE_SERVICE_KEY"


@lru_cache(maxsize=1)
def get_client() -> Client:
    url = os.environ.get(_URL_VAR)
    key = os.environ.get(_KEY_VAR)
    if not url or not key:
        raise RuntimeError(
            f"Missing {_URL_VAR} and/or {_KEY_VAR}. Copy model/.env.example to "
            "model/.env and fill in the project URL and service_role key "
            "(Project Settings -> API Keys)."
        )
    return create_client(url, key)
