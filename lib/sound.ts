// Tiny synthesized sound effects via the Web Audio API — no asset files, and
// silent unless the player turns sound on. The AudioContext is created lazily
// on the enabling gesture so browsers don't block it.

let ctx: AudioContext | null = null;
let enabled = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (on) ensureCtx(); // warm up + resume on the user gesture
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function tone(
  ac: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "triangle",
  peak = 0.14
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

/** A bright two-note chime when a quest is completed. */
export function playComplete() {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac) return;
  tone(ac, 660, 0, 0.16, "triangle", 0.13);
  tone(ac, 988, 0.055, 0.22, "triangle", 0.11);
}

/** A short ascending fanfare on level-up. */
export function playLevelUp() {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(ac, f, i * 0.085, 0.3, "triangle", 0.12)
  );
}

/** A soft low note when a quest is re-opened. */
export function playUncheck() {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac) return;
  tone(ac, 392, 0, 0.13, "sine", 0.07);
}
