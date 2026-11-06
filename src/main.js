import * as THREE from 'three';

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
const fadeEl = document.getElementById('fade');
const enterBtn = document.getElementById('enter');

let state = 'title'; // 'title' | 'playing'
let audioCtx = null;

try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050608);
  scene.fog = new THREE.Fog(0x050608, 4, 16);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 50);
  camera.position.set(0, 0, 6);

  scene.add(new THREE.AmbientLight(0x303848, 1));
  const red = new THREE.PointLight(0xff2222, 2.5, 20);
  red.position.set(2, 1, 4);
  scene.add(red);

  // Placeholder title visual: a black eye (dark sphere + red iris ring)
  const eye = new THREE.Group();
  eye.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.MeshLambertMaterial({ color: 0x0a0a0c })));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 40), new THREE.MeshBasicMaterial({ color: 0xcc2222 }));
  ring.position.z = 1.55;
  eye.add(ring);
  scene.add(eye);

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  let t = 0;
  const loop = () => {
    t += 0.01;
    if (state === 'title') {
      eye.rotation.y = Math.sin(t * 0.6) * 0.5;
      eye.rotation.x = Math.sin(t * 0.4) * 0.2;
      red.intensity = 2 + Math.sin(t * 2) * 0.6;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
} catch (e) {
  status.textContent = 'WebGL not available on this device.';
  console.error(e);
}

function startGame() {
  if (state !== 'title') return;
  state = 'playing';
  // Click/keypress is a user gesture, so audio can be unlocked here
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { audioCtx = new AC(); audioCtx.resume(); }
  } catch (e) {}
  fadeEl.classList.add('on');
  setTimeout(() => {
    titleEl.classList.add('out');
    setTimeout(() => { titleEl.style.display = 'none'; }, 1300);
    status.textContent = 'Scene 1: The Execution (coming next)';
    fadeEl.classList.remove('on');
  }, 1000);
}

enterBtn.addEventListener('click', startGame);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startGame();
});
enterBtn.focus();
