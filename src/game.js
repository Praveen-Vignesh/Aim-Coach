import { Raycaster, Vector2, Vector3 } from 'three';
import { createTarget, spawnTarget } from './target.js';
import { createTelemetry, buildPayload } from './telemetry.js';
import { insertTelemetry } from './supabase.js';
import { FEEDBACK_FLASH_MS } from './constants.js';

const SCREEN_CENTER = new Vector2(0, 0);
const WORLD_UP = new Vector3(0, 1, 0);

// Scratch objects, reused so a click allocates nothing.
const _forward = new Vector3();
const _right = new Vector3();
const _up = new Vector3();
const _point = new Vector3();
const _intersections = [];

export function createGame({ scene, camera, crosshair, hud, bot = null }) {
  const target = createTarget();
  target.visible = false;
  scene.add(target);

  const raycaster = new Raycaster();
  const telemetry = createTelemetry();

  let running = false;
  let sessionId = null;
  let spawnTimestamp = 0;
  let flashTimer = 0;
  let hits = 0;
  let attempts = 0;
  let totalTimeMs = 0;

  function spawn() {
    spawnTarget(target, camera.position);
    target.visible = true;
    spawnTimestamp = performance.now();
    telemetry.beginAttempt(spawnTimestamp);

    if (bot !== null) bot.beginFlick(camera, target.position, spawnTimestamp);
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
  function computeClickOffset(worldPoint) {
    _forward.subVectors(target.position, camera.position).normalize();
    _right.crossVectors(_forward, WORLD_UP).normalize();
    _up.crossVectors(_right, _forward).normalize();

    _point.copy(worldPoint);
    target.worldToLocal(_point);

    return { x: _point.dot(_right), y: _point.dot(_up) };
  }

  function onMouseMove(event) {
    telemetry.record(event.movementX, event.movementY);
  }

  function shoot() {
    const timeToClickMs = Math.round(performance.now() - spawnTimestamp);
    const targetDistance = camera.position.distanceTo(target.position);

    // The camera has rotated since the last render — from mouse movement, or
    // from the bot's final frame — so recompose its world matrix before the ray
    // is cast. Without this the shot is judged against last frame's aim.
    camera.updateMatrixWorld();

    raycaster.setFromCamera(SCREEN_CENTER, camera);
    _intersections.length = 0;
    raycaster.intersectObject(target, false, _intersections);

    const isHit = _intersections.length > 0;
    const clickOffset = isHit ? computeClickOffset(_intersections[0].point) : null;
    const trajectory = telemetry.trajectory();

    // Next target first — everything below is off the latency path.
    flash(isHit ? 'hit' : 'miss');
    spawn();

    attempts += 1;
    if (isHit) hits += 1;
    totalTimeMs += timeToClickMs;
    hud.update({ hits, attempts, totalTimeMs });

    insertTelemetry(
      buildPayload({
        sessionId,
        isHuman: bot === null,
        botMode: bot === null ? null : bot.mode,
        targetDistance,
        timeToClickMs,
        clickResult: isHit ? 'hit' : 'miss',
        clickOffset,
        trajectory
      })
    );
  }

  // In Bot Mode the bot pulls the trigger, so a stray human click cannot
  // contaminate a flick that is still in progress.
  function onMouseDown(event) {
    if (running === false || bot !== null || event.button !== 0) return;
    shoot();
  }

  document.addEventListener('mousedown', onMouseDown);

  return {
    // Drives the bot's flick one frame at a time. The emitted deltas are the
    // only telemetry recorded in Bot Mode, so the buffer describes the bot's
    // rotation rather than the hand on the desk. Frames that round to no
    // movement are skipped, exactly as a real mouse reports nothing.
    update(now) {
      if (running === false || bot === null) return;

      const step = bot.advance(camera, now);
      if (step === null) return;

      if (step.dx !== 0 || step.dy !== 0) telemetry.record(step.dx, step.dy);
      if (step.done) shoot();
    },
    start() {
      sessionId = crypto.randomUUID();
      hits = 0;
      attempts = 0;
      totalTimeMs = 0;
      hud.update({ hits, attempts, totalTimeMs });

      running = true;
      if (bot === null) document.addEventListener('mousemove', onMouseMove);
      spawn();
    },
    stop() {
      running = false;
      document.removeEventListener('mousemove', onMouseMove);
      target.visible = false;
    }
  };
}
