import { createTargetPool, spawnTarget } from '../target.js';

const NO_EVENTS = Object.freeze({ expired: 0 });
const EXPIRED = Object.freeze({ expired: 1 });

// Dynamic reflex: one target on a countdown. Hit it or lose it — either way the
// next one appears immediately.
export function createSpidershotRoutine({ scene, camera, config }) {
  const pool = createTargetPool(scene, config.targetRadius);
  let expiresAt = 0;

  function spawnOne(now) {
    spawnTarget(pool.acquire(), camera.position);
    expiresAt = now + config.ttlMs;
  }

  return {
    kind: 'destructible',
    targets: pool.active,

    start(now) {
      pool.releaseAll();
      spawnOne(now);
    },

    update(now) {
      if (pool.active.length === 0 || now < expiresAt) return NO_EVENTS;

      pool.releaseAll();
      spawnOne(now);
      return EXPIRED;
    },

    resolveHit(target, now) {
      pool.release(target);
      spawnOne(now);
    },

    // A miss leaves the target alive: the clock is the only thing that takes it.
    resolveMiss() {},

    aimTarget() {
      return pool.active[0] ?? null;
    },

    stop() {
      pool.dispose();
    }
  };
}
