import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import jackUrl from '../assets/jack.fbx?url';

// Jack = the model used for Gathen. Mixamo skeleton, faces +Z, right hand on the -X side.
// The FBX only holds a one-frame T-pose clip, so all movement is done by posing bones in code.
//
// Poses are plain objects: { RightArm: [x, y, z], ... } in DEGREES.
// The angles are in the character's own rest-pose space (x = his left, y = up, z = forward),
// applied as Rz first, then Ry, then Rx. Examples (right arm hangs down at rest):
//   RightArm [-90, 0, 0]  -> arm swings forward to horizontal
//   RightArm [-180, 0, 0] -> arm straight up
//   Spine1   [10, 0, 0]   -> leans forward;   Spine1 [0, 20, 0] -> twists toward his left
const DEG = Math.PI / 180;
const _q = new THREE.Quaternion();
const _e = new THREE.Euler(0, 0, 0, 'XYZ');
const _v = new THREE.Vector3();

export function poseMix(a, b, k) {
  const out = {};
  const names = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const n of names) {
    const p = (a && a[n]) || [0, 0, 0];
    const q = (b && b[n]) || [0, 0, 0];
    out[n] = [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
  }
  return out;
}

export function poseAdd(a, b) {
  const out = {};
  for (const n of Object.keys(a || {})) out[n] = a[n].slice();
  for (const n of Object.keys(b || {})) {
    const o = out[n] || [0, 0, 0];
    out[n] = [o[0] + b[n][0], o[1] + b[n][1], o[2] + b[n][2]];
  }
  return out;
}

export function loadJack({ height = 2.0 } = {}) {
  return new Promise((resolve, reject) => {
    new FBXLoader().load(jackUrl, (fbx) => {
      try { resolve(buildJack(fbx, height)); } catch (err) { reject(err); }
    }, undefined, reject);
  });
}

function buildJack(fbx, height) {
  const root = new THREE.Group(); // put this in the scene
  root.add(fbx);
  root.updateMatrixWorld(true);

  const B = {};
  fbx.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      // Scene lighting is dark; let his own texture glow a little so he reads on stage
      for (const m of [].concat(o.material)) {
        if (m && m.map && m.emissive) { m.emissive.set(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = 0.45; }
      }
    }
    if (o.isBone) {
      const key = o.name.replace(/^mixamorig:?/, '');
      const parentQ = new THREE.Quaternion();
      if (o.parent) o.parent.getWorldQuaternion(parentQ);
      B[key] = { node: o, L: o.quaternion.clone(), P: parentQ, invP: parentQ.clone().invert() };
    }
  });
  for (const k of ['Hips', 'Spine1', 'Spine2', 'Head', 'RightArm', 'RightForeArm', 'RightHand']) {
    if (!B[k]) throw new Error('Jack: missing bone ' + k);
  }

  // scale so the head top is `height` tall (the file is in millimetres)
  const top = B.HeadTop_End ? B.HeadTop_End.node : B.Head.node;
  top.getWorldPosition(_v);
  const s = height / _v.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);

  function setPose(pose) {
    pose = pose || {};
    for (const name in B) {
      const b = B[name], d = pose[name];
      if (!d) { b.node.quaternion.copy(b.L); continue; }
      _q.setFromEuler(_e.set(d[0] * DEG, d[1] * DEG, d[2] * DEG, 'XYZ'));
      b.node.quaternion.copy(b.invP).multiply(_q).multiply(b.P).multiply(b.L);
    }
  }

  // ---------- sword in the right hand ----------
  const sword = new THREE.Group();
  const hiltMat = new THREE.MeshLambertMaterial({ color: 0x2a2018 });
  const goldMat = new THREE.MeshLambertMaterial({ color: 0xd9a81e });
  const steel = new THREE.MeshLambertMaterial({ color: 0x9aa0ad });
  const bladeMat = new THREE.MeshBasicMaterial({ color: 0x3a3a2a }); // glows when charged
  const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; sword.add(m); return m; };
  add(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 8), hiltMat, 0);            // grip
  add(new THREE.BoxGeometry(0.28, 0.035, 0.05), goldMat, 0.11);                   // crossguard
  add(new THREE.BoxGeometry(0.075, 1.1, 0.022), steel, 0.11 + 0.55);              // blade
  add(new THREE.BoxGeometry(0.02, 1.06, 0.03), bladeMat, 0.11 + 0.55);            // glowing core
  const tip = add(new THREE.ConeGeometry(0.0375, 0.14, 4), steel, 0.11 + 1.1 + 0.07);
  tip.rotation.y = Math.PI / 4; tip.scale.z = 0.3;

  // blade direction at rest: along the hand, tilted slightly forward (+Z)
  const a = 15 * DEG;
  const dirRest = new THREE.Vector3(-0.08, -Math.cos(a), Math.sin(a)).normalize();
  const hand = B.RightHand;
  const handWorldRest = new THREE.Quaternion();
  hand.node.getWorldQuaternion(handWorldRest);
  const bladeQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirRest);
  sword.quaternion.copy(handWorldRest).invert().multiply(bladeQ);
  const hs = new THREE.Vector3();
  hand.node.getWorldScale(hs);
  sword.scale.setScalar(1 / hs.x);                 // sword is modelled in metres
  // fist is a little past the wrist, along the hand
  const local = dirRest.clone().applyQuaternion(handWorldRest.clone().invert()).multiplyScalar(0.075 / hs.x);
  sword.position.copy(local);
  hand.node.add(sword);

  // finger curl around the grip (add this to a pose to close the hand)
  const GRIP = {};
  for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) {
    GRIP['RightHand' + f + '1'] = [0, 0, 70];
    GRIP['RightHand' + f + '2'] = [0, 0, 80];
    GRIP['RightHand' + f + '3'] = [0, 0, 60];
  }
  GRIP.RightHandThumb1 = [0, 0, 25];
  GRIP.RightHandThumb2 = [0, 0, 35];

  function setBladeGlow(on) { bladeMat.color.setHex(on ? 0xfff2a0 : 0x3a3a2a); }

  return { root, bones: B, setPose, setBladeGlow, bladeMat, sword, GRIP };
}
