"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
import { audio } from "@/lib/audio";
import type { ScreenProps } from "../RoomClient";
import { Avatar, CopyButton, CrownIcon } from "../ui";

export function Lobby({ state, act }: ScreenProps) {
  const players = [...state.players].sort((a, b) => a.seat - b.seat);
  const count = players.length;
  const ready = count === state.max_players;
  const prevCount = useRef(count);
  const [starting, setStarting] = useState(false);
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
  const link = origin && `${origin}/room/${state.code}`;

  useEffect(() => {
    if (count > prevCount.current) audio.play("join");
    if (count === state.max_players && prevCount.current < state.max_players) setTimeout(() => audio.play("correct"), 350);
    prevCount.current = count;
  }, [count, state.max_players]);

  const start = async () => {
    setStarting(true);
    await act("start");
    setStarting(false);
  };

  return (
    <div className="lobby">
      {state.notice && <div className="banner banner--info">{state.notice}</div>}

      <div className="lobby__grid">
        <div className="panel lobby__players">
          <div className="lobby__players-head">
            <h2 className="panel__title">Players</h2>
            <span className="player-count">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.strong key={count} initial={{ y: 14, opacity: 0, scale: 1.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -14, opacity: 0 }}>
                  {count}
                </motion.strong>
              </AnimatePresence>
              /{state.max_players} Players
            </span>
          </div>
          <ul className="slot-list">
            <AnimatePresence initial={false}>
              {players.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  className={`slot ${p.id === state.me.id ? "is-me" : ""}`}
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <Avatar name={p.nickname} seat={p.seat} />
                  <span className="slot__name truncate">
                    {p.nickname}
                    {p.id === state.me.id && <span className="muted"> (You)</span>}
                  </span>
                  {p.is_host && (
                    <span className="slot__host">
                      Host <CrownIcon size={16} />
                    </span>
                  )}
                  <span className={`dot ${p.online ? "dot--on" : "dot--off"}`} title={p.online ? "Online" : "Offline"} />
                </motion.li>
              ))}
              {Array.from({ length: state.max_players - count }, (_, i) => (
                <motion.li key={`empty-${i}`} layout className="slot slot--empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span className="avatar avatar--empty">?</span>
                  <span className="slot__name">Waiting for player</span>
                  <span className="waiting-dots"><i /><i /><i /></span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="lobby__side">
          <div className="panel">
            <h3 className="panel__subtitle">Share this room</h3>
            <div className="share-row">
              <input className="input input--readonly" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Invite link" />
              <CopyButton text={link} label="Copy Link" className="btn btn--blue btn--sm" icon="🔗" />
            </div>
            <p className="form-hint">Send the link to 3 friends, or tell them the code <strong>{state.code}</strong>.</p>
          </div>

          <AnimatePresence>
            {ready && (
              <motion.div
                className="ready-banner"
                initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
              >
                <span>READY!</span>
                <small>All 4 players are here</small>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="lobby__actions">
        {state.me.is_host ? (
          <button className={`btn btn--gold btn--lg ${ready ? "btn--glow" : ""}`} disabled={!ready || starting} onClick={start}>
            {starting ? "Starting…" : ready ? "Start Game" : `Waiting for ${state.max_players - count} more…`}
          </button>
        ) : (
          <p className="waiting-text">
            {ready ? "Waiting for the host to start the game" : "Waiting for more players to join"}
            <span className="waiting-dots"><i /><i /><i /></span>
          </p>
        )}
      </div>
    </div>
  );
}
