// Pure timing helpers. Every animated value in the loop is a function of the
// loop time t in [0, LOOP), so the scene can be rendered at any frame
// without replaying history and t = 0 and t = LOOP look identical.

export const LOOP = 12;
export const TAU = Math.PI * 2;

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, k) => a + (b - a) * k;

/** Normalised progress of t through the window [start, end]. */
export const seg = (t, start, end) => clamp01((t - start) / (end - start));

export const easeInCubic = (x) => x * x * x;
export const easeOutCubic = (x) => 1 - (1 - x) ** 3;
export const easeInOutCubic = (x) =>
  x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;

export const easeOutBack = (x, overshoot = 1.4) => {
  const c3 = overshoot + 1;
  return 1 + c3 * (x - 1) ** 3 + overshoot * (x - 1) ** 2;
};

export const easeInBack = (x, overshoot = 1.4) =>
  (overshoot + 1) * x * x * x - overshoot * x * x;

/** Damped spring settle: 0 -> 1 with one soft overshoot, the "magnetic" lock. */
export const easeOutElastic = (x) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-6.5 * x) * Math.cos(x * TAU * 1.15);
};

/** A 0 -> 1 -> 0 hump, used for particles that must vanish at both ends. */
export const hump = (x) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));

/** Loop-periodic oscillation: `cycles` must be an integer to stay seamless. */
export const wave = (t, cycles, phase = 0) =>
  Math.sin((TAU * cycles * t) / LOOP + phase);

/** Deterministic PRNG so every render of frame N is identical. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let r = Math.imul(state ^ (state >>> 15), 1 | state);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
