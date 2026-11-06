import * as THREE from 'three';

// Game flags (see design doc)
export const flags = {
  helpedDren: false,
  apologizedToDren: false,
  kidsFound: 0,
  reachedConsole: false,
  openedCard: false
};

const status = document.getElementById('status');
const canvas = document.getElementById('game');

try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202830);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
  camera.position.set(0, 1.6, 4);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1));
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0x66aaff })
  );
  cube.position.y = 1.2;
  scene.add(cube);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshLambertMaterial({ color: 0x334455 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const loop = () => {
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
  status.textContent = 'Three.js ' + THREE.REVISION + ' running (setup test)';
} catch (e) {
  status.textContent = 'WebGL not available on this device.';
  console.error(e);
}
