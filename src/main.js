import './style.css';
import { createScene } from './scene.js';

const { scene, camera, renderer, resize } = createScene(document.getElementById('scene'));

window.addEventListener('resize', resize);

function frame() {
  requestAnimationFrame(frame);
  renderer.render(scene, camera);
}

requestAnimationFrame(frame);
