import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

/** A quest's priority determines how much XP completing it awards. */
export const priorityEnum = pgEnum("priority", ["low", "normal", "high"]);

/** One row per todo ("quest"). */
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: priorityEnum("priority").notNull().default("normal"),
  // XP is snapshotted at creation from the priority, so changing the XP curve
  // later never rewrites history and refunds always match what was awarded.
  xp: integer("xp").notNull().default(20),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Single-row table (id = 1) holding the one shared player's progress.
 * Level and XP-into-level are NOT stored — they are derived from totalXp via
 * lib/leveling.ts so the server and client can never drift out of sync.
 */
export const playerStats = pgTable("player_stats", {
  id: integer("id").primaryKey(),
  totalXp: integer("total_xp").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  // 'YYYY-MM-DD' in the player's local timezone (passed from the client).
  lastCompletedDate: date("last_completed_date"),
});

export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;
export type PlayerStats = typeof playerStats.$inferSelect;
