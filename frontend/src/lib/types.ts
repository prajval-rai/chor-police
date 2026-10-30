export type Role = "raja" | "mantri" | "sipahi" | "chor";

export type Phase =
  | "lobby"
  | "starting"
  | "role_reveal"
  | "public_reveal"
  | "guessing"
  | "result"
  | "game_over";

export interface PlayerView {
  id: number;
  nickname: string;
  seat: number;
  is_host: boolean;
  online: boolean;
  /** Only present when the server rules allow this viewer to see it. */
  role: Role | null;
  round_points: number | null;
  total_points: number;
  rounds_won: number;
}

export interface RoomState {
  code: string;
  phase: Phase;
  version: number;
  server_now: string;
  phase_started: string | null;
  phase_deadline: string | null;
  round: number;
  total_rounds: number;
  max_players: number;
  notice: string;
  leader_id: number | null;
  players: PlayerView[];
  me: { id: number; nickname: string; is_host: boolean; role: Role | null; points: number | null };
  result: { target_id: number | null; correct: boolean; timed_out: boolean } | null;
}
