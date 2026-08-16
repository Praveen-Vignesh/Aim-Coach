import { Euler, Vector3 } from 'three';
import {
  SENSITIVITY,
  BOT_FLICK_MIN_MS,
  BOT_FLICK_MAX_MS,
  BOT_FLICK_MS_PER_RADIAN
} from './constants.js';

const BOT_MODES = ['linear', 'smoothed'];

// Mirrors the radians-per-pixel factor PointerLockControls applies to
// movementX/Y, so driven rotation can be reported back as mouse deltas.
const RADIANS_PER_PIXEL = 0.002 * SENSITIVITY;

const _euler = new Euler(0, 0, 0, 'YXZ');
const _direction = new Vector3();

export function readBotMode() {
  const mode = new URLSearchParams(window.location.search).get('bot');
  return BOT_MODES.includes(mode) ? mode : null;
}

function wrapAngle(radians) {
  return radians - Math.PI * 2 * Math.round(radians / (Math.PI * 2));
}

// Cubic Bezier on [0,1] with control points P1 = 0 and P2 = 1, which reduces to
// 3t^2 - 2t^3: ease-in-out, zero velocity at both ends, low jerk throughout.
function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

export function createBot(mode) {
  let startYaw = 0;
  let startPitch = 0;
  let deltaYaw = 0;
  let deltaPitch = 0;
  let appliedYaw = 0;
  let appliedPitch = 0;
  let carryX = 0;
  let carryY = 0;
  let startTime = 0;
  let duration = 0;
  let flicking = false;

  return {
    mode,

    // Aims at the target center: the yaw/pitch the camera must reach, and how
    // long this flick will take.
    beginFlick(camera, targetPosition, now) {
      _euler.setFromQuaternion(camera.quaternion);
      startYaw = _euler.y;
      startPitch = _euler.x;

      _direction.subVectors(targetPosition, camera.position).normalize();
      const aimYaw = Math.atan2(-_direction.x, -_direction.z);
      const aimPitch = Math.asin(Math.max(-1, Math.min(1, _direction.y)));

      deltaYaw = wrapAngle(aimYaw - startYaw);
      deltaPitch = aimPitch - startPitch;

      const angularDistance = Math.hypot(deltaYaw, deltaPitch);
      const upperMs = BOT_FLICK_MAX_MS + angularDistance * BOT_FLICK_MS_PER_RADIAN;
      duration = BOT_FLICK_MIN_MS + Math.random() * (upperMs - BOT_FLICK_MIN_MS);

      appliedYaw = 0;
      appliedPitch = 0;
      carryX = 0;
      carryY = 0;
      startTime = now;
      flicking = true;
    },

    // Advances one frame. Returns the synthetic mouse delta for this frame and
    // whether the flick has arrived, or null once it is over.
    advance(camera, now) {
      if (flicking === false) return null;

      const progress = Math.min((now - startTime) / duration, 1);
      const eased = mode === 'smoothed' ? easeInOut(progress) : progress;

      // Rotation is set absolutely from the flick's start, so repeated frames
      // cannot accumulate drift and the camera lands exactly on target center.
      const yaw = startYaw + deltaYaw * eased;
      const pitch = startPitch + deltaPitch * eased;
      _euler.set(pitch, yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(_euler);

      const stepYaw = deltaYaw * eased - appliedYaw;
      const stepPitch = deltaPitch * eased - appliedPitch;
      appliedYaw += stepYaw;
      appliedPitch += stepPitch;

      // A real mouse reports whole counts, so these are rounded — and the
      // rounding error is carried into the next frame, which keeps the emitted
      // deltas summing to exactly the rotation performed.
      const exactX = -stepYaw / RADIANS_PER_PIXEL + carryX;
      const exactY = -stepPitch / RADIANS_PER_PIXEL + carryY;
      const dx = Math.round(exactX);
      const dy = Math.round(exactY);
      carryX = exactX - dx;
      carryY = exactY - dy;

      const done = progress >= 1;
      if (done) flicking = false;

      return { dx, dy, done };
    }
  };
}
