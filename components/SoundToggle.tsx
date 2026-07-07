"use client";

import { useEffect, useState } from "react";
import { setSoundEnabled } from "@/lib/sound";

const STORAGE_KEY = "questlog:sound";

export default function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "on";
    setOn(saved);
    setSoundEnabled(saved);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next); // also resumes the AudioContext on this gesture
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  }

  return (
    <button
      type="button"
      className={`sound-toggle ${on ? "is-on" : ""}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Sound on" : "Sound off"}
    >
      <span aria-hidden>{on ? "♪" : "○"}</span>
    </button>
  );
}
