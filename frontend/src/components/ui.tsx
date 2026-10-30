"use client";

import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { audio } from "@/lib/audio";
import { SEAT_COLORS } from "@/lib/roles";

/** Number that counts smoothly from its previous value to `value`. */
export function AnimatedNumber({ value, from, duration = 1.2, delay = 0, prefix = "", tick = false }: { value: number; from?: number; duration?: number; delay?: number; prefix?: string; tick?: boolean }) {
  const [display, setDisplay] = useState(from ?? value);
  const prev = useRef(from ?? value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (reduce || from === value) {
      setDisplay(value);
      return;
    }
    let lastTick = 0;
    const controls = animate(from, value, {
      duration,
      delay,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplay(Math.round(v));
        if (tick && performance.now() - lastTick > 90) {
          audio.play("score");
          lastTick = performance.now();
        }
      },
    });
    return () => controls.stop();
  }, [value, duration, delay, reduce, tick]);

  return (
    <span className="tabular">
      {prefix}
      {display.toLocaleString("en-IN")}
    </span>
  );
}

export function Avatar({ name, seat, size = 36 }: { name: string; seat: number; size?: number }) {
  const color = SEAT_COLORS[seat % SEAT_COLORS.length];
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, "--seat": color } as React.CSSProperties}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function CrownIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M3 18 L2 7 L7.5 11 L12 4 L16.5 11 L22 7 L21 18 Z" fill="#FFC83D" stroke="#B7791F" strokeWidth="1" />
      <rect x="3" y="18.5" width="18" height="2.5" rx="1" fill="#FFC83D" />
      <circle cx="12" cy="13" r="1.6" fill="#EF4444" />
    </svg>
  );
}

export function Modal({ open, onClose, title, children, icon }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="modal panel panel--gold"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
            {icon && <div className="modal__icon">{icon}</div>}
            <h2 className="modal__title">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Copy-to-clipboard button with a "Copied!" confirmation. */
export function CopyButton({ text, label, className = "btn btn--ghost", icon = "⧉" }: { text: string; label: string; className?: string; icon?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    audio.play("copy");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button type="button" className={`${className} copy-btn ${copied ? "is-copied" : ""}`} onClick={copy} data-nosfx>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={copied ? "y" : "n"} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.15 }}>
          {copied ? "✓ Copied!" : `${icon} ${label}`}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/** Ticking client clock, offset to match the server's clock. */
export function useNow(offsetMs: number, intervalMs = 100) {
  const [now, setNow] = useState(() => Date.now() + offsetMs);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offsetMs), intervalMs);
    return () => clearInterval(id);
  }, [offsetMs, intervalMs]);
  return now;
}

const SERVER_AUDIO_SETTINGS = { sound: true, music: false, volume: 0.7 };

export function useAudioSettings() {
  return useSyncExternalStore(audio.subscribe, audio.getSettings, () => SERVER_AUDIO_SETTINGS);
}
