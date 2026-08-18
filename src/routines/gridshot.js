import { createTargetPool, spawnTarget } from '../target.js';

const NO_EVENTS = Object.freeze({ expired: 0 });

// Static flicking: a fixed number of targets are held on screen. Clicking one
// replaces it somewhere else, so there is always another flick waiting.
export function createGridshotRoutine({ scene, camera, config }) {
  const pool = createTargetPool(scene, config.targetRadius);

  // Keeps replacements from overlapping the targets already out.
  const spawnOptions = {
    boundaryScale: config.boundaryScale,
    avoid: pool.active,
    minSeparation: config.targetRadius * 3
  };

  function spawnOne() {
    spawnTarget(pool.acquire(), camera.position, spawnOptions);
  }

  return {
    targets: pool.active,

    start() {
      pool.releaseAll();
      for (let i = 0; i < config.concurrentTargets; i++) spawnOne();
    },

    update() {
      return NO_EVENTS;
    },

    resolveHit(target) {
      pool.release(target);
      spawnOne();
    },

    // Missing costs accuracy but disturbs nothing: the targets are static.
    resolveMiss() {},

    aimTarget() {
      return pool.active[0] ?? null;
    },

    stop() {
      pool.dispose();
    }
  };
}
