"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quests, playerStats, type Quest, type PlayerStats } from "@/lib/schema";
import {
  advanceStreak,
  isIsoDate,
  levelFromXp,
  PRIORITIES,
  xpForPriority,
  type Priority,
} from "@/lib/leveling";

function normalizeTitle(raw: string): string {
  const clean = raw.trim();
  if (!clean) throw new Error("A quest needs a name.");
  return clean.slice(0, 200);
}

function normalizePriority(raw: string): Priority {
  return (PRIORITIES as string[]).includes(raw) ? (raw as Priority) : "normal";
}

/** Read all quests, oldest first. The client splits open vs. completed. */
export async function getQuests(): Promise<Quest[]> {
  return db().select().from(quests).orderBy(asc(quests.createdAt));
}

/** Read the single shared stats row, creating it on first access. */
export async function getStats(): Promise<PlayerStats> {
  const existing = await db()
    .select()
    .from(playerStats)
    .where(eq(playerStats.id, 1))
    .limit(1);
  if (existing.length > 0) return existing[0];

  const inserted = await db()
    .insert(playerStats)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();
  if (inserted.length > 0) return inserted[0];

  // Lost a race to create the row — read the winner's version.
  const again = await db()
    .select()
    .from(playerStats)
    .where(eq(playerStats.id, 1))
    .limit(1);
  return again[0];
}

export async function addQuest(title: string, priority: string): Promise<Quest> {
  const p = normalizePriority(priority);
  const [row] = await db()
    .insert(quests)
    .values({ title: normalizeTitle(title), priority: p, xp: xpForPriority(p) })
    .returning();
  revalidatePath("/");
  return row;
}

export interface ToggleResult {
  stats: PlayerStats;
  awardedXp: number; // + when completing, - when un-completing, 0 on no-op
  leveledUp: boolean;
}

/**
 * Complete or re-open a quest, applying XP and streak changes, and return the
 * fresh stats so the client can animate to the new values.
 */
export async function toggleQuest(
  id: number,
  nextCompleted: boolean,
  clientDate: string
): Promise<ToggleResult> {
  const [quest] = await db().select().from(quests).where(eq(quests.id, id)).limit(1);
  if (!quest) throw new Error("Quest not found.");

  const stats = await getStats();
  if (quest.completed === nextCompleted) {
    return { stats, awardedXp: 0, leveledUp: false };
  }

  const beforeLevel = levelFromXp(stats.totalXp).level;

  await db()
    .update(quests)
    .set({ completed: nextCompleted, completedAt: nextCompleted ? new Date() : null })
    .where(eq(quests.id, id));

  let totalXp = stats.totalXp;
  let streak = {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastCompletedDate: stats.lastCompletedDate,
  };

  if (nextCompleted) {
    totalXp += quest.xp;
    // Streak advances on the first completion of the player's local day.
    if (isIsoDate(clientDate)) streak = advanceStreak(streak, clientDate);
  } else {
    // Refund exactly what this quest awarded; never go negative.
    totalXp = Math.max(0, totalXp - quest.xp);
    // Streak is intentionally left intact on un-complete.
  }

  const [updated] = await db()
    .update(playerStats)
    .set({
      totalXp,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastCompletedDate: streak.lastCompletedDate,
    })
    .where(eq(playerStats.id, 1))
    .returning();

  revalidatePath("/");

  return {
    stats: updated,
    awardedXp: nextCompleted ? quest.xp : -quest.xp,
    leveledUp: levelFromXp(totalXp).level > beforeLevel,
  };
}

export async function editQuest(
  id: number,
  title: string,
  priority: string
): Promise<Quest> {
  const [existing] = await db().select().from(quests).where(eq(quests.id, id)).limit(1);
  if (!existing) throw new Error("Quest not found.");

  const p = normalizePriority(priority);
  const [row] = await db()
    .update(quests)
    .set({
      title: normalizeTitle(title),
      priority: p,
      // Only re-price open quests. A completed quest keeps the XP it already
      // paid out, so its refund on un-complete always matches.
      xp: existing.completed ? existing.xp : xpForPriority(p),
    })
    .where(eq(quests.id, id))
    .returning();
  revalidatePath("/");
  return row;
}

/** Remove a quest. Earned XP from a completed quest stays — progress is kept. */
export async function deleteQuest(id: number): Promise<void> {
  await db().delete(quests).where(eq(quests.id, id));
  revalidatePath("/");
}
