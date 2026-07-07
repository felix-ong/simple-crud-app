// The single source of truth for XP, levels, and streaks. Imported by both the
// server (to mutate stats) and the client (to render/animate), so the two can
// never disagree about what level a given XP total represents.

export type Priority = "low" | "normal" | "high";

export const PRIORITIES: Priority[] = ["low", "normal", "high"];

/** XP awarded for completing a quest of each priority. Tune here only. */
export const XP_BY_PRIORITY: Record<Priority, number> = {
  low: 10,
  normal: 20,
  high: 40,
};

export function xpForPriority(priority: Priority): number {
  return XP_BY_PRIORITY[priority];
}

/**
 * XP required to advance FROM `level` to `level + 1`.
 * Rising curve: early levels come fast (momentum), later ones stretch.
 * L1→2 = 100, L2→3 = 200, L3→4 = 300, …
 */
export function xpToClear(level: number): number {
  return 100 * level;
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number; // XP accumulated within the current level
  xpForNext: number; // XP needed to clear the current level
  totalXp: number;
}

/** Derive the current level and progress within it from a lifetime XP total. */
export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= xpToClear(level)) {
    remaining -= xpToClear(level);
    level += 1;
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpForNext: xpToClear(level),
    totalXp: Math.max(0, Math.floor(totalXp)),
  };
}

// --- Streak logic --------------------------------------------------------

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // 'YYYY-MM-DD'
}

/** True for a well-formed 'YYYY-MM-DD' string. */
export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function shiftDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

/**
 * Advance the streak for the first completion of a calendar day.
 * - already completed today → unchanged
 * - last completion was yesterday → +1
 * - otherwise → reset to 1
 * `longestStreak` always tracks the high-water mark.
 */
export function advanceStreak(state: StreakState, today: string): StreakState {
  if (state.lastCompletedDate === today) return state;
  const continued = state.lastCompletedDate === shiftDate(today, -1);
  const currentStreak = continued ? state.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastCompletedDate: today,
  };
}
