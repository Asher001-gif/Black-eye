// Voice using the browser's built-in speech (Web Speech API). Falls back to silence.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let enabled = true;
let voices = [];
let cancelCurrent = null;

function loadVoices() { if (synth) voices = synth.getVoices() || []; }
if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

function pickVoice() {
  const en = voices.filter((v) => /^en/i.test(v.lang));
  return en.find((v) => v.localService) || en[0] || null;
}

export function isEnabled() { return enabled; }
export function setEnabled(v) { enabled = v; if (!v) cancel(); }
export function toggle() { setEnabled(!enabled); return enabled; }
export function supported() { return !!synth; }

export function speak(text, opts) {
  const o = opts || {};
  return new Promise((resolve) => {
    if (!synth || !enabled) { resolve(); return; }
    let done = false;
    let timer = null;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (cancelCurrent === finish) cancelCurrent = null;
      resolve();
    };
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.pitch = o.pitch || 1;
      u.rate = o.rate || 1;
      u.volume = o.volume === undefined ? 1 : o.volume;
      u.onend = finish;
      u.onerror = finish;
      timer = setTimeout(finish, 3000 + text.length * 130);
      cancelCurrent = finish;
      synth.speak(u);
    } catch (e) { finish(); }
  });
}

export function cancel() {
  try { if (synth) synth.cancel(); } catch (e) {}
  if (cancelCurrent) cancelCurrent();
}
