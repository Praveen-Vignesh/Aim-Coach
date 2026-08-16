import './style.css';
import { createScene } from './scene.js';
import { createControls, requestLock } from './controls.js';
import { createGame } from './game.js';
import { createHud } from './hud.js';
import { readBotMode, createBot } from './bot.js';

const overlay = document.getElementById('overlay');
const crosshair = document.getElementById('crosshair');

const { scene, camera, renderer, resize } = createScene(document.getElementById('scene'));
const controls = createControls(camera, document.body);
const hud = createHud();

const botMode = readBotMode();
const bot = botMode === null ? null : createBot(botMode);

// The bot owns the camera, so real mouse movement must not rotate it.
if (bot !== null) controls.enabled = false;

const game = createGame({ scene, camera, crosshair, hud, bot });

overlay.addEventListener('click', () => requestLock(controls));

controls.addEventListener('lock', () => {
  overlay.classList.add('hidden');
  game.start();
});

controls.addEventListener('unlock', () => {
  overlay.classList.remove('hidden');
  game.stop();
});

window.addEventListener('resize', resize);

function frame(now) {
  requestAnimationFrame(frame);
  game.update(now);
  renderer.render(scene, camera);
}

requestAnimationFrame(frame);
