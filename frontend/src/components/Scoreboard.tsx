"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ROLE_META } from "@/lib/roles";
import type { PlayerView, RoomState } from "@/lib/types";
import { AnimatedNumber, Avatar, CrownIcon } from "./ui";

export function roundWinnerId(state: RoomState) {
  if (!state.result) return null;
  const role = state.result.correct ? "sipahi" : "chor";
  return state.players.find((p) => p.role === role)?.id ?? null;
}

const rank = (players: PlayerView[], total: (p: PlayerView) => number) =>
  [...players].sort((a, b) => total(b) - total(a) || b.rounds_won - a.rounds_won || a.seat - b.seat);

/**
 * Standings table. With `animateRound`, totals count up from last round's
 * values and rows re-sort into the new ranking once the counters finish.
 */
export function Scoreboard({ state, animateRound = false, delay = 0 }: { state: RoomState; animateRound?: boolean; delay?: number }) {
  const [settled, setSettled] = useState(!animateRound);
  useEffect(() => {
    if (!animateRound) return;
    const t = setTimeout(() => setSettled(true), (delay + 1.4) * 1000);
    return () => clearTimeout(t);
  }, [animateRound, delay]);

  const previous = (p: PlayerView) => p.total_points - (p.round_points ?? 0);
  const rows = rank(state.players, settled ? (p) => p.total_points : previous);
  const winner = roundWinnerId(state);

  return (
    <div className="scoreboard">
      <div className="scoreboard__head">
        <span>#</span>
        <span>Player</span>
        <span className="hide-sm">Role</span>
        <span>Round</span>
        <span>Total</span>
        <span className="hide-sm">Won</span>
      </div>
      {rows.map((p, i) => {
        const meta = p.role ? ROLE_META[p.role] : null;
        const isLeader = settled && i === 0 && p.total_points > 0;
        return (
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            key={p.id}
            className={`scoreboard__row ${p.id === state.me.id ? "is-me" : ""} ${p.id === winner ? "is-winner" : ""}`}
          >
            <span className="scoreboard__rank">{i + 1}</span>
            <span className="scoreboard__player">
              <Avatar name={p.nickname} seat={p.seat} size={30} />
              <span className="truncate">{p.nickname}</span>
              {isLeader && (
                <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}>
                  <CrownIcon size={18} />
                </motion.span>
              )}
            </span>
            <span className="hide-sm">
              {meta ? (
                <span className="role-chip" style={{ "--role": meta.color } as React.CSSProperties}>
                  {meta.label}
                </span>
              ) : (
                <span className="muted">—</span>
              )}
            </span>
            <span className={`scoreboard__round ${p.round_points ? "is-plus" : ""}`}>
              {p.round_points != null ? (p.round_points > 0 ? `+${p.round_points}` : "0") : "—"}
            </span>
            <span className="scoreboard__total">
              {animateRound ? <AnimatedNumber from={previous(p)} value={p.total_points} delay={delay} /> : p.total_points.toLocaleString("en-IN")}
            </span>
            <span className="hide-sm">{p.rounds_won}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
