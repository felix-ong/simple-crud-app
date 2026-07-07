import confetti from "canvas-confetti";

// Palette-matched particle bursts for the completion reward moment.
const GOLD = ["#E8B24C", "#FFD37A", "#F4E3B0", "#C9922E"];
const MAGIC = ["#8A6BFF", "#B9A6FF", "#E8B24C", "#FFD37A"];

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function originOf(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  };
}

/** A small shower of gold dust from a just-sealed quest's checkbox. */
export function burstFromElement(el: Element | null) {
  if (!el || prefersReducedMotion()) return;
  confetti({
    particleCount: 34,
    spread: 58,
    startVelocity: 26,
    gravity: 0.9,
    scalar: 0.82,
    ticks: 90,
    colors: GOLD,
    origin: originOf(el),
    disableForReducedMotion: true,
  });
}

/** A bigger amethyst-and-gold flourish when the player levels up. */
export function levelUpBurst() {
  if (prefersReducedMotion()) return;
  const shared = {
    origin: { x: 0.5, y: 0.4 },
    colors: MAGIC,
    disableForReducedMotion: true,
  };
  confetti({ ...shared, particleCount: 90, spread: 105, startVelocity: 45, scalar: 1.05, ticks: 150 });
  confetti({ ...shared, particleCount: 45, spread: 150, startVelocity: 24, scalar: 0.7, ticks: 130 });
}
