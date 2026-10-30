import type { RoomState } from "./types";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const tokenKey = (code: string) => `chorpolice:token:${code.toUpperCase()}`;

const tokenListeners = new Set<() => void>();
const emitTokens = () => tokenListeners.forEach((fn) => fn());

export const getToken = (code: string) =>
  typeof window === "undefined" ? null : localStorage.getItem(tokenKey(code));
export const saveToken = (code: string, token: string) => {
  localStorage.setItem(tokenKey(code), token);
  emitTokens();
};
export const clearToken = (code: string) => {
  localStorage.removeItem(tokenKey(code));
  emitTokens();
};
/** For useSyncExternalStore: fires when a token is saved/cleared (any tab). */
export const subscribeTokens = (fn: () => void) => {
  tokenListeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    tokenListeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
};

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Player-Token"] = token;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError("Can't reach the game server. Is it running?", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? "Something went wrong.", res.status);
  return body as T;
}

interface Joined {
  code: string;
  token: string;
  player_id: number;
}

export const api = {
  createRoom: (nickname: string) =>
    request<Joined>("/rooms", { method: "POST", body: JSON.stringify({ nickname }) }),
  roomInfo: (code: string) =>
    request<{ code: string; phase: string; players: number; max_players: number }>(
      `/rooms/${code.toUpperCase()}`,
    ),
  joinRoom: (code: string, nickname: string) =>
    request<Joined>(`/rooms/${code.toUpperCase()}/join`, {
      method: "POST",
      body: JSON.stringify({ nickname }),
    }),
  state: (code: string, token: string) => request<RoomState>(`/rooms/${code}/state`, {}, token),
  action: (code: string, token: string, action: "start" | "next" | "guess" | "leave", data = {}) =>
    request<RoomState>(
      `/rooms/${code}/${action}`,
      { method: "POST", body: JSON.stringify(data) },
      token,
    ),
};
