"use client";

import { useCallback, useEffect, useState } from "react";
import type { Quest, PlayerStats } from "@/lib/schema";
import { levelFromXp, XP_BY_PRIORITY, type Priority } from "@/lib/leveling";
import { addQuest, deleteQuest, editQuest, toggleQuest } from "@/app/actions";
import { burstFromElement, levelUpBurst, prefersReducedMotion } from "@/lib/reward";
import { playComplete, playLevelUp, playUncheck } from "@/lib/sound";
import StatusBar from "./StatusBar";
import AddQuest from "./AddQuest";
import QuestItem from "./QuestItem";
import SoundToggle from "./SoundToggle";

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function completedTime(q: Quest): number {
  return q.completedAt ? new Date(q.completedAt).getTime() : 0;
}

// How long a freshly-completed quest lingers in the active list so its seal
// animation can play before it settles into the "Cleared" section.
const SETTLE_MS = 750;

export default function QuestLog({
  initialQuests,
  initialStats,
}: {
  initialQuests: Quest[];
  initialStats: PlayerStats;
}) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [stats, setStats] = useState<PlayerStats>(initialStats);
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [settling, setSettling] = useState<Set<number>>(new Set());
  const [showCleared, setShowCleared] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3200);
    return () => clearTimeout(t);
  }, [error]);

  const setBusyFor = useCallback((id: number, on: boolean) => {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleAdd = useCallback((title: string, priority: Priority) => {
    const tempId = -Date.now();
    const optimistic: Quest = {
      id: tempId,
      title,
      priority,
      xp: XP_BY_PRIORITY[priority],
      completed: false,
      completedAt: null,
      createdAt: new Date(),
    };
    setQuests((qs) => [...qs, optimistic]);
    addQuest(title, priority)
      .then((saved) => setQuests((qs) => qs.map((q) => (q.id === tempId ? saved : q))))
      .catch(() => {
        setQuests((qs) => qs.filter((q) => q.id !== tempId));
        setError("Couldn't add that quest. Try again.");
      });
  }, []);

  const handleToggle = useCallback(
    (quest: Quest, next: boolean, checkbox: HTMLElement | null) => {
      if (busy.has(quest.id)) return;
      const prevQuests = quests;
      const prevStats = stats;
      const beforeLevel = levelFromXp(stats.totalXp).level;
      const optimisticTotal = next
        ? stats.totalXp + quest.xp
        : Math.max(0, stats.totalXp - quest.xp);

      // Optimistic UI: flip the quest and move XP immediately.
      setQuests((qs) =>
        qs.map((q) =>
          q.id === quest.id
            ? { ...q, completed: next, completedAt: next ? new Date() : null }
            : q
        )
      );
      setStats((s) => ({ ...s, totalXp: optimisticTotal }));

      if (next) {
        burstFromElement(checkbox);
        playComplete();
        if (levelFromXp(optimisticTotal).level > beforeLevel) {
          levelUpBurst();
          playLevelUp();
        }
        // Let the seal play in place, then let it settle into "Cleared".
        const delay = prefersReducedMotion() ? 0 : SETTLE_MS;
        setSettling((prev) => new Set(prev).add(quest.id));
        window.setTimeout(() => {
          setSettling((prev) => {
            const nextSet = new Set(prev);
            nextSet.delete(quest.id);
            return nextSet;
          });
        }, delay);
      } else {
        playUncheck();
        setSettling((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(quest.id);
          return nextSet;
        });
      }

      setBusyFor(quest.id, true);
      toggleQuest(quest.id, next, todayLocal())
        .then((res) => {
          setStats(res.stats); // authoritative XP + streak
        })
        .catch(() => {
          setQuests(prevQuests);
          setStats(prevStats);
          setError("Couldn't save that. Check your connection and try again.");
        })
        .finally(() => setBusyFor(quest.id, false));
    },
    [busy, quests, stats, setBusyFor]
  );

  const handleEdit = useCallback(
    (id: number, title: string, priority: Priority) => {
      const prevQuests = quests;
      setQuests((qs) =>
        qs.map((q) =>
          q.id === id
            ? { ...q, title, priority, xp: q.completed ? q.xp : XP_BY_PRIORITY[priority] }
            : q
        )
      );
      editQuest(id, title, priority)
        .then((saved) => setQuests((qs) => qs.map((q) => (q.id === id ? saved : q))))
        .catch(() => {
          setQuests(prevQuests);
          setError("Couldn't save your changes.");
        });
    },
    [quests]
  );

  const handleDelete = useCallback(
    (id: number) => {
      const prevQuests = quests;
      setQuests((qs) => qs.filter((q) => q.id !== id));
      deleteQuest(id).catch(() => {
        setQuests(prevQuests);
        setError("Couldn't remove that quest.");
      });
    },
    [quests]
  );

  const active = quests
    .filter((q) => !q.completed || settling.has(q.id))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const cleared = quests
    .filter((q) => q.completed && !settling.has(q.id))
    .sort((a, b) => completedTime(b) - completedTime(a));

  const totalCount = quests.length;
  const clearedCount = quests.filter((q) => q.completed).length;

  return (
    <section className="questlog" aria-label="Quest log">
      <div className="panel">
        <header className="masthead">
          <div className="wordmark">
            <span className="wordmark__crest" aria-hidden>
              ❖
            </span>
            <span className="wordmark__text">Quest&nbsp;Log</span>
          </div>
          <SoundToggle />
        </header>

        <StatusBar stats={stats} />

        <div className="panel__body">
          <AddQuest onAdd={handleAdd} />

          <div className="tally" aria-live="polite">
            {totalCount === 0
              ? "Your log is empty."
              : `${clearedCount} of ${totalCount} quests cleared`}
          </div>

          {active.length > 0 ? (
            <ul className="quests" aria-label="Active quests">
              {active.map((q) => (
                <QuestItem
                  key={q.id}
                  quest={q}
                  disabled={busy.has(q.id)}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          ) : (
            <p className="empty">
              {totalCount === 0
                ? "Inscribe your first quest above. Every one you clear earns XP."
                : "All quests cleared. The realm is at peace — for now."}
            </p>
          )}

          {cleared.length > 0 && (
            <div className="cleared">
              <button
                type="button"
                className="cleared__toggle"
                aria-expanded={showCleared}
                onClick={() => setShowCleared((v) => !v)}
              >
                <span className={`cleared__chevron ${showCleared ? "is-open" : ""}`} aria-hidden>
                  ▸
                </span>
                Cleared ({cleared.length})
              </button>
              {showCleared && (
                <ul className="quests quests--cleared" aria-label="Cleared quests">
                  {cleared.map((q) => (
                    <QuestItem
                      key={q.id}
                      quest={q}
                      disabled={busy.has(q.id)}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="footnote">Complete quests · earn XP · level up · keep the streak alive</p>

      <div className={`toast ${error ? "is-shown" : ""}`} role="status" aria-live="assertive">
        {error}
      </div>
    </section>
  );
}
