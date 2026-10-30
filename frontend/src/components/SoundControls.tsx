"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { useAudioSettings } from "./ui";

/**
 * Floating audio panel. Also unlocks audio on the first user gesture (browsers
 * forbid sound before that) and plays a click for every `.btn` press.
 */
export function SoundControls() {
  const settings = useAudioSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      audio.unlock();
      const btn = (e.target as HTMLElement).closest(".btn, .role-card.is-clickable");
      if (btn && !btn.hasAttribute("data-nosfx") && !(btn as HTMLButtonElement).disabled) audio.play("click");
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  return (
    <div className="sound-dock">
      <AnimatePresence>
        {open && (
          <motion.div
            className="sound-panel panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <label className="toggle">
              <span>Sound effects</span>
              <input type="checkbox" checked={settings.sound} onChange={(e) => audio.update({ sound: e.target.checked })} />
              <span className="toggle__track" />
            </label>
            <label className="toggle">
              <span>Music</span>
              <input type="checkbox" checked={settings.music} onChange={(e) => audio.update({ music: e.target.checked })} />
              <span className="toggle__track" />
            </label>
            <label className="volume">
              <span>Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(e) => audio.update({ volume: Number(e.target.value) })}
                style={{ "--fill": `${settings.volume * 100}%` } as React.CSSProperties}
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="sound-dock__buttons">
        <button
          type="button"
          className={`icon-btn ${settings.sound ? "" : "is-off"}`}
          onClick={() => audio.update({ sound: !settings.sound })}
          aria-label={settings.sound ? "Mute sound effects" : "Unmute sound effects"}
          title={settings.sound ? "Mute sound effects" : "Unmute sound effects"}
        >
          {settings.sound ? "🔊" : "🔇"}
        </button>
        <button
          type="button"
          className={`icon-btn ${settings.music ? "" : "is-off"}`}
          onClick={() => audio.update({ music: !settings.music })}
          aria-label={settings.music ? "Turn music off" : "Turn music on"}
          title={settings.music ? "Turn music off" : "Turn music on"}
        >
          ♫
        </button>
        <button type="button" className={`icon-btn ${open ? "is-active" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Audio settings" aria-expanded={open}>
          ⚙
        </button>
      </div>
    </div>
  );
}
