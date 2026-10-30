"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { ROLE_META } from "@/lib/roles";
import { CharacterArt } from "../Characters";
import { Effect } from "../Effects";
import type { ScreenProps } from "../RoomClient";
import { AnimatedNumber, Avatar, CrownIcon } from "../ui";

export function GameOver({ state, act }: ScreenProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const ranked = [...state.players].sort((a, b) => b.total_points - a.total_points || b.rounds_won - a.rounds_won || a.seat - b.seat);
  const winner = ranked[0];
  const isMe = winner?.id === state.me.id;

  useEffect(() => {
    audio.play("win");
  }, []);

  if (!winner) return null;

  const playAgain = async () => {
    setBusy(true);
    await act("start");
    setBusy(false);
  };
  const leave = async () => {
    await act("leave");
    router.push("/");
  };

  return (
    <div className="game-over">
      <Effect kind="fireworks" duration={6000} />
      <motion.div className="game-over__hero" initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 90, damping: 14 }}>
        <div className="game-over__portrait">
          <CrownIcon size={70} className="game-over__crown" />
          <CharacterArt role={winner.role ?? "raja"} className="game-over__art" />
        </div>
      </motion.div>

      <div className="game-over__info">
        <motion.p className="game-over__label" initial={{ opacity: 0, letterSpacing: "0.8em" }} animate={{ opacity: 1, letterSpacing: "0.25em" }} transition={{ duration: 0.8 }}>
          GAME OVER
        </motion.p>
        <motion.h1 className="game-over__winner" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 160, damping: 10 }}>
          {isMe ? "You Win!" : `${winner.nickname} Wins!`}
        </motion.h1>
        <p className="game-over__score">
          Total Score: <strong><AnimatedNumber from={0} value={winner.total_points} duration={2} delay={0.8} /></strong>
        </p>
        {winner.rounds_won > 0 && (
          <p className="chip chip--role">
            {winner.rounds_won} Round{winner.rounds_won === 1 ? "" : "s"} Won
          </p>
        )}

        <div className="panel final-table">
          <h3 className="panel__subtitle">Final Scores</h3>
          {ranked.map((p, i) => (
            <motion.div key={p.id} className={`final-row ${i === 0 ? "is-first" : ""} ${p.id === state.me.id ? "is-me" : ""}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.15 }}>
              <span className="final-row__rank">{["🥇", "🥈", "🥉", "4"][i]}</span>
              <Avatar name={p.nickname} seat={p.seat} size={30} />
              <span className="truncate">{p.nickname}</span>
              {p.role && (
                <span className="role-chip hide-sm" style={{ "--role": ROLE_META[p.role].color } as React.CSSProperties}>
                  {ROLE_META[p.role].label}
                </span>
              )}
              <strong className="final-row__pts tabular">{p.total_points.toLocaleString("en-IN")}</strong>
              <span className="muted final-row__won">{p.rounds_won} won</span>
            </motion.div>
          ))}
        </div>

        <div className="row gap center-row">
          {state.me.is_host ? (
            <button className="btn btn--gold btn--lg btn--glow" disabled={busy || state.players.length < 4} onClick={playAgain}>
              {state.players.length < 4 ? "Need 4 players" : "Play Again"}
            </button>
          ) : (
            <p className="waiting-text">Waiting for host to start a rematch</p>
          )}
          <button className="btn btn--outline btn--lg" onClick={leave}>
            Leave Room
          </button>
        </div>
        <p className="game-over__motto">Dosti + Strategy = Victory</p>
      </div>
    </div>
  );
}
