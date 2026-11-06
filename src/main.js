import * as THREE from 'three';
import { createScene1 } from './scenes/scene1.js';
import * as ui from './core/ui.js';
import * as audio from './core/audio.js';
import * as voice from './core/voice.js';

// Game flags (see design doc)
export const flags = {
  helpedDren: false,
  apologizedToDren: false,
  kidsFound: 0,
  reachedConsole: false,
  openedCard: false
};

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const titleEl = document.getElementById('title');
const enterBtn = document.getElementById('enter');

let state = 'title'; // 'title' | 'playing' | 'ended'
let renderer = null;
let current = null; // { scene, update(dt) }
let scene1 = null;

function hint() {
  status.textContent = state === 'title' ? '' :
    'Space: skip line  \u00b7  V: voice ' + (voice.isEnabled() ? 'ON' : 'OFF') + (voice.supported() ? '' : ' (not supported here)');
}

try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
} catch (e) {
  status.textContent = 'WebGL not available on this device.';
  console.error(e);
}

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
camera.position.set(0, 0, 6);

// ---- Title scene: a black eye ----
const titleScene = new THREE.Scene();
titleScene.background = new THREE.Color(0x050608);
titleScene.fog = new THREE.Fog(0x050608, 4, 16);
titleScene.add(new THREE.AmbientLight(0x303848, 1));
const red = new THREE.PointLight(0xff2222, 2.5, 20);
red.position.set(2, 1, 4);
titleScene.add(red);
const eye = new THREE.Group();
eye.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.MeshLambertMaterial({ color: 0x0a0a0c })));
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 40), new THREE.MeshBasicMaterial({ color: 0xcc2222 }));
ring.position.z = 1.55;
eye.add(ring);
titleScene.add(eye);

let tt = 0;
current = {
  scene: titleScene,
  update(dt) {
    tt += dt;
    eye.rotation.y = Math.sin(tt * 0.6) * 0.5;
    eye.rotation.x = Math.sin(tt * 0.4) * 0.2;
    red.intensity = 2 + Math.sin(tt * 2) * 0.6;
  }
};

function resize() {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  current.update(dt);
  if (renderer) renderer.render(current.scene, camera);
  requestAnimationFrame(loop);
}
if (renderer) requestAnimationFrame(loop);

function launchScene1() {
  if (scene1) scene1.dispose();
  ui.hideEnd();
  scene1 = createScene1({
    camera, ui, audio,
    onEnd: () => { state = 'ended'; }
  });
  current = scene1;
  state = 'playing';
  hint();
  scene1.start();
}

function startGame() {
  if (state !== 'title') return;
  state = 'playing';
  audio.init(); // click/keypress is a user gesture, so audio and voice can start
  ui.setFade(true, 1);
  setTimeout(() => {
    titleEl.classList.add('out');
    setTimeout(() => { titleEl.style.display = 'none'; }, 1300);
    launchScene1();
  }, 1000);
}

function restart() {
  if (state !== 'ended') return;
  voice.cancel();
  state = 'playing';
  ui.setFade(true, 0.5);
  setTimeout(launchScene1, 600);
}

enterBtn.addEventListener('click', startGame);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startGame();
  else if (e.key === ' ' && state === 'playing') { e.preventDefault(); ui.skipLine(); }
  else if (e.key === 'v' || e.key === 'V') { voice.toggle(); hint(); }
  else if (e.key === 'r' || e.key === 'R') restart();
});
enterBtn.focus();
