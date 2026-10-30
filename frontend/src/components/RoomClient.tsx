"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRoom } from "@/hooks/useRoom";
import { api } from "@/lib/api";
import { audio } from "@/lib/audio";
import type { RoomState } from "@/lib/types";
import { Effect } from "./Effects";
import { JoinForm } from "./Landing";
import { Logo } from "./Logo";
import { Scoreboard } from "./Scoreboard";
import { Countdown } from "./screens/Countdown";
import { GameOver } from "./screens/GameOver";
import { Guessing } from "./screens/Guessing";
import { Lobby } from "./screens/Lobby";
import { PublicReveal } from "./screens/PublicReveal";
import { Result } from "./screens/Result";
import { RoleReveal } from "./screens/RoleReveal";
import { CopyButton, CrownIcon, Modal } from "./ui";

export type Act = ReturnType<typeof useRoom>["act"];

export interface ScreenProps {
  state: RoomState;
  act: Act;
  clockOffset: number;
}

export function RoomClient() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  const room = useRoom(code);

  if (room.status === "not_joined") return <JoinGate code={code} />;
  if (room.status === "not_found") {
    return (
      <CenterCard title="Room not found">
        <p className="muted center">This room doesn&apos;t exist anymore. Rooms close when everyone leaves.</p>
        <Link href="/" className="btn btn--gold btn--block">Back to Home</Link>
      </CenterCard>
    );
  }
  if (!room.state) {
    return (
      <CenterCard title={room.status === "offline" ? "Can't reach the server" : "Entering the palace…"}>
        {room.status === "offline" ? <p className="muted center">Retrying… make sure the Django server is running.</p> : <div className="loader" />}
      </CenterCard>
    );
  }
  return <GameStage state={room.state} act={room.act} clockOffset={room.clockOffset} actionError={room.actionError} offline={room.status === "offline"} />;
}

function CenterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="center-page">
      <Logo size="sm" />
      <motion.div className="panel panel--gold center-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="modal__title">{title}</h2>
        {children}
      </motion.div>
    </main>
  );
}

function JoinGate({ code }: { code: string }) {
  const [info, setInfo] = useState<{ players: number; phase: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.roomInfo(code).then(setInfo).catch((e) => setError(e.message));
  }, [code]);

  return (
    <CenterCard title="Join Room">
      <div className="room-code room-code--sm">{code.split("").map((c, i) => <span key={i}>{c}</span>)}</div>
      {error && <p className="form-error">{error}</p>}
      {info && info.phase !== "lobby" && <p className="form-error">This game has already started.</p>}
      {info && info.phase === "lobby" && info.players >= 4 && <p className="form-error">This room is full (4/4).</p>}
      {info && info.phase === "lobby" && info.players < 4 && (
        <>
          <p className="muted center">{info.players}/4 players are waiting for you</p>
          {/* Saving the token re-renders useRoom straight into the game. */}
          <JoinForm initialCode={code} lockCode onJoined={() => {}} />
        </>
      )}
      <Link href="/" className="btn btn--ghost btn--block">Back to Home</Link>
    </CenterCard>
  );
}

const SCREENS = {
  lobby: Lobby,
  starting: Countdown,
  role_reveal: RoleReveal,
  public_reveal: PublicReveal,
  guessing: Guessing,
  result: Result,
  game_over: GameOver,
};

function GameStage({ state, act, clockOffset, actionError, offline }: ScreenProps & { actionError: string; offline: boolean }) {
  const router = useRouter();
  const [showScores, setShowScores] = useState(false);
  const [leaderToast, setLeaderToast] = useState<string | null>(null);
  const prevLeader = useRef<number | null>(state.leader_id);

  // Suspense music while identities are hidden.
  useEffect(() => {
    audio.setMood(["public_reveal", "guessing"].includes(state.phase) ? "suspense" : "calm");
  }, [state.phase]);

  // Celebrate a change of overall leader, after the result has been revealed.
  useEffect(() => {
    const before = prevLeader.current;
    prevLeader.current = state.leader_id;
    if (state.phase !== "result" || !state.leader_id || before === state.leader_id || state.round < 2) return;
    const name = state.players.find((p) => p.id === state.leader_id)?.nickname;
    const t = setTimeout(() => {
      setLeaderToast(`${name} takes the lead!`);
      audio.play("join");
    }, 4200);
    const t2 = setTimeout(() => setLeaderToast(null), 8200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [state.leader_id, state.phase, state.players, state.round]);

  const leave = async () => {
    await act("leave");
    router.push("/");
  };

  const Screen = SCREENS[state.phase];
  const inGame = state.round > 0 && state.phase !== "lobby";

  return (
    <main className={`stage stage--${state.phase}`}>
      <header className="stage__header">
        <Logo size="sm" />
        <div className="chip chip--code">
          Room Code: <strong>{state.code}</strong>
          <CopyButton text={state.code} label="" icon="⧉" className="chip__copy" />
        </div>
        {inGame && (
          <div className="chip chip--round">
            <CrownIcon size={14} /> Round {state.round}/{state.total_rounds}
          </div>
        )}
        <div className="stage__header-right">
          {inGame && (
            <button className="btn btn--ghost btn--sm" onClick={() => setShowScores(true)}>
              Scoreboard
            </button>
          )}
          <button className="btn btn--ghost btn--sm" onClick={leave}>
            Leave
          </button>
        </div>
      </header>

      {offline && <div className="banner banner--warn">Connection lost, reconnecting…</div>}
      {actionError && <div className="banner banner--error">{actionError}</div>}

      <AnimatePresence mode="wait">
        <motion.section
          key={`${state.phase}-${state.round}`}
          className="stage__screen"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.35 }}
        >
          <Screen state={state} act={act} clockOffset={clockOffset} />
        </motion.section>
      </AnimatePresence>

      <Modal open={showScores} onClose={() => setShowScores(false)} title="Scoreboard">
        <Scoreboard state={state} />
      </Modal>

      <AnimatePresence>
        {leaderToast && (
          <motion.div className="toast" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}>
            <CrownIcon size={22} /> {leaderToast}
            <Effect kind="gold" duration={1800} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
