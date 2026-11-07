import * as THREE from 'three';
import { Timeline, lerp, easeIn, easeOut, easeInOut } from '../core/timeline.js';
import { loadGathen, poseMix, poseAdd } from '../characters/gathen.js';

// ---- Characters (edit names, colours and voices here) ----
const GATHEN = { name: 'Fedreck Gathen', color: '#ffd23f', voice: { pitch: 0.5, rate: 0.85 } };
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

  // ---------- Fedreck Gathen (posed bone by bone) ----------
  const gathen = new THREE.Group();
  gathen.position.set(1.45, STAGE_Y, -0.5);
  const FACE_YAW = -Math.PI / 2 + 0.3; // faces the robot (robot is at the origin)
  gathen.rotation.y = FACE_YAW;
  const GFWD = new THREE.Vector3(Math.sin(FACE_YAW), 0, Math.cos(FACE_YAW));   // where he faces
  const GLEFT = new THREE.Vector3(Math.cos(FACE_YAW), 0, -Math.sin(FACE_YAW)); // his left
  scene.add(gathen);
  let gathenModel = null;
  let GRIP = {};
  const gathenReady = loadGathen({ height: 2.0 })
    .then((j) => { gathenModel = j; GRIP = j.GRIP; gathen.add(j.root); })
    .catch((err) => console.error('Could not load Gathen model', err));

  // Poses in degrees, see src/characters/gathen.js for the axes.
  // The model's rest pose is an A-pose (arms ~50deg out). On the RIGHT arm +Z brings it in toward
  // the body, on the LEFT arm -Z does. ~25deg of that = arm hanging nearly straight, a little out.
  // He is a disciplined commander: upright, chest out, chin up, sword held at the ready, left arm
  // calm at his side (it never swings out any more, that was the T-pose).
  const IDLE = {
    Head: [-3, 0, 0], Spine1: [-1, 0, 0], Spine2: [-3, 0, 0],
    RightArm: [-8, 0, 26], RightForeArm: [-40, 0, 0],
    LeftArm: [0, 0, -24], LeftForeArm: [-12, 0, 0]
  };
  const RAISE = { // sword up over the shoulder, left arm stays tight at his side
    Hips: [0, -5, 0], Spine1: [-6, -12, 0], Spine2: [-6, -12, 0],
    Head: [-6, 4, 0],
    RightArm: [-165, 0, 0], RightForeArm: [25, 0, 0],
    LeftArm: [0, 0, -30], LeftForeArm: [-20, 0, 0]
  };
  const SLASH = { // chop forward through the robot (body twist trimmed now he faces the robot)
    Hips: [0, 4, 0], Spine1: [14, 8, 0], Spine2: [10, 8, 0],
    Head: [14, -4, 0],
    RightArm: [-70, 0, 0], RightForeArm: [-5, 0, 0],
    LeftArm: [-18, 0, -36], LeftForeArm: [-15, 0, 0] // leaning torso, so the arm is tilted back to stay hanging
  };
  const sw = { raise: 0, slash: 0 };
  // performance layers on top of the strike poses
  //   look  : head down, reading the wreck       turn : head/shoulders turn to address the crowd
  //   speak : talking cadence (nods, chest up)   jab  : hard emphasis nod on a key word
  //   laugh : cold, controlled chuckle
  const gs = { look: 0, turn: 0, speak: 0, speakEnv: 0, jab: 0, laugh: 0 };

  function updateGathen(dt) {
    if (!gathenModel) return;
    gs.speakEnv += (gs.speak - gs.speakEnv) * Math.min(1, dt * 9);
    let p = poseMix(poseMix(IDLE, RAISE, sw.raise), SLASH, sw.slash);
    p = poseAdd(p, GRIP);
    p = poseAdd(p, { Spine2: [Math.sin(t * 1.2) * 0.8, 0, 0] }); // slow, steady breathing

    // reading the wreck, then lifting his chin and turning to the crowd
    p = poseAdd(p, {
      Head: [16 * gs.look - 2 * gs.turn, 24 * gs.turn, 0],
      Spine1: [4 * gs.look, 5 * gs.turn, 0],
      Spine2: [2 * gs.look, 6 * gs.turn, 0]
    });

    // talking: no jaw in this model, so he talks with the head, neck and chest instead:
    // a dip on each syllable, a slow steady scan, chest up, plus a hard jab on the key word
    const e = gs.speakEnv;
    if (e > 0.01) {
      const syl = Math.pow(Math.abs(Math.sin(t * 4.4 + Math.sin(t * 1.7) * 1.5)), 1.5);
      p = poseAdd(p, {
        Head: [syl * 3.2 * e - 2 * e, Math.sin(t * 1.9) * 2.5 * e, Math.sin(t * 2.7) * 1.2 * e],
        Spine2: [-2 * e + syl * 0.8 * e, 0, 0]
      });
    }
    if (gs.jab > 0.001) p = poseAdd(p, { Head: [9 * gs.jab, 0, 0], Spine1: [5 * gs.jab, 0, 0], Spine2: [3 * gs.jab, 0, 0] });

    // cold chuckle: chin up, little controlled bursts, no hopping
    if (gs.laugh > 0.01) {
      const burst = Math.max(0, Math.sin(t * 2.6));
      const s = Math.sin(t * 10) * burst;
      p = poseAdd(p, {
        Head: [-9 * gs.laugh + s * 2.2 * gs.laugh, 0, 0],
        Spine1: [-2 * gs.laugh + s * 1.0 * gs.laugh, 0, 0],
        Spine2: [s * 1.4 * gs.laugh, 0, 0]
      });
    }
    gathen.position.y = STAGE_Y;
    gathenModel.setPose(p);
    gathenModel.root.position.z = 0.25 * sw.slash; // small lunge into the strike
  }

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
  function setFov(f) { if (camera.fov !== f) { camera.fov = f; camera.updateProjectionMatrix(); } }
  // A "shot" is a camera that is recomputed every frame from his head position, so close-ups
  // stay locked on his face while he talks. shot.st = seconds since the shot started.
  let shot = null;
  function setShot(fn) { shot = { st: 0, fn }; }
  function clearShot() { shot = null; }
  const _fc = new THREE.Vector3();
  function faceCenter(out) { // middle of his face, in world space
    gathenModel.bones.Head.node.getWorldPosition(out);
    out.y += 0.14; out.addScaledVector(GFWD, 0.08);
    return out;
  }
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const SHOTS = {
    // low hero angle: he stands tall over the wreckage
    hero: (st) => {
      setFov(48); faceCenter(look);
      const d = 2.4 - 0.25 * clamp01(st / 4);
      base.set(gathen.position.x + GFWD.x * d + GLEFT.x * 0.9, STAGE_Y + 0.45, gathen.position.z + GFWD.z * d + GLEFT.z * 0.9);
      look.y -= 0.5;
    },
    // tight on his face from the front, slow push in
    faceFront: (st) => {
      setFov(30); faceCenter(look);
      const d = 0.95 - 0.15 * clamp01(st / 2);
      base.copy(look).addScaledVector(GFWD, d).addScaledVector(GLEFT, 0.14); base.y -= 0.05;
    },
    // side profile from his left, shows the jaw and chin work
    faceSide: (st) => {
      setFov(30); faceCenter(look);
      base.copy(look).addScaledVector(GLEFT, 0.95 - 0.08 * clamp01(st / 2)).addScaledVector(GFWD, 0.15);
      look.addScaledVector(GFWD, 0.04);
    },
    // extreme close-up for the last word
    faceTight: (st) => {
      setFov(26); faceCenter(look);
      const d = 0.8 - 0.12 * clamp01(st / 1.5);
      base.copy(look).addScaledVector(GFWD, d).addScaledVector(GLEFT, -0.08); base.y -= 0.03;
    },
    // slow push on the cold laugh, from low three-quarter
    laugh: (st) => {
      setFov(40); faceCenter(look);
      const d = 1.8 - 0.5 * clamp01(st / 5);
      base.copy(look).addScaledVector(GFWD, d).addScaledVector(GLEFT, 0.5); base.y -= 0.25;
    }
  };
  function camMove(p, l, dur, ease) {
    clearShot();
    const p0 = base.clone(), l0 = look.clone(), f0 = camera.fov;
    return tl.tween(dur, (k) => { base.lerpVectors(p0, p, k); look.lerpVectors(l0, l, k); setFov(lerp(f0, 55, k)); }, ease || easeInOut);
  }
  function cut(p, l) { clearShot(); setFov(55); base.copy(p); look.copy(l); }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- state flags for animation ----------
  let struck = false, alert = 0;

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
    updateGathen(dt);
    if (shot) { shot.st += dt; shot.fn(shot.st); } // tracked shots follow his face (after his pose is set)
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
  // a Gathen line: subtitle + voice, with his talking cadence on while it plays
  async function gsay(text) {
    gs.speak = 1;
    await say(GATHEN, text);
    gs.speak = 0;
  }

  async function strike() {
    if (gathenModel) gathenModel.setBladeGlow(true);
    audio.charge();
    await tl.tween(0.9, (k) => { sw.raise = k; }, easeInOut);
    await tl.wait(0.5);
    let hit = false;
    await tl.tween(0.26, (k) => {
      sw.slash = k;
      if (!hit && k > 0.55) { hit = true; onHit(); }
    }, easeIn);
    if (gathenModel) gathenModel.setBladeGlow(false);
    await tl.tween(0.8, (k) => { sw.raise = 1 - k; sw.slash = 1 - k; }, easeOut);
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
    await ui.showCard('20 YEARS AGO...', tl, 3.5);
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
    await gsay('Quiet. Let them look at him.');
    await gsay('Roy\u2019s father. The first of the machine-bodied.');

    cut(V(0.2, 2.9, 2.7), V(1.45, 2.6, -0.5));
    camMove(V(0.5, 2.8, 2.5), V(1.45, 2.6, -0.5), 5, easeInOut);
    await gsay('Once he led them. Now he kneels in Maliana.');
    laughTarget = 0.7; audio.setCrowd(0.3);
    await say(CROWD, 'Finish him! Finish him!');
    await gsay('As you wish.');

    // the strike
    cut(V(0.2, 2.4, 4.6), V(0.2, 2.0, 0));
    camMove(V(0.25, 2.3, 4.0), V(0.2, 2.0, 0), 3, easeInOut);
    laughTarget = 0.1; audio.setCrowd(0.06);
    await strike();

    // the silent beat: he holds the follow-through, reads the wreck, then lifts his chin and
    // turns to the crowd. Low hero angle so he looks like the one in command.
    if (gathenModel) {
      setShot(SHOTS.hero);
      await tl.tween(0.4, (k) => { gs.look = k; }, easeOut);
      await tl.wait(1.0);
      await tl.tween(1.0, (k) => { gs.look = 1 - k; gs.turn = k; }, easeInOut);
      await tl.wait(0.3);
    } else await tl.wait(1.8);

    // "You got a body, doesn't mean you can match us!" in four angles, cutting on the words:
    // front close-up, side profile, back to front (tighter) for the hard last word.
    const LINE = 'You got a body, doesn\u2019t mean you can match us!';
    const est = 1.3 + LINE.length * 0.055; // same estimate ui.say uses for its minimum length
    let lineDone = false;
    const lineP = gsay(LINE).then(() => { lineDone = true; });
    if (gathenModel) {
      (async () => {
        setShot(SHOTS.faceFront);                      // "You got a body,"
        await tl.wait(est * 0.32); if (lineDone) return;
        setShot(SHOTS.faceSide);                       // "doesn't mean you can"
        await tl.wait(est * 0.34); if (lineDone) return;
        setShot(SHOTS.faceTight);                      // "match us!"
        await tl.wait(est * 0.18); if (lineDone) return;
        gs.jab = 1;                                    // hard nod on the last word
        tl.tween(0.5, (k) => { gs.jab = 1 - k; }, easeOut);
      })();
    } else {
      cut(V(0.8, 1.5, 2.8), V(1.45, 2.5, -0.5));
      camMove(V(0.9, 1.6, 2.4), V(1.45, 2.55, -0.5), 5, easeInOut);
    }
    await lineP;

    // then, and only then, he laughs: a cold, controlled chuckle, not a wild one
    if (gathenModel) setShot(SHOTS.laugh);
    tl.tween(0.6, (k) => { gs.laugh = k; }, easeInOut);
    laughTarget = 1; audio.setCrowd(0.5);
    await say(CROWD, 'Ha ha ha ha ha!');

    // pull back over the laughing crowd
    camMove(V(-8, 4, 13), V(0, 1.5, 0), 5, easeInOut);
    await tl.wait(3.5);
    ui.setFade(true, 2);
    audio.setCrowd(0);
    await tl.wait(2.2);
    gs.laugh = 0;
    ui.showEnd('<b>R</b> Replay &nbsp;&nbsp;&nbsp;&nbsp; <b>E</b> Next');
    if (onEnd) onEnd();
  }

  function start() { gathenReady.then(run); }

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
