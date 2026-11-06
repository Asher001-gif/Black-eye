import * as voice from './voice.js';

const $ = (id) => document.getElementById(id);
let skipResolve = null;

function showLine(who, text) {
  const el = $('subs');
  el.innerHTML = '';
  const n = document.createElement('span');
  n.className = 'who'; n.style.color = who.color; n.textContent = who.name;
  const t = document.createElement('span');
  t.className = 'txt'; t.textContent = text;
  el.appendChild(n); el.appendChild(t);
  el.classList.remove('hidden');
}
function hideLine() { $('subs').classList.add('hidden'); }

// One line at a time: coloured name + white text, with voice. Space skips the line.
export async function say(who, text, tl) {
  showLine(who, text);
  const minSec = 1.3 + text.length * 0.055;
  const skip = new Promise((r) => { skipResolve = r; });
  const v = voice.speak(text, who.voice);
  await Promise.race([Promise.all([v, tl.wait(minSec)]), skip]);
  skipResolve = null;
  voice.cancel();
  hideLine();
  await tl.wait(0.25);
}
export function skipLine() { if (skipResolve) skipResolve(); }

export function setFade(on, seconds) {
  const f = $('fade');
  f.style.transition = 'opacity ' + seconds + 's';
  f.classList.toggle('on', on);
}

export function flash() {
  const f = $('flash');
  f.style.transition = 'none';
  f.style.opacity = '0.9';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    f.style.transition = 'opacity .6s';
    f.style.opacity = '0';
  }));
}

export async function showLocation(text, tl, hold) {
  const el = $('location');
  el.textContent = text;
  el.classList.add('show');
  await tl.wait(hold || 3);
  el.classList.remove('show');
}

export function setHint(text) { $('status').textContent = text; }
export function showEnd(text) { const e = $('end'); e.textContent = text; e.classList.add('show'); }
export function hideEnd() { $('end').classList.remove('show'); }
