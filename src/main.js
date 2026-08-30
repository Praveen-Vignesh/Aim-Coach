import './style.css';
import { createScene } from './scene.js';
import { createControls, applySensitivity, requestLock } from './controls.js';
import { createGame } from './game.js';
import { createHud } from './hud.js';
import { readBotMode, createBot } from './bot.js';
import { createSettings } from './settings.js';
import { createSensitivity } from './sensitivity.js';
import { configFor } from './difficulty.js';
import { routineById } from './routines/index.js';
import { createHome } from './ui/home.js';
import { MOUSE_COUNT_SCALE } from './constants.js';

const crosshair = document.getElementById('crosshair');

const { scene, camera, renderer, resize } = createScene(document.getElementById('scene'));
const settings = createSettings();

let sensitivity = createSensitivity({ ...settings.get(), countScale: MOUSE_COUNT_SCALE });

const controls = createControls(camera, document.body, sensitivity);
const hud = createHud();

const botMode = readBotMode();
const bot = botMode === null ? null : createBot(botMode, sensitivity.radiansPerMovementUnit);

// The bot owns the camera, so real mouse movement must not rotate it.
if (bot !== null) controls.enabled = false;

const game = createGame({ scene, camera, crosshair, hud, bot });

const home = createHome({
  settings,
  onStart: () => requestLock(controls),
  onResume: () => requestLock(controls),
  onMenu: () => home.setScreen('home')
});

// One sensitivity value, two consumers. The bot has to move with the player or
// its synthetic deltas stop describing the rotation it performed.
settings.subscribe((state) => {
  sensitivity = createSensitivity({ ...state, countScale: MOUSE_COUNT_SCALE });
  applySensitivity(controls, sensitivity);
  if (bot !== null) bot.setRadiansPerMovementUnit(sensitivity.radiansPerMovementUnit);
  home.render(state);
});

home.render(settings.get());
home.setScreen('home');

// Pointer lock is still the play boundary; the home screen is the new resting
// state in front of it.
controls.addEventListener('lock', () => {
  const { routine, difficulty } = settings.get();

  home.setScreen('playing');
  hud.setMode(routineById(routine).name + ' · ' + difficulty);
  game.start({ routineId: routine, difficulty, config: configFor(routine, difficulty) });
});

controls.addEventListener('unlock', () => {
  game.stop();
  home.setScreen('paused');
});

window.addEventListener('resize', resize);

function frame(now) {
  requestAnimationFrame(frame);
  game.update(now);
  renderer.render(scene, camera);
}

requestAnimationFrame(frame);
