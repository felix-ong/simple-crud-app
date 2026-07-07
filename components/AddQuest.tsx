"use client";

import { useState } from "react";
import { PRIORITIES, XP_BY_PRIORITY, type Priority } from "@/lib/leveling";

const LABELS: Record<Priority, string> = {
  low: "Minor",
  normal: "Standard",
  high: "Epic",
};

export default function AddQuest({
  onAdd,
  disabled,
}: {
  onAdd: (title: string, priority: Priority) => void;
  disabled?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    onAdd(clean, priority);
    setTitle("");
  }

  return (
    <form className="add-quest" onSubmit={submit}>
      <div className="add-quest__row">
        <span className="add-quest__rune" aria-hidden>
          ✦
        </span>
        <input
          className="add-quest__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Inscribe a new quest…"
          maxLength={200}
          aria-label="New quest"
          autoComplete="off"
        />
        <button
          className="add-quest__submit"
          type="submit"
          disabled={disabled || !title.trim()}
        >
          Add
        </button>
      </div>
      <div className="priority-picker" role="radiogroup" aria-label="Reward tier">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={priority === p}
            className={`priority-picker__opt priority-picker__opt--${p} ${
              priority === p ? "is-active" : ""
            }`}
            onClick={() => setPriority(p)}
          >
            {LABELS[p]}
            <span className="priority-picker__xp">✦{XP_BY_PRIORITY[p]}</span>
          </button>
        ))}
      </div>
    </form>
  );
}
