"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { ROLE_META } from "@/lib/roles";
import { RoleCard } from "../RoleCard";
import type { ScreenProps } from "../RoomClient";

const PUBLIC = ["raja", "sipahi"];

export function PublicReveal({ state }: ScreenProps) {
  const players = [...state.players].sort((a, b) => a.seat - b.seat);
  const [flip, setFlip] = useState(false);
  const publicOrder = players.filter((p) => p.role && PUBLIC.includes(p.role)).sort((a, b) => (a.role === "raja" ? -1 : b.role === "raja" ? 1 : 0));

  useEffect(() => {
    const t = setTimeout(() => setFlip(true), 700);
    const s1 = setTimeout(() => audio.play("flip"), 700);
    const s2 = setTimeout(() => audio.play("flip"), 1400);
    return () => [t, s1, s2].forEach(clearTimeout);
  }, []);

  const myRole = state.me.role;

  return (
    <div className="public-reveal">
      <motion.h2 className="screen-title" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        Roles Revealed
      </motion.h2>
      <p className="screen-sub">The Raja and the Sipahi step forward. Mantri and Chor stay hidden…</p>

      <div className="card-row">
        {players.map((p, i) => {
          const isPublic = p.role != null && PUBLIC.includes(p.role);
          const order = publicOrder.findIndex((x) => x.id === p.id);
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <RoleCard
                role={isPublic ? p.role : null}
                flipped={flip}
                delay={order * 0.7}
                name={p.id === state.me.id ? `${p.nickname} (You)` : p.nickname}
                size="md"
                dimmed={false}
              />
            </motion.div>
          );
        })}
      </div>

      <motion.p className="hidden-callout" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.2, type: "spring" }}>
        Two identities remain hidden!
      </motion.p>
      {myRole && !PUBLIC.includes(myRole) && (
        <motion.p className="secret-pill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }} style={{ "--role": ROLE_META[myRole].color } as React.CSSProperties}>
          🤫 Your secret: <strong>{ROLE_META[myRole].label}</strong>, keep a straight face!
        </motion.p>
      )}
    </div>
  );
}
