import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Without credentials the trainer still runs; rows are simply dropped.
const client = url && anonKey ? createClient(url, anonKey) : null;

if (client === null) {
  console.warn(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to persist telemetry.'
  );
}

function warnFailure(error) {
  console.warn('Telemetry insert failed:', error.message);
}

// Fire-and-forget: the game never awaits this, and a failure never reaches
// the player.
export function insertTelemetry(payload) {
  if (client === null) return;

  client
    .from('telemetry_logs')
    .insert(payload)
    .then(({ error }) => {
      if (error) warnFailure(error);
    }, warnFailure);
}
