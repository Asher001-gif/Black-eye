import * as THREE from 'three';
import { Timeline, lerp, easeIn, easeOut, easeInOut } from '../core/timeline.js';

// ---- Characters (edit names, colours and voices here) ----
const GATHEN = { name: 'Gathen', color: '#ffd23f', voice: { pitch: 0.5, rate: 0.85 } };
const CROWD = { name: 'Crowd', color: '#8fd3ff', voice: { pitch: 1.3, rate: 1.1 } };

const STAGE_Y = 0.8;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createScene1(ctx) {
  const { camera, ui, audio, onEnd } = ctx;
  const rand = mulberry32(7);
  const scene = new THREE.Scene();
  const tl = new Timeline();
  let t = 0;
  let alive = true;

  scene.background = new THREE.Color(0x0d1630);
  scene.fog = new THREE.FogExp2(0x0d1630, 0.008);

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0x8aa0d8, 0x222838, 1.4));
  const dir = new THREE.DirectionalLight(0xaab8ff, 0.9);
  dir.position.set(-10, 30, 20);
  scene.add(dir);
  const spot = new THREE.SpotLight(0xffffff, 2.2, 40, 0.55, 0.5);
  spot.position.set(0, 16, 6);
  spot.target.position.set(0, STAGE_Y, 0);
  scene.add(spot); scene.add(spot.target);
  const redLight = new THREE.PointLight(0xff2222, 0, 18);
  redLight.position.set(0, 3, 2);
  scene.add(redLight);

  // ---------- ground and plaza ----------
  const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 32), new THREE.MeshLambertMaterial({ color: 0x0c0f18 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(21, 48), new THREE.MeshLambertMaterial({ color: 0x1a2030 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.01;
  scene.add(plaza);
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(20.4, 20.8, 64), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
  outerRing.rotation.x = -Math.PI / 2; outerRing.position.y = 0.03;
  scene.add(outerRing);

  // stage
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.2, STAGE_Y, 40), new THREE.MeshLambertMaterial({ color: 0x2a3142 }));
  stage.position.y = STAGE_Y / 2;
  scene.add(stage);
  const stageRingMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const stageRing = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.85, 48), stageRingMat);
  stageRing.rotation.x = -Math.PI / 2; stageRing.position.y = STAGE_Y + 0.01;
  scene.add(stageRing);

  // ---------- futuristic skyline ----------
  const bMat = new THREE.MeshLambertMaterial({ color: 0x2a3556 });
  const buildings = [];
  function addBuildingRing(count, rMin, rMax, hMin, hMax) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.1;
      const r = rMin + rand() * (rMax - rMin);
      const w = 8 + rand() * 7, d = 8 + rand() * 6, h = hMin + rand() * (hMax - hMin);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat);
      m.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      m.rotation.y = Math.atan2(-m.position.x, -m.position.z); // local +z faces the plaza
      scene.add(m);
      buildings.push({ m, w, d, h });
    }
  }
  addBuildingRing(26, 30, 40, 22, 55);
  addBuildingRing(30, 50, 70, 40, 95);

  // glowing windows (one instanced mesh)
  const winGeo = new THREE.BoxGeometry(0.7, 0.35, 0.05);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const maxWin = 1400;
  const wins = new THREE.InstancedMesh(winGeo, winMat, maxWin);
  const winCols = [0x22d3ee, 0xff3ea5, 0xffb347, 0x9be7ff, 0x7c5cff];
  let wi = 0;
  const bm = new THREE.Matrix4(), tm = new THREE.Matrix4(), col = new THREE.Color();
  for (const b of buildings) {
    b.m.updateMatrix();
    bm.copy(b.m.matrix);
    const cols = Math.floor(b.w / 1.6), rows = Math.floor(b.h / 1.8);
    for (let cx = 0; cx < cols; cx++) {
      for (let ry = 1; ry < rows; ry++) {
        if (wi >= maxWin) break;
        if (rand() > 0.35) continue;
        const lx = (cx - (cols - 1) / 2) * 1.6;
        const ly = -b.h / 2 + ry * 1.8;
        tm.makeTranslation(lx, ly, b.d / 2 + 0.04);
        wins.setMatrixAt(wi, new THREE.Matrix4().multiplyMatrices(bm, tm));
        wins.setColorAt(wi, col.setHex(winCols[Math.floor(rand() * winCols.length)]));
        wi++;
      }
    }
  }
  wins.count = wi;
  wins.instanceMatrix.needsUpdate = true;
  if (wins.instanceColor) wins.instanceColor.needsUpdate = true;
  scene.add(wins);

  // holographic banner
  const bc = document.createElement('canvas'); bc.width = 512; bc.height = 128;
  const bg = bc.getContext('2d');
  bg.font = 'bold 84px Arial'; bg.textAlign = 'center';
  bg.shadowColor = '#22d3ee'; bg.shadowBlur = 26; bg.fillStyle = '#aef6ff';
  bg.fillText('MALIANA', 256, 94);
  const bannerMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, fog: false, depthWrite: false, side: THREE.DoubleSide });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(18, 4.5), bannerMat);
  banner.position.set(0, 13, -22);
  scene.add(banner);

  // flying cars
  const cars = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.45), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffb347 : 0x22d3ee }));
    scene.add(c);
    cars.push({ m: c, a: rand() * 6.28, r: 40 + rand() * 25, y: 22 + rand() * 22, s: (0.05 + rand() * 0.07) * (i % 2 ? 1 : -1) });
  }

  // ---------- crowd of humans (instanced) ----------
  const N = 96;
  const bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.25, 0.9, 4, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
  const cloth = [0x1f2a44, 0x2c5f6e, 0x5b3a6e, 0x444b55, 0xb5bcc9, 0x6e2c3a, 0x2f6e4a, 0x7a6a3a];
  const skins = [0xf1c9a5, 0xd9a06f, 0xa9744a, 0x7a4a2c, 0xe8b894];
  const keepClear = [[0, 9, 2.6], [-6, 9, 1.8], [-0.5, 5.5, 2.2]]; // camera paths: x, z, radius
  const crowd = [];
  let tries = 0;
  while (crowd.length < N && tries < 4000) {
    tries++;
    const a = rand() * Math.PI * 2, r = 7.2 + rand() * 11;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 2 && z > 3) continue;
    if (keepClear.some((k) => (x - k[0]) ** 2 + (z - k[1]) ** 2 < k[2] * k[2])) continue;
    if (crowd.some((c) => (c.x - x) ** 2 + (c.z - z) ** 2 < 0.8)) continue;
    crowd.push({ x, z, rot: Math.atan2(-x, -z), phase: rand() * 6.28, speed: 7 + rand() * 5, sc: 0.92 + rand() * 0.16 });
  }
  const nCrowd = crowd.length;
  bodies.count = nCrowd; heads.count = nCrowd;
  crowd.forEach((c, i) => {
    bodies.setColorAt(i, col.setHex(cloth[Math.floor(rand() * cloth.length)]));
    heads.setColorAt(i, col.setHex(skins[Math.floor(rand() * skins.length)]));
  });
  bodies.instanceColor.needsUpdate = true; heads.instanceColor.needsUpdate = true;
  bodies.frustumCulled = false; heads.frustumCulled = false;
  scene.add(bodies); scene.add(heads);
  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';
  let laugh = 0.25, laughTarget = 0.25;

  function updateCrowd(dt) {
    laugh += (laughTarget - laugh) * Math.min(1, dt * 4);
    for (let i = 0; i < nCrowd; i++) {
      const c = crowd[i];
      const s = Math.sin(t * c.speed + c.phase);
      const bob = Math.abs(s) * 0.14 * laugh;
      const lean = s * 0.2 * laugh;
      dummy.scale.set(c.sc, c.sc, c.sc);
      dummy.position.set(c.x, 0.7 * c.sc + bob, c.z);
      dummy.rotation.set(lean, c.rot, 0);
      dummy.updateMatrix();
      bodies.setMatrixAt(i, dummy.matrix);
      dummy.position.set(c.x, 1.55 * c.sc + bob, c.z);
      dummy.rotation.set(lean * 1.8 - laugh * 0.25 * (s > 0 ? 1 : 0.4), c.rot, 0);
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);
    }
    bodies.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
  }

  // ---------- old robot (placeholder model, Roy's father) ----------
  const metal = new THREE.MeshLambertMaterial({ color: 0x6e675e });
  const joint = new THREE.MeshLambertMaterial({ color: 0x3a3a3e });
  const robot = new THREE.Group();
  robot.position.set(0, STAGE_Y, 0);
  scene.add(robot);
  function part(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); robot.add(m); return m;
  }
  const rPelvis = part(new THREE.BoxGeometry(0.7, 0.3, 0.45), joint, 0, 0.45, 0);
  const rTorso = part(new THREE.BoxGeometry(0.8, 0.85, 0.5), metal, 0, 1.0, 0);
  const rHead = part(new THREE.BoxGeometry(0.45, 0.4, 0.42), metal, 0, 1.65, 0);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffb000 });
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.03), eyeMat);
  eye.position.set(0, 0.02, 0.22); rHead.add(eye);
  const rArmL = part(new THREE.BoxGeometry(0.2, 0.75, 0.2), joint, -0.55, 0.95, 0);
  const rArmR = part(new THREE.BoxGeometry(0.2, 0.75, 0.2), joint, 0.55, 0.95, 0);
  const rLegL = part(new THREE.BoxGeometry(0.26, 0.26, 0.8), metal, -0.2, 0.13, -0.1);
  const rLegR = part(new THREE.BoxGeometry(0.26, 0.26, 0.8), metal, 0.2, 0.13, -0.1);
  const collar = part(new THREE.TorusGeometry(0.26, 0.04, 6, 20), new THREE.MeshBasicMaterial({ color: 0x22d3ee }), 0, 1.45, 0);
  collar.rotation.x = Math.PI / 2;
  const robotParts = [rPelvis, rTorso, rHead, rArmL, rArmR, rLegL, rLegR, collar];

  // ---------- Gathen (placeholder model) ----------
  const gathen = new THREE.Group();
  gathen.position.set(1.45, STAGE_Y, -0.5);
  gathen.rotation.y = -Math.PI / 2; // faces the robot
  scene.add(gathen);
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a1d26 });
  const gold = new THREE.MeshLambertMaterial({ color: 0xd9a81e });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc88f66 });
  function gpart(geo, mat, x, y, z, parent) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || gathen).add(m); return m;
  }
  gpart(new THREE.BoxGeometry(0.25, 0.8, 0.28), dark, -0.18, 0.4, 0);
  gpart(new THREE.BoxGeometry(0.25, 0.8, 0.28), dark, 0.18, 0.4, 0);
  const gTorso = gpart(new THREE.BoxGeometry(0.75, 0.85, 0.42), dark, 0, 1.22, 0);
  gpart(new THREE.BoxGeometry(0.2, 0.7, 0.03), gold, 0, 1.22, 0.22);
  gpart(new THREE.BoxGeometry(0.28, 0.2, 0.46), gold, -0.5, 1.62, 0);
  gpart(new THREE.BoxGeometry(0.28, 0.2, 0.46), gold, 0.5, 1.62, 0);
  const gHead = new THREE.Group(); gHead.position.set(0, 1.85, 0); gathen.add(gHead);
  gpart(new THREE.SphereGeometry(0.22, 12, 10), skin, 0, 0, 0, gHead);
  gpart(new THREE.BoxGeometry(0.4, 0.1, 0.4), dark, 0, 0.17, -0.02, gHead);
  gpart(new THREE.BoxGeometry(0.05, 0.04, 0.03), dark, -0.08, 0.03, 0.2, gHead);
  gpart(new THREE.BoxGeometry(0.05, 0.04, 0.03), dark, 0.08, 0.03, 0.2, gHead);
  gpart(new THREE.BoxGeometry(0.2, 0.7, 0.2), dark, -0.5, 1.2, 0); // left arm
  // right arm pivot (swings the blade)
  const arm = new THREE.Group(); arm.position.set(0.5, 1.6, 0); gathen.add(arm);
  gpart(new THREE.BoxGeometry(0.16, 0.8, 0.16), dark, 0, -0.4, 0, arm);
  gpart(new THREE.SphereGeometry(0.1, 8, 6), skin, 0, -0.82, 0, arm);
  const bladeMat = new THREE.MeshBasicMaterial({ color: 0x3a3a2a });
  const blade = gpart(new THREE.BoxGeometry(0.07, 1.2, 0.07), bladeMat, 0, -1.45, 0, arm);
  const ARM_REST = -0.9, ARM_UP = -2.6, ARM_END = -0.35;
  arm.rotation.x = ARM_REST;

  // ---------- sparks and broken parts ----------
  const SP = 140;
  const sparkPos = new Float32Array(SP * 3), sparkVel = new Float32Array(SP * 3), sparkLife = new Float32Array(SP);
  for (let i = 0; i < SP; i++) sparkPos[i * 3 + 1] = -1000;
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffc040, size: 0.13, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sparks.frustumCulled = false;
  scene.add(sparks);
  function emitSparks(x, y, z, n) {
    let k = 0;
    for (let i = 0; i < SP && k < n; i++) {
      if (sparkLife[i] > 0) continue;
      sparkLife[i] = 0.5 + rand() * 0.9;
      sparkPos[i * 3] = x; sparkPos[i * 3 + 1] = y; sparkPos[i * 3 + 2] = z;
      sparkVel[i * 3] = (rand() - 0.5) * 6 - 1.5;
      sparkVel[i * 3 + 1] = 1 + rand() * 5;
      sparkVel[i * 3 + 2] = (rand() - 0.5) * 6;
      k++;
    }
  }
  function updateSparks(dt) {
    for (let i = 0; i < SP; i++) {
      if (sparkLife[i] <= 0) continue;
      sparkLife[i] -= dt;
      sparkVel[i * 3 + 1] -= 9 * dt;
      sparkPos[i * 3] += sparkVel[i * 3] * dt;
      sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt;
      sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
      if (sparkLife[i] <= 0) sparkPos[i * 3 + 1] = -1000;
    }
    sparkGeo.attributes.position.needsUpdate = true;
  }
  const pieces = [];
  function breakRobot() {
    for (const p of robotParts) {
      scene.attach(p); // keep world transform, detach from robot group
      const isHead = p === rHead;
      pieces.push({
        o: p,
        v: new THREE.Vector3((rand() - 0.5) * 3 - (isHead ? 3 : 0.5), 2.5 + rand() * 3, (rand() - 0.2) * 3),
        w: new THREE.Vector3((rand() - 0.5) * 8, (rand() - 0.5) * 8, (rand() - 0.5) * 8)
      });
    }
  }
  function updatePieces(dt) {
    for (const p of pieces) {
      p.v.y -= 14 * dt;
      p.o.position.addScaledVector(p.v, dt);
      p.o.rotation.x += p.w.x * dt; p.o.rotation.y += p.w.y * dt; p.o.rotation.z += p.w.z * dt;
      if (p.o.position.y < STAGE_Y + 0.15) {
        p.o.position.y = STAGE_Y + 0.15;
        p.v.y *= -0.3; p.v.x *= 0.7; p.v.z *= 0.7; p.w.multiplyScalar(0.6);
      }
    }
  }

  // ---------- camera rig ----------
  const base = new THREE.Vector3(0, 40, 48), look = new THREE.Vector3(0, 3, 0);
  let shake = 0;
  camera.fov = 55; camera.near = 0.1; camera.far = 400; camera.updateProjectionMatrix();
  function camMove(p, l, dur, ease) {
    const p0 = base.clone(), l0 = look.clone();
    return tl.tween(dur, (k) => { base.lerpVectors(p0, p, k); look.lerpVectors(l0, l, k); }, ease || easeInOut);
  }
  function cut(p, l) { base.copy(p); look.copy(l); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- state flags for animation ----------
  let gathenLaughing = false, struck = false, alert = 0;

  function update(dt) {
    if (!alive) return;
    t += dt;
    tl.update(dt);
    updateCrowd(dt);
    updateSparks(dt);
    updatePieces(dt);

    for (const c of cars) {
      c.a += c.s * dt;
      c.m.position.set(Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r);
      c.m.rotation.y = -c.a + (c.s > 0 ? 0 : Math.PI);
    }
    bannerMat.opacity = 0.85 + Math.sin(t * 3) * 0.1;
    if (!struck) eyeMat.color.setHex(Math.sin(t * 2) > 0 ? 0xffb000 : 0xcc8800);
    if (!struck) rHead.rotation.x = 0.12 + Math.sin(t * 0.8) * 0.02; // head hangs low
    gTorso.position.y = 1.22 + Math.sin(t * 1.5) * 0.01;
    if (gathenLaughing) {
      gHead.rotation.x = -0.35 + Math.sin(t * 14) * 0.08;
      gathen.position.y = STAGE_Y + Math.abs(Math.sin(t * 14)) * 0.05;
    } else { gHead.rotation.x = 0; gathen.position.y = STAGE_Y; }
    if (alert > 0) {
      alert -= dt;
      redLight.intensity = alert > 0 ? (Math.sin(t * 40) > 0 ? 3 : 0.5) : 0;
      stageRingMat.color.setHex(alert > 0 && Math.sin(t * 40) > 0 ? 0xff2222 : 0x22d3ee);
    }

    shake *= Math.pow(0.02, dt);
    camera.position.set(
      base.x + (rand() - 0.5) * shake,
      base.y + (rand() - 0.5) * shake + Math.sin(t * 0.7) * 0.03,
      base.z + (rand() - 0.5) * shake
    );
    camera.lookAt(look);
  }

  // ---------- the cutscene ----------
  const say = (who, text) => ui.say(who, text, tl);

  async function strike() {
    bladeMat.color.setHex(0xfff2a0);
    audio.charge();
    await tl.tween(0.9, (k) => { arm.rotation.x = lerp(ARM_REST, ARM_UP, k); }, easeInOut);
    await tl.wait(0.5);
    let hit = false;
    await tl.tween(0.26, (k) => {
      arm.rotation.x = lerp(ARM_UP, ARM_END, k);
      if (!hit && k > 0.55) { hit = true; onHit(); }
    }, easeIn);
    bladeMat.color.setHex(0x3a3a2a);
    await tl.tween(0.8, (k) => { arm.rotation.x = lerp(ARM_END, ARM_REST, k); }, easeOut);
  }

  function onHit() {
    struck = true;
    ui.flash();
    audio.zap();
    audio.crash();
    shake = 0.6;
    alert = 1.8;
    laughTarget = 0; audio.setCrowd(0.03);
    eyeMat.color.setHex(0xffffff);
    emitSparks(0.1, STAGE_Y + 1.5, 0, 110);
    breakRobot();
    tl.wait(0.35).then(() => { eyeMat.color.setHex(0x550000); });
    tl.wait(1.2).then(() => { eyeMat.color.setHex(0x000000); });
  }

  async function run() {
    cut(V(0, 40, 48), V(0, 3, 0));
    audio.setCrowd(0.12);
    ui.setFade(false, 3);
    ui.showLocation('EARTH  \u00b7  MALIANA', tl, 4);

    // establishing shot: crane down toward the plaza
    await camMove(V(0, 3.2, 13), V(0, 1.9, 0), 9, easeInOut);

    // the crowd laughs
    cut(V(-6, 1.8, 9), V(-6, 1.9, -8));
    laughTarget = 0.7; audio.setCrowd(0.3);
    camMove(V(-5, 1.8, 9), V(-1, 1.9, -8), 7, easeInOut);
    await say(CROWD, 'Look at him! The great pioneer!');
    laughTarget = 1; audio.setCrowd(0.45);
    await say(CROWD, 'Ha ha ha ha!');

    // Gathen steps forward
    cut(V(-0.6, 2.2, 6), V(0.7, 1.7, 0));
    laughTarget = 0.25; audio.setCrowd(0.12);
    camMove(V(-0.2, 2.2, 5), V(0.7, 1.7, 0), 6, easeInOut);
    await say(GATHEN, 'Quiet. Let them look at him.');
    await say(GATHEN, 'Roy\u2019s father. The first of the machine-bodied.');

    cut(V(0.2, 2.9, 2.7), V(1.45, 2.6, -0.5));
    camMove(V(0.5, 2.8, 2.5), V(1.45, 2.6, -0.5), 5, easeInOut);
    await say(GATHEN, 'Once he led them. Now he kneels in Maliana.');
    laughTarget = 0.7; audio.setCrowd(0.3);
    await say(CROWD, 'Finish him! Finish him!');
    await say(GATHEN, 'As you wish.');

    // the strike
    cut(V(0.2, 2.4, 4.6), V(0.2, 2.0, 0));
    camMove(V(0.25, 2.3, 4.0), V(0.2, 2.0, 0), 3, easeInOut);
    laughTarget = 0.1; audio.setCrowd(0.06);
    await strike();
    await tl.wait(1.8);

    // Gathen laughs
    cut(V(0.8, 1.5, 2.8), V(1.45, 2.5, -0.5));
    gathenLaughing = true;
    camMove(V(0.9, 1.6, 2.4), V(1.45, 2.55, -0.5), 5, easeInOut);
    await say(GATHEN, 'You got a body, doesn\u2019t mean you can match us!');
    laughTarget = 1; audio.setCrowd(0.5);
    await say(CROWD, 'Ha ha ha ha ha!');

    // pull back over the laughing crowd
    camMove(V(-8, 4, 13), V(0, 1.5, 0), 5, easeInOut);
    await tl.wait(3.5);
    ui.setFade(true, 2);
    audio.setCrowd(0);
    await tl.wait(2.2);
    gathenLaughing = false;
    ui.showEnd('END OF PART 1  \u00b7  Press R to replay');
    if (onEnd) onEnd();
  }

  function start() { run(); }

  function dispose() {
    alive = false;
    tl.clear();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
  }

  return { scene, update, start, dispose };
}
