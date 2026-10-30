"use client";

import { motion } from "framer-motion";
import { CardBack, CharacterArt } from "./Characters";
import { ROLE_META } from "@/lib/roles";
import type { Role } from "@/lib/types";

interface Props {
  role: Role | null;
  /** Show the face side. A card with no role always shows its back. */
  flipped?: boolean;
  name?: string;
  caption?: string;
  size?: "sm" | "md" | "lg" | "xl";
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  delay?: number;
  className?: string;
}

/** Royal playing card with a CSS 3D flip between back and character. */
export function RoleCard({ role, flipped = true, name, caption, size = "md", selected, dimmed, onClick, delay = 0, className = "" }: Props) {
  const showFace = Boolean(role) && flipped;
  const meta = role ? ROLE_META[role] : null;
  const style = meta ? ({ "--role": meta.color, "--role-glow": meta.glow } as React.CSSProperties) : undefined;
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`role-card role-card--${size} ${showFace ? "is-face" : ""} ${selected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""} ${onClick ? "is-clickable" : ""} ${className}`}
      style={style}
      onClick={onClick}
      whileHover={onClick ? { y: -6 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      animate={{ scale: selected ? 1.07 : 1 }}
      aria-pressed={onClick ? selected : undefined}
      aria-label={name ? `${name}${showFace && meta ? `, ${meta.label}` : ""}` : undefined}
    >
      <div className="role-card__inner" style={{ transitionDelay: `${delay}s`, transform: showFace ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        <div className="role-card__side role-card__back">
          <CardBack className="role-card__art" />
          {name && (
            <div className="role-card__label">
              <span className="role-card__name">{name}</span>
              <span className="role-card__role">{caption ?? "?"}</span>
            </div>
          )}
        </div>
        <div className="role-card__side role-card__front">
          {role && <CharacterArt role={role} className="role-card__art" />}
          <div className="role-card__label">
            {name && <span className="role-card__name">{name}</span>}
            {meta && <span className="role-card__role">{meta.label}</span>}
            {caption && size !== "sm" && <span className="role-card__caption">{caption}</span>}
          </div>
        </div>
      </div>
    </Tag>
  );
}
