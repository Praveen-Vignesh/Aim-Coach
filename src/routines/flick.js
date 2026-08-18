import { createTargetPool, spawnTarget } from '../target.js';

const NO_EVENTS = Object.freeze({ expired: 0 });

// The original mode: one target, respawned wherever the click lands.
export function createFlickRoutine({ scene, camera, config }) {
  const pool = createTargetPool(scene, config.targetRadius);

  function spawnOne() {
    spawnTarget(pool.acquire(), camera.position);
  }

  return {
    targets: pool.active,

    start() {
      pool.releaseAll();
      spawnOne();
    },

    update() {
      return NO_EVENTS;
    },

    resolveHit() {
      pool.releaseAll();
      spawnOne();
    },

    // A miss also moves the target on, which is what makes this a pure flick
    // drill rather than a retry-until-you-hit one.
    resolveMiss() {
      pool.releaseAll();
      spawnOne();
    },

    aimTarget() {
      return pool.active[0] ?? null;
    },

    stop() {
      pool.dispose();
    }
  };
}
