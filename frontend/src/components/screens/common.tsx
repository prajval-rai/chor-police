"use client";

import type { Role, RoomState } from "@/lib/types";
import { CrownIcon, useNow } from "../ui";

/** Seconds left in a timed phase, and the fraction of it remaining. */
export function usePhaseClock(state: RoomState, clockOffset: number) {
  const now = useNow(clockOffset);
  if (!state.phase_deadline || !state.phase_started) return { left: 0, fraction: 0, now };
  const end = Date.parse(state.phase_deadline);
  const start = Date.parse(state.phase_started);
  const left = Math.max(0, (end - now) / 1000);
  return { left, fraction: Math.min(1, left / ((end - start) / 1000)), now };
}

export function PhaseBar({ fraction, urgent = false, label }: { fraction: number; urgent?: boolean; label?: React.ReactNode }) {
  return (
    <div className={`phase-bar ${urgent ? "is-urgent" : ""}`}>
      <div className="phase-bar__track">
        <div className="phase-bar__fill" style={{ transform: `scaleX(${fraction})` }} />
      </div>
      {label && <p className="phase-bar__label">{label}</p>}
    </div>
  );
}

/** Role-specific atmosphere behind the reveal card. Pure CSS. */
export function RoleAura({ role }: { role: Role }) {
  return (
    <div className={`aura aura--${role}`} aria-hidden>
      {role === "raja" && (
        <>
          <div className="aura__burst" />
          <div className="aura__crown"><CrownIcon size={72} /></div>
        </>
      )}
      {role === "mantri" && (
        <>
          <div className="aura__smoke aura__smoke--1" />
          <div className="aura__smoke aura__smoke--2" />
          <div className="aura__smoke aura__smoke--3" />
        </>
      )}
      {role === "sipahi" && (
        <>
          <div className="aura__spotlight" />
          <div className="aura__badge">
            <svg viewBox="0 0 24 24" width="64" height="64">
              <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" fill="#3B82F6" stroke="#FFC83D" strokeWidth="1.4" />
              <path d="M12 7 l1.5 3 3.3 .5 -2.4 2.3 .6 3.3 -3 -1.6 -3 1.6 .6 -3.3 -2.4 -2.3 3.3 -.5 Z" fill="#FFC83D" />
            </svg>
          </div>
        </>
      )}
      {role === "chor" && (
        <>
          <div className="aura__shadow" />
          <div className="aura__eyes"><i /><i /></div>
        </>
      )}
    </div>
  );
}
