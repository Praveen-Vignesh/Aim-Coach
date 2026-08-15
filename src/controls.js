import { MathUtils } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { SENSITIVITY, PITCH_LIMIT_DEG } from './constants.js';

export function createControls(camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);

  // PointerLockControls maps movementX/Y straight onto yaw/pitch with no
  // smoothing; pointerSpeed is the only multiplier in the path.
  controls.pointerSpeed = SENSITIVITY;

  // Polar angle is measured from +Y, so a pitch limit of ±89° is a polar
  // range of [1°, 179°].
  const polarMargin = MathUtils.degToRad(90 - PITCH_LIMIT_DEG);
  controls.minPolarAngle = polarMargin;
  controls.maxPolarAngle = Math.PI - polarMargin;

  return controls;
}

// Ask for raw, OS-acceleration-free deltas. Browsers without unadjustedMovement
// reject the request, so retry once with a plain lock.
export function requestLock(controls) {
  const request = controls.domElement.requestPointerLock({ unadjustedMovement: true });

  if (request && typeof request.catch === 'function') {
    request.catch(() => controls.lock());
  }
}
