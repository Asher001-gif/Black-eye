// Simple Web Audio: city hum, crowd murmur, charge/zap/crash effects (no files needed).
let ctx = null, master = null, crowdGain = null;

function noiseBuffer(sec) {
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function loopNoise(filterType, freq, q, gainValue) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(2);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = gainValue;
  src.connect(f); f.connect(g); g.connect(master);
  src.start();
  return g;
}

export function init() {
  if (ctx) { ctx.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    ctx.resume();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    loopNoise('lowpass', 140, 0.7, 0.22);          // city hum
    crowdGain = loopNoise('bandpass', 650, 0.6, 0.0); // crowd murmur
  } catch (e) { ctx = null; }
}

export function setCrowd(level) {
  if (ctx && crowdGain) crowdGain.gain.setTargetAtTime(level, ctx.currentTime, 0.25);
}

function burst(sec, type, freq, vol) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(sec);
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sec);
  src.connect(f); f.connect(g); g.connect(master); src.start();
}

export function charge() {
  if (!ctx) return;
  const o = ctx.createOscillator(); o.type = 'sine';
  const g = ctx.createGain();
  o.frequency.setValueAtTime(110, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.9);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.85);
  g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 1.05);
}

export function zap() {
  if (!ctx) return;
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  const g = ctx.createGain();
  o.frequency.setValueAtTime(1100, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.5);
  burst(0.5, 'highpass', 2500, 0.35);
}

export function crash() {
  if (!ctx) return;
  burst(0.8, 'lowpass', 900, 0.5);
}

export function stopAll() {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
}
