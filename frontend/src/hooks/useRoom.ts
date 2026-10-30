"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api, ApiError, clearToken, getToken, subscribeTokens } from "@/lib/api";
import type { RoomState } from "@/lib/types";

export type RoomStatus = "loading" | "ready" | "not_joined" | "not_found" | "offline";

const POLL_MS = 900;

/** A cheap fingerprint so identical polls don't re-render the whole game. */
const fingerprint = (s: RoomState) => `${s.version}|${s.players.map((p) => +p.online).join("")}`;

/**
 * Polls the Django REST API for this player's view of the room. The server is
 * authoritative for all phase changes; `clockOffset` aligns local timers with
 * the server's deadlines.
 */
export function useRoom(code: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [fetchStatus, setStatus] = useState<RoomStatus>("loading");
  const [clockOffset, setClockOffset] = useState(0);
  // undefined while rendering on the server / hydrating, null when not joined.
  const token = useSyncExternalStore(subscribeTokens, () => getToken(code), () => undefined);
  const status: RoomStatus = token === undefined ? "loading" : token === null ? "not_joined" : fetchStatus;
  const [actionError, setActionError] = useState("");
  const lastPrint = useRef("");

  const accept = useCallback((next: RoomState) => {
    setClockOffset(Date.parse(next.server_now) - Date.now());
    const print = fingerprint(next);
    if (print !== lastPrint.current) {
      lastPrint.current = print;
      setState(next);
    }
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (!token) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        accept(await api.state(code, token));
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          clearToken(code);
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setStatus("not_found");
          return;
        }
        setStatus((s) => (s === "ready" ? "offline" : s === "loading" ? "offline" : s));
      }
      if (!stopped) timer = setTimeout(poll, document.hidden ? POLL_MS * 3 : POLL_MS);
    };
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [code, token, accept]);

  const act = useCallback(
    async (action: "start" | "next" | "guess" | "leave", data = {}) => {
      if (!token) return;
      setActionError("");
      try {
        const res = await api.action(code, token, action, data);
        if (action === "leave") {
          clearToken(code);
          return;
        }
        accept(res);
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
      }
    },
    [code, token, accept],
  );

  return { state, status, clockOffset, act, actionError };
}
