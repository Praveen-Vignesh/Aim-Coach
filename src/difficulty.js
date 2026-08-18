export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// Every parameter the routines read, keyed [routine][difficulty]. Phases 2-5
// consume the entries for their own routine; the shape is fixed now so it does
// not churn as each one lands.
export const ROUTINE_CONFIG = {
  // The original single-target flick mode.
  flick: {
    easy: { targetRadius: 0.8 },
    medium: { targetRadius: 0.5 },
    hard: { targetRadius: 0.3 }
  },

  // Routine 1 — static flicking, 3-4 targets held on screen.
  gridshot: {
    easy: { targetRadius: 0.8, boundaryScale: 0.6, concurrentTargets: 3 },
    medium: { targetRadius: 0.5, boundaryScale: 0.8, concurrentTargets: 3 },
    hard: { targetRadius: 0.3, boundaryScale: 1.0, concurrentTargets: 4 }
  },

  // Routine 2 — one target at a time, disappears if not hit in time.
  spidershot: {
    easy: { targetRadius: 0.8, ttlMs: 1500 },
    medium: { targetRadius: 0.5, ttlMs: 900 },
    hard: { targetRadius: 0.3, ttlMs: 400 }
  },

  // Routine 4 — abrupt random direction changes.
  strafing: {
    easy: { targetRadius: 0.9, baseVelocity: 4, dirChangeMinMs: 1000, dirChangeMaxMs: 2000 },
    medium: { targetRadius: 0.65, baseVelocity: 7, dirChangeMinMs: 500, dirChangeMaxMs: 1000 },
    hard: { targetRadius: 0.45, baseVelocity: 10, dirChangeMinMs: 200, dirChangeMaxMs: 500 }
  },

  // Routine 5 — several moving targets at once.
  switching: {
    easy: { targetRadius: 0.75, concurrentTargets: 2, speed: 2 },
    medium: { targetRadius: 0.55, concurrentTargets: 3, speed: 4 },
    hard: { targetRadius: 0.35, concurrentTargets: 5, speed: 6 }
  }
};

export function configFor(routine, difficulty) {
  const byDifficulty = ROUTINE_CONFIG[routine];
  if (byDifficulty === undefined) return null;
  return byDifficulty[difficulty] ?? null;
}
