"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { CharacterArt } from "../Characters";
import { RoleCard } from "../RoleCard";
import type { ScreenProps } from "../RoomClient";
import { PhaseBar, usePhaseClock } from "./common";

export function Guessing({ state, act, clockOffset }: ScreenProps) {
  const { left, fraction } = usePhaseClock(state, clockOffset);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const lastTick = useRef(99);

  const sipahi = state.players.find((p) => p.role === "sipahi");
  const suspects = state.players.filter((p) => p.role !== "raja" && p.role !== "sipahi").sort((a, b) => a.seat - b.seat);
  const iAmSipahi = state.me.role === "sipahi";
  const iAmSuspect = suspects.some((p) => p.id === state.me.id);
  const seconds = Math.ceil(left);
  const urgent = seconds <= 5;

  useEffect(() => {
    if (urgent && seconds > 0 && seconds < lastTick.current) audio.play("tick");
    lastTick.current = seconds;
  }, [seconds, urgent]);

  const arrest = async () => {
    if (selected == null) return;
    setSubmitting(true);
    audio.play("whoosh");
    await act("guess", { target_id: selected });
    setSubmitting(false);
  };

  return (
    <div className="guessing">
      <div className="guessing__main panel">
        <div className="guessing__head">
          <span className="guessing__badge">🚨</span>
          <h2 className="screen-title">{iAmSipahi ? "Sipahi's Turn" : `${sipahi?.nickname ?? "Sipahi"} is the Sipahi`}</h2>
        </div>

        {iAmSipahi ? (
          <p className="guessing__question">
            Who is the <span className="text-chor">CHOR</span>?
          </p>
        ) : (
          <p className="guessing__question guessing__question--wait">
            Sipahi is investigating…
            <span className="block muted">Waiting for the decision.</span>
          </p>
        )}

        <div className="guessing__suspects">
          {suspects.map((p, i) => (
            <div key={p.id} className="guessing__slot">
              {i === 1 && <span className="vs">VS</span>}
              <RoleCard
                role={null}
                name={p.id === state.me.id ? `${p.nickname} (You)` : p.nickname}
                size="lg"
                selected={selected === p.id}
                dimmed={selected != null && selected !== p.id}
                onClick={iAmSipahi && !submitting ? () => setSelected(p.id) : undefined}
              />
            </div>
          ))}
        </div>

        {iAmSuspect && <p className="secret-pill secret-pill--warn">😐 You&apos;re a suspect! Keep a straight face…</p>}

        <AnimatePresence>
          {iAmSipahi && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="guessing__actions">
              <button className="btn btn--red btn--lg" disabled={selected == null || submitting} onClick={arrest}>
                {submitting ? "Arresting…" : selected == null ? "Select a suspect" : `Arrest ${state.players.find((p) => p.id === selected)?.nickname}!`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <PhaseBar
          fraction={fraction}
          urgent={urgent}
          label={
            <>
              Time remaining: <strong>{seconds}s</strong>
              {iAmSipahi && seconds <= 5 && <span className="muted"> · no answer = the Chor escapes!</span>}
            </>
          }
        />
      </div>
      <motion.div className="guessing__officer" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <CharacterArt role="sipahi" className="guessing__officer-art" />
      </motion.div>
    </div>
  );
}
