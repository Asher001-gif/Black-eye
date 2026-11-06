// Tiny promise-based timeline: await tl.wait(2), await tl.tween(1, k => ...)
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeIn = (k) => k * k;
export const easeOut = (k) => 1 - (1 - k) * (1 - k);
export const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
export const linear = (k) => k;

export class Timeline {
  constructor() { this.items = []; }
  wait(sec) {
    return new Promise((res) => this.items.push({ left: sec, res }));
  }
  tween(sec, fn, ease = easeInOut) {
    return new Promise((res) => this.items.push({ dur: sec, el: 0, fn, ease, res }));
  }
  clear() { this.items.length = 0; }
  update(dt) {
    const list = this.items.slice();
    for (const it of list) {
      if (it.dur !== undefined) {
        it.el += dt;
        const k = Math.min(1, it.el / it.dur);
        it.fn(it.ease(k));
        if (k >= 1) { this.remove(it); it.res(); }
      } else {
        it.left -= dt;
        if (it.left <= 0) { this.remove(it); it.res(); }
      }
    }
  }
  remove(it) {
    const i = this.items.indexOf(it);
    if (i >= 0) this.items.splice(i, 1);
  }
}
