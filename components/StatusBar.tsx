"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerStats } from "@/lib/schema";
import { levelFromXp } from "@/lib/leveling";

function pctOf(totalXp: number): number {
  const info = levelFromXp(totalXp);
  return info.xpForNext > 0 ? (info.xpIntoLevel / info.xpForNext) * 100 : 0;
}

export default function StatusBar({ stats }: { stats: PlayerStats }) {
  const info = levelFromXp(stats.totalXp);

  const [pct, setPct] = useState(() => pctOf(stats.totalXp));
  const [animateBar, setAnimateBar] = useState(true);
  const [displayLevel, setDisplayLevel] = useState(info.level);
  const [levelPulse, setLevelPulse] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(stats.totalXp);
  const [streakPulse, setStreakPulse] = useState(false);

  const prevLevel = useRef(info.level);
  const prevTotal = useRef(stats.totalXp);
  const prevStreak = useRef(stats.currentStreak);
  const runId = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Count the lifetime XP total up (it only ever grows on completion).
  useEffect(() => {
    const from = prevTotal.current;
    const to = stats.totalXp;
    prevTotal.current = to;
    if (reduced.current || to <= from) {
      setDisplayTotal(to);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const dur = 520;
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const t = Math.min(1, (now - startTs) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayTotal(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stats.totalXp]);

  // Fill the XP bar; on a level-up, overfill to 100% then reset and refill.
  useEffect(() => {
    const newInfo = levelFromXp(stats.totalXp);
    const newPct = newInfo.xpForNext > 0 ? (newInfo.xpIntoLevel / newInfo.xpForNext) * 100 : 0;
    const leveledUp = newInfo.level > prevLevel.current;
    const myRun = ++runId.current;
    prevLevel.current = newInfo.level;

    if (reduced.current || !leveledUp) {
      setAnimateBar(true);
      setPct(newPct);
      setDisplayLevel(newInfo.level);
      if (reduced.current) setAnimateBar(false);
      return;
    }

    // Level-up choreography.
    setAnimateBar(true);
    setPct(100);
    const t = setTimeout(() => {
      if (runId.current !== myRun) return;
      setDisplayLevel(newInfo.level);
      setLevelPulse(true);
      setAnimateBar(false);
      setPct(0);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (runId.current !== myRun) return;
          setAnimateBar(true);
          setPct(newPct);
        })
      );
      window.setTimeout(() => {
        if (runId.current === myRun) setLevelPulse(false);
      }, 750);
    }, 430);
    return () => clearTimeout(t);
  }, [stats.totalXp]);

  // Pulse the flame when the streak grows.
  useEffect(() => {
    if (stats.currentStreak > prevStreak.current) {
      setStreakPulse(true);
      const t = setTimeout(() => setStreakPulse(false), 850);
      prevStreak.current = stats.currentStreak;
      return () => clearTimeout(t);
    }
    prevStreak.current = stats.currentStreak;
  }, [stats.currentStreak]);

  return (
    <div className="status">
      <div className="status__top">
        <div className={`level ${levelPulse ? "is-up" : ""}`}>
          <span className="level__label">Level</span>
          <span className="level__num">{displayLevel}</span>
        </div>
        <div
          className={`streak ${stats.currentStreak > 0 ? "is-active" : ""} ${
            streakPulse ? "is-up" : ""
          }`}
          title={`Longest streak: ${stats.longestStreak} day${stats.longestStreak === 1 ? "" : "s"}`}
        >
          <span className="streak__flame" aria-hidden>
            🔥
          </span>
          <span className="streak__num">{stats.currentStreak}</span>
          <span className="streak__label">
            day{stats.currentStreak === 1 ? "" : "s"} streak
          </span>
        </div>
      </div>

      <div
        className="xpbar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={info.xpForNext}
        aria-valuenow={info.xpIntoLevel}
        aria-label={`${info.xpIntoLevel} of ${info.xpForNext} XP toward level ${info.level + 1}`}
      >
        <div
          className="xpbar__fill"
          style={{ width: `${pct}%`, transition: animateBar ? undefined : "none" }}
        >
          <span className="xpbar__spark" aria-hidden />
        </div>
      </div>

      <div className="status__meta">
        <span className="status__into">
          {info.xpIntoLevel} / {info.xpForNext} XP
        </span>
        <span className="status__total">
          <b>{displayTotal.toLocaleString()}</b> total XP
        </span>
      </div>
    </div>
  );
}
