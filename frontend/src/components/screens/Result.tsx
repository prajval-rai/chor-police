"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { ROLE_META, ROLE_ORDER } from "@/lib/roles";
import { Effect } from "../Effects";
import { RoleCard } from "../RoleCard";
import type { ScreenProps } from "../RoomClient";
import { Scoreboard } from "../Scoreboard";
import { AnimatedNumber } from "../ui";

type Stage = "suspense" | "reveal";

export function Result({ state, act, clockOffset }: ScreenProps) {
  const result = state.result!;
  const players = [...state.players].sort((a, b) => a.seat - b.seat);
  const target = players.find((p) => p.id === result.target_id);
  const sipahi = players.find((p) => p.role === "sipahi");

  // Skip the suspense if we're arriving late (e.g. after a page reload).
  const [stage, setStage] = useState<Stage>(() => {
    const age = state.phase_started ? Date.now() + clockOffset - Date.parse(state.phase_started) : 0;
    return age > 6000 ? "reveal" : "suspense";
  });
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (stage !== "suspense") return;
    audio.play("tick");
    const timers = [
      setTimeout(() => (setCount(2), audio.play("tick")), 700),
      setTimeout(() => (setCount(1), audio.play("tick")), 1400),
      setTimeout(() => setStage("reveal"), 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  useEffect(() => {
    if (stage !== "reveal") return;
    audio.play("flip");
    const t = setTimeout(() => audio.play(result.correct ? "correct" : "wrong"), 900);
    return () => clearTimeout(t);
  }, [stage, result.correct]);

  const last = state.round >= state.total_rounds;
  const next = async () => {
    setBusy(true);
    await act("next");
    setBusy(false);
  };

  const revealed = stage === "reveal";
  const headline = result.correct ? "SIPAHI CAUGHT THE CHOR!" : result.timed_out ? "TIME'S UP! THE CHOR ESCAPED!" : "THE CHOR ESCAPED!";

  return (
    <div className={`result ${revealed ? (result.correct ? "is-correct" : "is-wrong") : ""}`}>
      {revealed && !result.correct && <div className="red-flash" aria-hidden />}
      {revealed && <Effect kind={result.correct ? "confetti" : "red"} duration={result.correct ? 3500 : 2200} />}

      <h2 className="screen-title">Result</h2>

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="suspense" className="result__suspense" exit={{ opacity: 0, scale: 0.8 }}>
            <p>
              {result.timed_out ? (
                <>The Sipahi ran out of time…</>
              ) : (
                <>
                  <strong>{sipahi?.nickname}</strong> accuses <strong className="text-chor">{target?.nickname}</strong>!
                </>
              )}
            </p>
            <motion.span key={count} className="result__count" initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {count}
            </motion.span>
          </motion.div>
        ) : (
          <motion.div key="reveal" className="result__reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card-row">
              {players.map((p, i) => {
                const escaped = !result.correct && p.role === "chor";
                return (
                  <motion.div
                    key={p.id}
                    className={`${p.id === result.target_id ? "is-target" : ""} ${escaped ? "chor-dance" : ""}`}
                    animate={p.id === result.target_id ? { y: [0, -14, 0] } : {}}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <RoleCard role={p.role} flipped delay={i * 0.12} name={p.nickname} size="md" />
                    {p.id === result.target_id && <span className="accused-tag">ACCUSED</span>}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              className={`result__banner ${result.correct ? "is-correct" : "is-wrong"}`}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 220, damping: 12 }}
            >
              {result.correct ? "✔" : "✖"} {headline}
            </motion.div>

            <motion.div className="points-row" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
              {ROLE_ORDER.map((role) => {
                const p = players.find((x) => x.role === role);
                const pts = p?.round_points ?? 0;
                return (
                  <div key={role} className="points-row__cell" style={{ "--role": ROLE_META[role].color } as React.CSSProperties}>
                    <span className="points-row__role">{ROLE_META[role].label}</span>
                    <span className="points-row__value">
                      <AnimatedNumber from={0} value={pts} prefix={pts > 0 ? "+" : ""} delay={1.5} tick />
                    </span>
                    {role === "chor" && pts > 0 && <span className="points-row__note">stolen!</span>}
                  </div>
                );
              })}
            </motion.div>

            <motion.div className="panel result__scores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
              <h3 className="panel__subtitle">Scoreboard · Round {state.round}/{state.total_rounds}</h3>
              <Scoreboard state={state} animateRound delay={2.4} />
            </motion.div>

            <div className="result__actions">
              {state.me.is_host ? (
                <button className="btn btn--gold btn--lg btn--glow" disabled={busy} onClick={next}>
                  {last ? "See Final Results 🏆" : "Next Round →"}
                </button>
              ) : (
                <p className="waiting-text">
                  Waiting for the host{last ? " to show the final results" : " to start the next round"}
                  <span className="waiting-dots"><i /><i /><i /></span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
