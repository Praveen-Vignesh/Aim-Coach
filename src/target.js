import { Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import {
  TARGET_RADIUS,
  TARGET_COLOR,
  TARGET_SEGMENTS,
  SPAWN_VOLUME,
  MIN_SPAWN_DISTANCE
} from './constants.js';

// Rejection sampling is bounded so an unreachable constant combination can
// never hang the loop; the last candidate is used if every draw is rejected.
const MAX_SPAWN_ATTEMPTS = 24;

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

export function createTarget(radius = TARGET_RADIUS) {
  const geometry = new SphereGeometry(radius, TARGET_SEGMENTS, TARGET_SEGMENTS);
  const material = new MeshBasicMaterial({ color: TARGET_COLOR });
  const target = new Mesh(geometry, material);
  target.userData.radius = radius;
  return target;
}

// Rebuilds the geometry rather than scaling the mesh. A non-unit scale would
// distort worldToLocal and silently corrupt every recorded click offset.
export function setTargetRadius(target, radius) {
  if (target.userData.radius === radius) return;

  target.geometry.dispose();
  target.geometry = new SphereGeometry(radius, TARGET_SEGMENTS, TARGET_SEGMENTS);
  target.userData.radius = radius;
}

// Moves the target to a random point in the spawn volume, rejecting points that
// land on top of the camera or overlap a target that is already out.
//
// boundaryScale widens or narrows the horizontal and vertical spread — a wider
// boundary means longer flicks. Depth is deliberately never scaled: varying
// distance is the point of spawning in a volume rather than on a wall.
export function spawnTarget(target, cameraPosition, options = {}) {
  const { boundaryScale = 1, avoid = null, minSeparation = 0 } = options;

  const xLimit = ((SPAWN_VOLUME.xMax - SPAWN_VOLUME.xMin) / 2) * boundaryScale;
  const yLimit = ((SPAWN_VOLUME.yMax - SPAWN_VOLUME.yMin) / 2) * boundaryScale;

  for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    target.position.set(
      randomInRange(-xLimit, xLimit),
      randomInRange(-yLimit, yLimit),
      randomInRange(SPAWN_VOLUME.zMin, SPAWN_VOLUME.zMax)
    );

    if (target.position.distanceTo(cameraPosition) < MIN_SPAWN_DISTANCE) continue;
    if (isClearOf(target, avoid, minSeparation)) break;
  }

  target.updateMatrixWorld();
}

function isClearOf(target, avoid, minSeparation) {
  if (avoid === null || minSeparation <= 0) return true;

  for (const other of avoid) {
    if (other === target) continue;
    if (other.position.distanceTo(target.position) < minSeparation) return false;
  }

  return true;
}

// Targets are pooled rather than created per spawn: routines churn through them
// and allocating geometry mid-session would stutter the frame.
export function createTargetPool(scene, radius) {
  const free = [];
  const active = [];

  return {
    active,

    acquire() {
      const target = free.pop() ?? createTarget(radius);
      setTargetRadius(target, radius);
      target.visible = true;
      scene.add(target);
      active.push(target);
      return target;
    },

    release(target) {
      const index = active.indexOf(target);
      if (index === -1) return;

      active.splice(index, 1);
      target.visible = false;
      free.push(target);
    },

    releaseAll() {
      while (active.length > 0) this.release(active[active.length - 1]);
    },

    // A new routine is built for every session, so its meshes must leave the
    // scene with it or they accumulate invisibly.
    dispose() {
      this.releaseAll();

      for (const target of free) {
        scene.remove(target);
        target.geometry.dispose();
        target.material.dispose();
      }

      free.length = 0;
    }
  };
}
