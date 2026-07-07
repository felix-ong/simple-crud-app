"use client";

import { useRef, useState } from "react";
import type { Quest } from "@/lib/schema";
import { PRIORITIES, XP_BY_PRIORITY, type Priority } from "@/lib/leveling";

const LABELS: Record<Priority, string> = {
  low: "Minor",
  normal: "Standard",
  high: "Epic",
};

export interface QuestItemProps {
  quest: Quest;
  disabled?: boolean;
  onToggle: (quest: Quest, next: boolean, checkbox: HTMLElement | null) => void;
  onEdit: (id: number, title: string, priority: Priority) => void;
  onDelete: (id: number) => void;
}

export default function QuestItem({
  quest,
  disabled,
  onToggle,
  onEdit,
  onDelete,
}: QuestItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(quest.title);
  const [priority, setPriority] = useState<Priority>(quest.priority);
  const checkRef = useRef<HTMLButtonElement>(null);

  function beginEdit() {
    setTitle(quest.title);
    setPriority(quest.priority);
    setEditing(true);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    onEdit(quest.id, clean, priority);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className={`quest quest--${quest.priority} is-editing`}>
        <form className="quest__edit" onSubmit={saveEdit}>
          <input
            className="quest__edit-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            aria-label="Edit quest name"
            autoFocus
          />
          <div className="quest__edit-row">
            <div className="priority-picker priority-picker--sm" role="radiogroup" aria-label="Reward tier">
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
                  disabled={quest.completed}
                  title={quest.completed ? "Reward locked in on a cleared quest" : `✦${XP_BY_PRIORITY[p]}`}
                >
                  {LABELS[p]}
                </button>
              ))}
            </div>
            <div className="quest__edit-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn--gold" disabled={!title.trim()}>
                Save
              </button>
            </div>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`quest quest--${quest.priority} ${quest.completed ? "is-done" : ""}`}>
      <button
        ref={checkRef}
        type="button"
        role="checkbox"
        aria-checked={quest.completed}
        aria-label={quest.completed ? "Re-open quest" : "Complete quest"}
        className="quest__check"
        disabled={disabled}
        onClick={() => onToggle(quest, !quest.completed, checkRef.current)}
      >
        <span className="quest__seal" aria-hidden>
          ✓
        </span>
      </button>

      <span className="quest__title">{quest.title}</span>

      <span className="quest__xp" aria-label={`${quest.xp} XP`}>
        ✦{quest.xp}
      </span>

      <div className="quest__actions">
        <button
          type="button"
          className="quest__act"
          onClick={beginEdit}
          disabled={disabled}
          aria-label="Edit quest"
          title="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          className="quest__act quest__act--danger"
          onClick={() => onDelete(quest.id)}
          disabled={disabled}
          aria-label="Delete quest"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
