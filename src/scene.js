import * as THREE from 'three';
import {
  BACKGROUND_COLOR,
  MAX_PIXEL_RATIO,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_FAR,
  FLOOR_Y,
  GRID_SIZE,
  GRID_DIVISIONS,
  GRID_COLOR,
  GRID_CENTER_COLOR,
  WALL_COLOR,
  BACK_WALL_Z,
  SIDE_WALL_X,
  WALL_HEIGHT,
  WALL_WIDTH,
  WALL_DEPTH,
  WALL_CELL_SIZE
} from './constants.js';

function createWall(width, height, wallMaterial) {
  const geometry = new THREE.PlaneGeometry(
    width,
    height,
    Math.round(width / WALL_CELL_SIZE),
    Math.round(height / WALL_CELL_SIZE)
  );
  return new THREE.Mesh(geometry, wallMaterial);
}

// Wireframe floor grid plus back and side walls. Purely visual depth cues:
// without them the Z axis of the spawn volume is impossible to read.
function addEnvironment(scene) {
  const grid = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, GRID_CENTER_COLOR, GRID_COLOR);
  grid.position.y = FLOOR_Y;
  scene.add(grid);

  const wallMaterial = new THREE.MeshBasicMaterial({ color: WALL_COLOR, wireframe: true });
  const wallCenterY = FLOOR_Y + WALL_HEIGHT / 2;
  const wallCenterZ = BACK_WALL_Z + WALL_DEPTH / 2;

  const backWall = createWall(WALL_WIDTH, WALL_HEIGHT, wallMaterial);
  backWall.position.set(0, wallCenterY, BACK_WALL_Z);
  scene.add(backWall);

  const leftWall = createWall(WALL_DEPTH, WALL_HEIGHT, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-SIDE_WALL_X, wallCenterY, wallCenterZ);
  scene.add(leftWall);

  const rightWall = createWall(WALL_DEPTH, WALL_HEIGHT, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(SIDE_WALL_X, wallCenterY, wallCenterZ);
  scene.add(rightWall);
}

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND_COLOR);

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
  );
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight);

  addEnvironment(scene);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  return { scene, camera, renderer, resize };
}
