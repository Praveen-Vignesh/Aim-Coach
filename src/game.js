import { Raycaster, Vector2, Vector3 } from 'three';
import { createRoutine } from './routines/index.js';
import { configFor } from './difficulty.js';
import { createTelemetry, buildPayload } from './telemetry.js';
import { insertTelemetry } from './supabase.js';
import { FEEDBACK_FLASH_MS, DEFAULT_ROUTINE, DEFAULT_DIFFICULTY } from './constants.js';

const SCREEN_CENTER = new Vector2(0, 0);
const WORLD_UP = new Vector3(0, 1, 0);

// Scratch objects, reused so a click allocates nothing.
const _forward = new Vector3();
const _right = new Vector3();
const _up = new Vector3();
const _point = new Vector3();
const _intersections = [];

// Hosts whichever routine is active: it owns the session, the raycast, the HUD
// counters and telemetry, and asks the routine what to do with a hit or a miss.
export function createGame({ scene, camera, crosshair, hud, bot = null }) {
  const raycaster = new Raycaster();
  const telemetry = createTelemetry();

  let routine = null;
  let running = false;
  let sessionId = null;
  let attemptStart = 0;
  let flashTimer = 0;
  let hits = 0;
  let attempts = 0;
  let clicks = 0;
  let totalTimeMs = 0;

  function pushHud() {
    hud.update({ hits, attempts, clicks, totalTimeMs });
  }

  // An attempt is the span between resolutions — the time the player had to
  // find and destroy the next target.
  function beginAttempt(now) {
    attemptStart = now;
    telemetry.beginAttempt(now);

    if (bot === null) return;

    const aim = routine.aimTarget();
    if (aim !== null) bot.beginFlick(camera, aim.position, now);
  }

  function flash(result) {
    crosshair.classList.remove('hit', 'miss');
    crosshair.classList.add(result);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => crosshair.classList.remove(result), FEEDBACK_FLASH_MS);
  }

  // Click offset from target center, measured on the plane perpendicular to the
  // camera-to-target vector, in world units. Targets are never rotated or
  // scaled, so their local axes stay world-aligned.
  function computeClickOffset(target, worldPoint) {
    _forward.subVectors(target.position, camera.position).normalize();
    _right.crossVectors(_forward, WORLD_UP).normalize();
    _up.crossVectors(_right, _forward).normalize();

    _point.copy(worldPoint);
    target.worldToLocal(_point);

    return { x: _point.dot(_right), y: _point.dot(_up) };
  }

  // target_distance is NOT NULL in the schema, so a miss reports the closest
  // target that was on screen rather than nothing at all.
  function nearestTargetDistance() {
    let nearest = 0;

    for (const target of routine.targets) {
      const distance = camera.position.distanceTo(target.position);
      if (nearest === 0 || distance < nearest) nearest = distance;
    }

    return nearest;
  }

  function shoot(now) {
    const timeToClickMs = Math.round(now - attemptStart);

    // The camera has rotated since the last render — from mouse movement, or
    // from the bot's final frame — so recompose its world matrix before the ray
    // is cast. Without this the shot is judged against last frame's aim.
    camera.updateMatrixWorld();

    raycaster.setFromCamera(SCREEN_CENTER, camera);
    _intersections.length = 0;
    raycaster.intersectObjects(routine.targets, false, _intersections);

    const struck = _intersections.length > 0 ? _intersections[0] : null;
    const isHit = struck !== null;
    const targetDistance = isHit
      ? camera.position.distanceTo(struck.object.position)
      : nearestTargetDistance();
    const clickOffset = isHit ? computeClickOffset(struck.object, struck.point) : null;
    const trajectory = telemetry.trajectory();

    // Resolve and re-arm first — everything below is off the latency path.
    flash(isHit ? 'hit' : 'miss');
    if (isHit) routine.resolveHit(struck.object, now);
    else routine.resolveMiss(now);
    beginAttempt(now);

    attempts += 1;
    clicks += 1;
    if (isHit) hits += 1;
    totalTimeMs += timeToClickMs;
    pushHud();

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

  function onMouseMove(event) {
    telemetry.record(event.movementX, event.movementY);
  }

  // In Bot Mode the bot pulls the trigger, so a stray human click cannot
  // contaminate a flick that is still in progress.
  function onMouseDown(event) {
    if (running === false || bot !== null || event.button !== 0) return;
    shoot(performance.now());
  }

  document.addEventListener('mousedown', onMouseDown);

  return {
    update(now) {
      if (running === false) return;

      const events = routine.update(now);
      if (events.expired > 0) {
        // The clock took the target. It counts against accuracy, but no click
        // happened, so it must not drag the average time-to-click around.
        attempts += events.expired;
        pushHud();
        beginAttempt(now);
      }

      if (bot === null) return;

      const step = bot.advance(camera, now);
      if (step === null) return;

      if (step.dx !== 0 || step.dy !== 0) telemetry.record(step.dx, step.dy);
      if (step.done) shoot(now);
    },

    // A fresh routine is built per session, so a mode or difficulty change on
    // the home screen always takes effect on the next start.
    start(options = {}) {
      const routineId = options.routineId ?? DEFAULT_ROUTINE;
      const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY;
      const config = options.config ?? configFor(routineId, difficulty);

      if (routine !== null) routine.stop();
      routine = createRoutine(routineId, { scene, camera, config });

      sessionId = crypto.randomUUID();
      hits = 0;
      attempts = 0;
      clicks = 0;
      totalTimeMs = 0;
      pushHud();

      running = true;
      if (bot === null) document.addEventListener('mousemove', onMouseMove);

      const now = performance.now();
      routine.start(now);
      beginAttempt(now);
    },

    stop() {
      running = false;
      document.removeEventListener('mousemove', onMouseMove);
      if (routine !== null) routine.stop();
    }
  };
}
