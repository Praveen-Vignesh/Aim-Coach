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
const MAX_SPAWN_ATTEMPTS = 16;

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

export function createTarget() {
  const geometry = new SphereGeometry(TARGET_RADIUS, TARGET_SEGMENTS, TARGET_SEGMENTS);
  const material = new MeshBasicMaterial({ color: TARGET_COLOR });
  return new Mesh(geometry, material);
}

// Moves the target to a random point in the 3D spawn volume, rejecting points
// that land on top of the camera. The world-space radius is never touched, so
// farther targets subtend a smaller visual angle.
export function spawnTarget(target, cameraPosition) {
  for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    target.position.set(
      randomInRange(SPAWN_VOLUME.xMin, SPAWN_VOLUME.xMax),
      randomInRange(SPAWN_VOLUME.yMin, SPAWN_VOLUME.yMax),
      randomInRange(SPAWN_VOLUME.zMin, SPAWN_VOLUME.zMax)
    );

    if (target.position.distanceTo(cameraPosition) >= MIN_SPAWN_DISTANCE) break;
  }

  target.updateMatrixWorld();
}
