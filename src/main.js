import './style.css';
import { createScene } from './scene.js';
import { createControls, requestLock } from './controls.js';
import { createGame } from './game.js';
import { createHud } from './hud.js';

const overlay = document.getElementById('overlay');
const crosshair = document.getElementById('crosshair');

const { scene, camera, renderer, resize } = createScene(document.getElementById('scene'));
const controls = createControls(camera, document.body);
const hud = createHud();
const game = createGame({ scene, camera, crosshair, hud });

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

function frame() {
  requestAnimationFrame(frame);
  renderer.render(scene, camera);
}

requestAnimationFrame(frame);
