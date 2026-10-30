import type { Role } from "./types";

export interface RoleMeta {
  label: string;
  points: number;
  color: string;
  glow: string;
  tagline: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  raja: {
    label: "Raja",
    points: 1000,
    color: "#FFB800",
    glow: "rgba(255, 184, 0, 0.55)",
    tagline: "The kingdom bows to you.",
  },
  mantri: {
    label: "Mantri",
    points: 800,
    color: "#A855F7",
    glow: "rgba(168, 85, 247, 0.55)",
    tagline: "Wise counsel, quiet power.",
  },
  sipahi: {
    label: "Sipahi",
    points: 500,
    color: "#3B82F6",
    glow: "rgba(59, 130, 246, 0.55)",
    tagline: "Find the Chor. Trust nobody.",
  },
  chor: {
    label: "Chor",
    points: 0,
    color: "#EF4444",
    glow: "rgba(239, 68, 68, 0.55)",
    tagline: "Stay hidden. Steal the glory.",
  },
};

export const ROLE_ORDER: Role[] = ["raja", "mantri", "sipahi", "chor"];

/** Avatar ring colors for players before roles are known. */
export const SEAT_COLORS = ["#FFC83D", "#22D3EE", "#F472B6", "#4ADE80"];
