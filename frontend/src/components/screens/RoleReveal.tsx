"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { ROLE_META } from "@/lib/roles";
import type { EffectKind } from "../Effects";
import { Effect } from "../Effects";
import { RoleCard } from "../RoleCard";
import type { ScreenProps } from "../RoomClient";
import { PhaseBar, RoleAura, usePhaseClock } from "./common";

const EFFECT: Record<string, EffectKind> = { raja: "gold", mantri: "purple", sipahi: "blue", chor: "red" };

/** The private moment: only this player's own role is ever in the payload. */
export function RoleReveal({ state, clockOffset }: ScreenProps) {
  const role = state.me.role;
  const [flipped, setFlipped] = useState(false);
  const { fraction } = usePhaseClock(state, clockOffset);

  useEffect(() => {
    audio.play("whoosh");
    const t = setTimeout(() => setFlipped(true), 1300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (flipped) audio.play("reveal");
  }, [flipped]);

  if (!role) return null;
  const meta = ROLE_META[role];

  return (
    <div className={`reveal reveal--${role}`} style={{ "--role": meta.color, "--role-glow": meta.glow } as React.CSSProperties}>
      <p className="reveal__round">Round {state.round} of {state.total_rounds} · Your secret role</p>
      <div className="reveal__stage">
        {flipped && <RoleAura role={role} />}
        <motion.div initial={{ y: 80, opacity: 0, rotateZ: -8 }} animate={{ y: 0, opacity: 1, rotateZ: 0 }} transition={{ type: "spring", stiffness: 140, damping: 14 }}>
          <RoleCard role={role} flipped={flipped} size="xl" onClick={flipped ? undefined : () => setFlipped(true)} />
        </motion.div>
      </div>
      <AnimatePresence>
        {flipped ? (
          <motion.div key="text" className="reveal__text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <p className="reveal__you">You are the</p>
            <h1 className="reveal__role">{meta.label.toUpperCase()}!</h1>
            <p className="reveal__points">
              {role === "chor" ? "0 points… unless the Sipahi gets it wrong 😏" : `You get ${meta.points.toLocaleString("en-IN")} points`}
            </p>
            <p className="reveal__tagline">{meta.tagline}</p>
          </motion.div>
        ) : (
          <motion.p key="tap" className="reveal__hint" exit={{ opacity: 0 }}>
            Tap the card to reveal
          </motion.p>
        )}
      </AnimatePresence>
      {flipped && <Effect kind={EFFECT[role]} duration={2600} />}
      <PhaseBar fraction={fraction} label="Keep it secret! The Raja and Sipahi step forward next…" />
    </div>
  );
}
