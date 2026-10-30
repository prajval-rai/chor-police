"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, saveToken } from "@/lib/api";
import { audio } from "@/lib/audio";
import { ROLE_META, ROLE_ORDER } from "@/lib/roles";
import { Logo } from "./Logo";
import { RoleCard } from "./RoleCard";
import { CopyButton, Modal } from "./ui";

const NICK_KEY = "chorpolice:nickname";

export const HOW_TO_PLAY = [
  "Create a room and invite 3 friends: exactly 4 players.",
  "Everyone secretly gets a role: Raja, Mantri, Sipahi or Chor.",
  "Raja and Sipahi reveal themselves. Mantri and Chor stay hidden.",
  "Sipahi has 20 seconds to point out the Chor.",
  "Caught? Sipahi keeps 500. Wrong? The Chor steals them! Highest total after 5 rounds wins.",
];

function useNickname() {
  // Only rendered inside modals/forms that mount on the client, so reading
  // localStorage in the initializer can't cause a hydration mismatch.
  const [nickname, setNickname] = useState(() => (typeof window === "undefined" ? "" : localStorage.getItem(NICK_KEY) ?? ""));
  const save = (v: string) => {
    setNickname(v);
    localStorage.setItem(NICK_KEY, v);
  };
  return [nickname, save] as const;
}

export function Landing() {
  const [modal, setModal] = useState<"create" | "join" | "about" | null>(null);

  return (
    <main className="landing">
      <nav className="landing__nav">
        <a href="#how" className="nav-link">How to Play</a>
        <button className="nav-link" onClick={() => setModal("about")}>About</button>
      </nav>

      <section className="landing__hero">
        <Logo />
        <motion.p className="landing__tagline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          The classic childhood game.
          <br />
          Now play with your friends online.
        </motion.p>
        <motion.div className="landing__cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          <button className="btn btn--gold btn--lg btn--glow" onClick={() => setModal("create")}>
            Create Room
          </button>
          <button className="btn btn--outline btn--lg" onClick={() => setModal("join")}>
            Join Room
          </button>
        </motion.div>
        <div className="landing__cards">
          {ROLE_ORDER.map((role, i) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 60, rotate: (i - 1.5) * 8 }}
              animate={{ opacity: 1, y: 0, rotate: (i - 1.5) * 3 }}
              transition={{ delay: 1.3 + i * 0.18, type: "spring", stiffness: 140, damping: 14 }}
              className="landing__card"
            >
              <RoleCard role={role} size="md" caption={`${ROLE_META[role].points} pts`} />
            </motion.div>
          ))}
        </div>
      </section>

      <motion.aside id="how" className="panel how-to" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }}>
        <h2 className="panel__title">How to Play</h2>
        <ol className="how-to__list">
          {HOW_TO_PLAY.map((step, i) => (
            <li key={i}>
              <span className="how-to__num">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="how-to__foot">👥 4 players required</p>
      </motion.aside>

      <CreateRoomModal open={modal === "create"} onClose={() => setModal(null)} />
      <JoinRoomModal open={modal === "join"} onClose={() => setModal(null)} />
      <Modal open={modal === "about"} onClose={() => setModal(null)} title="About">
        <p className="muted center">
          Chor Police is a browser version of the Indian party game Raja Mantri Chor Sipahi. Every character, sound and
          tune in it is original. Gather four friends, keep a straight face, and may the best Sipahi win.
        </p>
      </Modal>
    </main>
  );
}

function CreateRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [nickname, setNickname] = useNickname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.createRoom(nickname);
      saveToken(res.code, res.token);
      setCode(res.code);
      audio.play("reveal");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const link = code && typeof window !== "undefined" ? `${window.location.origin}/room/${code}` : "";

  return (
    <Modal open={open} onClose={onClose} title="Create Room" icon="👑">
      <form onSubmit={create} className="form">
        <label className="field">
          <span>Your Nickname</span>
          <input className="input" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Raju" autoFocus disabled={!!code} />
        </label>
        {!code && (
          <button className="btn btn--gold btn--block" disabled={busy || !nickname.trim()}>
            {busy ? "Creating…" : "Create Room"}
          </button>
        )}
        {error && <p className="form-error">{error}</p>}
      </form>

      <AnimatePresence>
        {code && (
          <motion.div className="room-code-reveal" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <div className="divider"><span>Your Room Code</span></div>
            <div className="room-code">
              {code.split("").map((ch, i) => (
                <motion.span key={i} initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.08 }}>
                  {ch}
                </motion.span>
              ))}
            </div>
            <div className="row gap">
              <CopyButton text={code} label="Copy Code" />
              <CopyButton text={link} label="Copy Invite Link" icon="🔗" />
            </div>
            <button className="btn btn--gold btn--block btn--glow" onClick={() => router.push(`/room/${code}`)}>
              Enter Lobby →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

export function JoinForm({ initialCode = "", lockCode = false, onJoined }: { initialCode?: string; lockCode?: boolean; onJoined: (code: string) => void }) {
  const [nickname, setNickname] = useNickname();
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.joinRoom(code, nickname);
      saveToken(res.code, res.token);
      audio.play("join");
      onJoined(res.code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={join} className="form">
      <label className="field">
        <span>Your Nickname</span>
        <input className="input" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Pinky" autoFocus />
      </label>
      {!lockCode && (
        <label className="field">
          <span>Room Code</span>
          <input
            className="input input--code"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="Enter 6 character code"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </label>
      )}
      <button className="btn btn--blue btn--block" disabled={busy || !nickname.trim() || code.length !== 6}>
        {busy ? "Joining…" : "Join Room"}
      </button>
      {error ? <p className="form-error">{error}</p> : !lockCode && <p className="form-hint">ⓘ Room code is 6 characters long</p>}
    </form>
  );
}

function JoinRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  return (
    <Modal open={open} onClose={onClose} title="Join Room" icon="👥">
      <JoinForm onJoined={(code) => router.push(`/room/${code}`)} />
    </Modal>
  );
}
