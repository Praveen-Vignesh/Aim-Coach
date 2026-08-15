import { Raycaster, Vector2, Vector3 } from 'three';
import { createTarget, spawnTarget } from './target.js';
import { FEEDBACK_FLASH_MS } from './constants.js';

const SCREEN_CENTER = new Vector2(0, 0);
const WORLD_UP = new Vector3(0, 1, 0);

// Scratch objects, reused so a click allocates nothing.
const _forward = new Vector3();
const _right = new Vector3();
const _up = new Vector3();
const _point = new Vector3();
const _intersections = [];

export function createGame({ scene, camera, crosshair }) {
  const target = createTarget();
  target.visible = false;
  scene.add(target);

  const raycaster = new Raycaster();

  let running = false;
  let spawnTimestamp = 0;
  let flashTimer = 0;

  function spawn() {
    spawnTarget(target, camera.position);
    target.visible = true;
    spawnTimestamp = performance.now();
  }

  function flash(result) {
    crosshair.classList.remove('hit', 'miss');
    crosshair.classList.add(result);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => crosshair.classList.remove(result), FEEDBACK_FLASH_MS);
  }

  // Click offset from target center, measured on the plane perpendicular to the
  // camera-to-target vector, in world units. The target is never rotated or
  // scaled, so its local axes stay world-aligned.
  function clickOffset(worldPoint) {
    _forward.subVectors(target.position, camera.position).normalize();
    _right.crossVectors(_forward, WORLD_UP).normalize();
    _up.crossVectors(_right, _forward).normalize();

    _point.copy(worldPoint);
    target.worldToLocal(_point);

    return { x: _point.dot(_right), y: _point.dot(_up) };
  }

  function onMouseDown(event) {
    if (running === false || event.button !== 0) return;

    const timeToClick = Math.round(performance.now() - spawnTimestamp);
    const distance = camera.position.distanceTo(target.position);

    raycaster.setFromCamera(SCREEN_CENTER, camera);
    _intersections.length = 0;
    raycaster.intersectObject(target, false, _intersections);

    const isHit = _intersections.length > 0;
    const offset = isHit ? clickOffset(_intersections[0].point) : null;

    flash(isHit ? 'hit' : 'miss');
    console.log(
      `${isHit ? 'hit' : 'miss'} | ${timeToClick} ms | distance ${distance.toFixed(2)}` +
        (offset ? ` | offset ${offset.x.toFixed(3)}, ${offset.y.toFixed(3)}` : '')
    );

    spawn();
  }

  document.addEventListener('mousedown', onMouseDown);

  return {
    start() {
      running = true;
      spawn();
    },
    stop() {
      running = false;
      target.visible = false;
    }
  };
}
