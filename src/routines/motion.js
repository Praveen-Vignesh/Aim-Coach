import { SPAWN_VOLUME } from '../constants.js';

// A frame this long means the tab was backgrounded or the machine stalled.
// Without a ceiling the target would teleport across the arena on the way back.
export const MAX_FRAME_SECONDS = 0.05;

export function frameDelta(now, lastNow) {
  return Math.min(Math.max(now - lastNow, 0) / 1000, MAX_FRAME_SECONDS);
}

// Targets spawn anywhere in the volume, but a moving one lives inside a
// volume inset by its radius. Without this the first bounce() would snap it
// inward by up to a radius in a single frame — a visible jump on spawn.
export function clampInside(position, radius) {
  position.x = clamp(position.x, SPAWN_VOLUME.xMin + radius, SPAWN_VOLUME.xMax - radius);
  position.y = clamp(position.y, SPAWN_VOLUME.yMin + radius, SPAWN_VOLUME.yMax - radius);
  position.z = clamp(position.z, SPAWN_VOLUME.zMin + radius, SPAWN_VOLUME.zMax - radius);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Reflects a moving target off the invisible faces of the play volume, keeping
// it inside without ever letting it stop. Both vectors are mutated in place.
export function bounce(position, velocity, radius) {
  reflectAxis(position, velocity, 'x', SPAWN_VOLUME.xMin + radius, SPAWN_VOLUME.xMax - radius);
  reflectAxis(position, velocity, 'y', SPAWN_VOLUME.yMin + radius, SPAWN_VOLUME.yMax - radius);
  reflectAxis(position, velocity, 'z', SPAWN_VOLUME.zMin + radius, SPAWN_VOLUME.zMax - radius);
}

function reflectAxis(position, velocity, axis, min, max) {
  if (position[axis] < min) {
    position[axis] = min;
    velocity[axis] = Math.abs(velocity[axis]);
    return;
  }

  if (position[axis] > max) {
    position[axis] = max;
    velocity[axis] = -Math.abs(velocity[axis]);
  }
}
