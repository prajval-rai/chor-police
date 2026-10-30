"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { audio } from "@/lib/audio";
import type { ScreenProps } from "../RoomClient";
import { Effect } from "../Effects";
import { useNow } from "../ui";

/** 3 · 2 · 1 · LET THE GAME BEGIN! — synced to the server's phase clock. */
export function Countdown({ state, clockOffset }: ScreenProps) {
  const now = useNow(clockOffset);
  const started = state.phase_started ? Date.parse(state.phase_started) : now;
  const elapsed = Math.max(0, now - started) / 1000;
  const step = Math.min(3, Math.floor(elapsed)); // 0,1,2 => 3,2,1 ; 3 => begin

  useEffect(() => {
    audio.play(step < 3 ? "tick" : "go");
  }, [step]);

  return (
    <div className="countdown">
      <div className="countdown__dim" />
      <AnimatePresence mode="wait">
        {step < 3 ? (
          <motion.div
            key={step}
            className="countdown__num"
            initial={{ scale: 2.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {3 - step}
          </motion.div>
        ) : (
          <motion.div
            key="go"
            className="countdown__go"
            initial={{ scale: 0.3, opacity: 0, letterSpacing: "0.6em" }}
            animate={{ scale: 1, opacity: 1, letterSpacing: "0.04em" }}
            transition={{ type: "spring", stiffness: 180, damping: 12 }}
          >
            LET THE GAME BEGIN!
            <Effect kind="gold" duration={1400} />
          </motion.div>
        )}
      </AnimatePresence>
      <p className="countdown__sub">Shuffling the royal cards…</p>
    </div>
  );
}
