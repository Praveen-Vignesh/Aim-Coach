import { MathUtils } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { PITCH_LIMIT_DEG } from './constants.js';

export function createControls(camera, domElement, sensitivity) {
  const controls = new PointerLockControls(camera, domElement);

  applySensitivity(controls, sensitivity);

  // Polar angle is measured from +Y, so a pitch limit of ±89° is a polar
  // range of [1°, 179°].
  const polarMargin = MathUtils.degToRad(90 - PITCH_LIMIT_DEG);
  controls.minPolarAngle = polarMargin;
  controls.maxPolarAngle = Math.PI - polarMargin;

  return controls;
}

// pointerSpeed is the only multiplier between movementX/Y and camera rotation,
// so assigning it is the whole of applying a sensitivity change — no reload.
export function applySensitivity(controls, sensitivity) {
  controls.pointerSpeed = sensitivity.pointerSpeed;
}

// Ask for raw, OS-acceleration-free deltas. Browsers without unadjustedMovement
// reject the request, so retry once with a plain lock. Both rejections are
// swallowed: the browser also refuses a lock requested too soon after Esc, and
// that must not surface as an unhandled rejection.
export function requestLock(controls) {
  const request = controls.domElement.requestPointerLock({ unadjustedMovement: true });

  if (request && typeof request.catch === 'function') {
    request.catch(() => {
      const retry = controls.domElement.requestPointerLock();
      if (retry && typeof retry.catch === 'function') retry.catch(() => {});
    });
  }
}
