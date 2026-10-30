"use client";

import { useId } from "react";
import type { Role } from "@/lib/types";

/**
 * Original vector character portraits for the four roles.
 * All share one bust/face construction so they read as a consistent set.
 */

const PALETTES: Record<Role, { bg1: string; bg2: string; ray: string; skin: string; skinShade: string }> = {
  raja: { bg1: "#FFD66B", bg2: "#7A3B00", ray: "#FFE9A8", skin: "#E0A774", skinShade: "#B97A48" },
  mantri: { bg1: "#C084FC", bg2: "#2E0B52", ray: "#E9D5FF", skin: "#C98D5E", skinShade: "#9E6A40" },
  sipahi: { bg1: "#60A5FA", bg2: "#0B1E4D", ray: "#BFDBFE", skin: "#BE7F50", skinShade: "#935F37" },
  chor: { bg1: "#F87171", bg2: "#3A0507", ray: "#FECACA", skin: "#AD7046", skinShade: "#80502F" },
};

function Backdrop({ id, role }: { id: string; role: Role }) {
  const p = PALETTES[role];
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor={p.bg1} />
          <stop offset="100%" stopColor={p.bg2} />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="45%" stopColor="#FFC83D" />
          <stop offset="100%" stopColor="#B7791F" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="200" height="250" fill={`url(#${id}-bg)`} />
      <g className="char-rays" style={{ transformOrigin: "100px 110px" }} opacity="0.22">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M100 110 L92 -60 L108 -60 Z" fill={p.ray} transform={`rotate(${i * 30} 100 110)`} />
        ))}
      </g>
      {/* distant palace silhouette */}
      <path
        d="M0 205 V180 H18 V165 l7 -9 7 9 V180 H48 V160 q12 -22 24 0 V180 H86 V150 q14 -30 28 0 V180 H128 V160 q12 -22 24 0 V180 H168 V165 l7 -9 7 9 V180 H200 V205 Z"
        fill="#000"
        opacity="0.28"
      />
    </>
  );
}

function Face({
  role,
  eyeShift = 0,
  browTilt = 0,
  children,
}: {
  role: Role;
  eyeShift?: number;
  browTilt?: number;
  children?: React.ReactNode;
}) {
  const p = PALETTES[role];
  return (
    <g>
      {/* neck */}
      <path d="M84 150 h32 v42 q-16 10 -32 0 Z" fill={p.skinShade} />
      {/* ears */}
      <ellipse cx="66" cy="124" rx="7" ry="11" fill={p.skinShade} />
      <ellipse cx="134" cy="124" rx="7" ry="11" fill={p.skinShade} />
      {/* head */}
      <path d="M66 112 q0 -44 34 -44 q34 0 34 44 q0 34 -16 48 q-8 8 -18 8 q-10 0 -18 -8 q-16 -14 -16 -48 Z" fill={p.skin} />
      {/* cheek shading */}
      <path d="M70 128 q4 26 22 36 q-20 -2 -24 -36 Z" fill={p.skinShade} opacity="0.35" />
      <path d="M130 128 q-4 26 -22 36 q20 -2 24 -36 Z" fill={p.skinShade} opacity="0.35" />
      {/* eyebrows */}
      <path d={`M78 ${106 - browTilt} q10 -7 19 -1 l-1 3 q-9 -4 -17 1 Z`} fill="#2B1608" />
      <path d={`M122 ${106 + browTilt} q-10 -7 -19 -1 l1 3 q9 -4 17 1 Z`} fill="#2B1608" />
      {/* eyes */}
      <g className="char-eyes">
        <path d="M80 116 q8 -7 16 0 q-8 6 -16 0 Z" fill="#FFF8EE" />
        <path d="M104 116 q8 -7 16 0 q-8 6 -16 0 Z" fill="#FFF8EE" />
        <circle cx={88 + eyeShift} cy="116" r="3.4" fill="#2B1608" />
        <circle cx={112 + eyeShift} cy="116" r="3.4" fill="#2B1608" />
        <circle cx={89 + eyeShift} cy="115" r="1" fill="#fff" />
        <circle cx={113 + eyeShift} cy="115" r="1" fill="#fff" />
      </g>
      {/* nose */}
      <path d="M100 118 q-3 12 -6 16 q6 3 12 0" fill="none" stroke={p.skinShade} strokeWidth="2.2" strokeLinecap="round" />
      {children}
    </g>
  );
}

function Raja({ id }: { id: string }) {
  const gold = `url(#${id}-gold)`;
  return (
    <>
      {/* royal sherwani */}
      <path d="M14 250 C20 205 58 186 100 184 C142 186 180 205 186 250 Z" fill="#B91C1C" />
      <path d="M14 250 C20 205 58 186 100 184 C142 186 180 205 186 250 Z" fill="none" stroke={gold} strokeWidth="3" />
      <path d="M82 186 L100 250 L118 186 Z" fill="#7F1D1D" />
      <path d="M82 186 L100 232 L118 186" fill="none" stroke={gold} strokeWidth="5" strokeLinejoin="round" />
      {/* embroidery dots */}
      {[40, 58, 142, 160].map((x, i) => (
        <circle key={i} cx={x} cy={222 + (i % 2) * 8} r="3" fill={gold} />
      ))}
      {/* pearl necklaces */}
      {[0, 1].map((row) => (
        <path
          key={row}
          d={`M${78 - row * 6} ${190 + row * 2} Q100 ${222 + row * 12} ${122 + row * 6} ${190 + row * 2}`}
          fill="none"
          stroke="#FFF7E0"
          strokeWidth="4"
          strokeDasharray="0.1 6"
          strokeLinecap="round"
        />
      ))}
      <circle cx="100" cy="218" r="6" fill="#16A34A" stroke={gold} strokeWidth="2.5" />
      <Face role="raja">
        {/* grand handlebar moustache */}
        <path
          d="M100 137 c-8 -5 -18 -4 -24 2 c-6 6 -14 6 -18 -2 c0 10 10 16 20 12 c8 -3 14 -6 22 -6 c8 0 14 3 22 6 c10 4 20 -2 20 -12 c-4 8 -12 8 -18 2 c-6 -6 -16 -7 -24 -2 Z"
          fill="#2B1608"
        />
        <path d="M92 150 q8 5 16 0" fill="none" stroke="#7A2E14" strokeWidth="2.5" strokeLinecap="round" />
        {/* side hair */}
        <path d="M66 104 q-2 14 2 24 l4 -2 q-2 -12 0 -22 Z M134 104 q2 14 -2 24 l-4 -2 q2 -12 0 -22 Z" fill="#2B1608" />
      </Face>
      {/* crown */}
      <g className="char-crown">
        <path d="M64 96 L60 52 L78 72 L88 42 L100 66 L112 42 L122 72 L140 52 L136 96 Z" fill={gold} stroke="#8A5A00" strokeWidth="1.5" />
        <rect x="62" y="88" width="76" height="14" rx="4" fill={gold} stroke="#8A5A00" strokeWidth="1.5" />
        {[60, 88, 112, 140].map((x, i) => (
          <circle key={i} cx={x} cy={[52, 42, 42, 52][i]} r="4" fill="#FFF7E0" />
        ))}
        <circle cx="100" cy="64" r="4.5" fill="#FFF7E0" />
        <path d="M100 74 l7 9 -7 9 -7 -9 Z" fill="#DC2626" stroke="#FFF1B8" strokeWidth="1" />
        {[74, 126].map((x) => (
          <circle key={x} cx={x} cy="95" r="3.5" fill="#16A34A" />
        ))}
        <circle cx="100" cy="95" r="3.5" fill="#2563EB" />
      </g>
    </>
  );
}

function Mantri({ id }: { id: string }) {
  const gold = `url(#${id}-gold)`;
  return (
    <>
      {/* achkan */}
      <path d="M14 250 C20 205 58 186 100 184 C142 186 180 205 186 250 Z" fill="#6B21A8" />
      <path d="M92 186 h16 v64 h-16 Z" fill="#581C87" />
      <path d="M86 186 q14 10 28 0" fill="none" stroke={gold} strokeWidth="4" />
      {[202, 216, 230, 244].map((y) => (
        <circle key={y} cx="100" cy={y} r="3" fill={gold} />
      ))}
      {/* stole */}
      <path d="M40 210 q30 -14 46 -22 l4 10 q-22 12 -44 26 Z" fill={gold} opacity="0.85" />
      <path d="M160 210 q-30 -14 -46 -22 l-4 10 q22 12 44 26 Z" fill={gold} opacity="0.85" />
      <Face role="mantri" browTilt={3} eyeShift={1.5}>
        {/* neat moustache and pointed beard */}
        <path d="M84 140 q8 -6 16 -2 q8 -4 16 2 q-8 2 -16 0 q-8 2 -16 0 Z" fill="#3A2412" />
        <path d="M88 150 q12 6 24 0 q-2 18 -12 28 q-10 -10 -12 -28 Z" fill="#3A2412" />
        <path d="M95 146 q5 3 10 0" fill="none" stroke="#6B3416" strokeWidth="2" strokeLinecap="round" />
      </Face>
      {/* layered turban (pagdi) */}
      <g className="char-crown">
        <path d="M60 106 q-6 -44 40 -48 q46 4 40 48 q-40 -14 -80 0 Z" fill="#7E22CE" />
        <path d="M62 96 q38 -26 76 -6" fill="none" stroke="#C084FC" strokeWidth="5" />
        <path d="M64 84 q36 -26 70 -10" fill="none" stroke="#A855F7" strokeWidth="5" />
        <path d="M72 70 q28 -16 52 -6" fill="none" stroke="#C084FC" strokeWidth="4" />
        <path d="M60 106 q40 -12 80 0" fill="none" stroke={gold} strokeWidth="3" />
        {/* jewelled brooch with plume */}
        <path d="M104 72 q16 -30 4 -50 q-2 22 -10 36 Z" fill="#F5F3FF" opacity="0.9" />
        <circle cx="100" cy="78" r="7" fill={gold} />
        <circle cx="100" cy="78" r="3.5" fill="#10B981" />
        <path d="M100 85 v8" stroke="#FFF7E0" strokeWidth="3" strokeDasharray="0.1 4" strokeLinecap="round" />
      </g>
    </>
  );
}

function Sipahi({ id }: { id: string }) {
  const gold = `url(#${id}-gold)`;
  return (
    <>
      {/* police uniform */}
      <path d="M14 250 C20 205 58 186 100 184 C142 186 180 205 186 250 Z" fill="#1E3A8A" />
      <path d="M80 186 L100 214 L120 186 Z" fill="#DBEAFE" />
      <path d="M96 196 L100 236 L104 196 Z" fill="#0F172A" />
      <path d="M80 186 L96 214 L84 222 L70 192 Z M120 186 L104 214 L116 222 L130 192 Z" fill="#1E40AF" stroke="#0B1E4D" strokeWidth="1" />
      {/* epaulettes */}
      <rect x="28" y="198" width="34" height="10" rx="4" transform="rotate(-18 45 203)" fill="#172554" stroke={gold} strokeWidth="2" />
      <rect x="138" y="198" width="34" height="10" rx="4" transform="rotate(18 155 203)" fill="#172554" stroke={gold} strokeWidth="2" />
      {/* badge and lanyard */}
      <path d="M140 214 l6 -4 6 4 v8 q-6 6 -12 0 Z" fill={gold} />
      <path d="M126 196 q-10 26 -38 34" fill="none" stroke="#FDE68A" strokeWidth="2.5" />
      <Face role="sipahi" browTilt={-2}>
        {/* bushy moustache */}
        <path d="M80 142 q10 -10 20 -4 q10 -6 20 4 q-4 6 -12 4 q-4 -2 -8 -2 q-4 0 -8 2 q-8 2 -12 -4 Z" fill="#1F1208" />
        <path d="M93 152 h14" stroke="#6B3416" strokeWidth="2.5" strokeLinecap="round" />
      </Face>
      {/* peaked cap */}
      <g className="char-crown">
        <path d="M58 92 q-4 -22 42 -30 q46 8 42 30 Z" fill="#1E3A8A" />
        <path d="M62 80 q38 -18 76 0" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.6" />
        <rect x="64" y="90" width="72" height="12" rx="3" fill="#0F172A" />
        <rect x="64" y="92" width="72" height="3" fill="#DC2626" />
        <path d="M66 102 q34 14 68 0 q-34 4 -68 0 Z" fill="#020617" />
        {/* cap badge */}
        <path d="M100 66 l4.5 9 10 1.4 -7.3 7 1.8 10 -9 -4.8 -9 4.8 1.8 -10 -7.3 -7 10 -1.4 Z" fill={gold} stroke="#8A5A00" strokeWidth="1" />
        <circle cx="100" cy="79" r="3" fill="#1E3A8A" />
      </g>
    </>
  );
}

function Chor({ id }: { id: string }) {
  void id;
  return (
    <>
      {/* loot sack peeking over shoulder */}
      <path d="M140 196 q30 -30 44 -10 q10 20 -10 44 Z" fill="#8B5E34" />
      <path d="M150 190 q8 -8 16 -4" fill="none" stroke="#5B3A1E" strokeWidth="3" />
      <text x="162" y="214" fontSize="16" fontWeight="900" fill="#FDE68A" fontFamily="sans-serif">₹</text>
      {/* dark clothing */}
      <path d="M14 250 C20 205 58 186 100 184 C142 186 180 205 186 250 Z" fill="#111111" />
      <path d="M70 188 q30 22 60 0 l6 14 q-36 22 -72 0 Z" fill="#B91C1C" />
      <path d="M118 198 l14 28 -8 2 -10 -24 Z" fill="#991B1B" />
      <Face role="chor" eyeShift={-2.5} browTilt={-4}>
        {/* sly grin */}
        <path d="M88 147 q14 10 26 -2" fill="none" stroke="#3A1D0A" strokeWidth="3" strokeLinecap="round" />
        <path d="M112 145 l4 -3" stroke="#3A1D0A" strokeWidth="3" strokeLinecap="round" />
        {/* stubble */}
        <path d="M80 140 q20 34 40 0 q-2 22 -20 28 q-18 -6 -20 -28 Z" fill="#000" opacity="0.18" />
      </Face>
      {/* bandit mask over the eyes */}
      <path
        d="M66 108 q34 -10 68 0 v16 q-34 6 -68 0 Z"
        fill="#B91C1C"
      />
      <path d="M80 116 q8 -7 16 0 q-8 6 -16 0 Z M104 116 q8 -7 16 0 q-8 6 -16 0 Z" fill="#FFF8EE" />
      <circle cx="85.5" cy="116" r="3.4" fill="#111" />
      <circle cx="109.5" cy="116" r="3.4" fill="#111" />
      <circle cx="86.5" cy="115" r="1" fill="#fff" />
      <circle cx="110.5" cy="115" r="1" fill="#fff" />
      <path d="M134 110 q16 -2 22 10 q-12 -4 -22 4 Z" fill="#991B1B" />
      {/* hood */}
      <path
        d="M52 150 q-8 -96 48 -98 q56 2 48 98 q-6 -50 -14 -62 q-14 -18 -34 -18 q-20 0 -34 18 q-8 12 -14 62 Z"
        fill="#1A1A1A"
      />
      <path d="M66 82 q34 -26 68 0" fill="none" stroke="#333" strokeWidth="2" />
    </>
  );
}

const BODIES: Record<Role, (props: { id: string }) => React.ReactElement> = {
  raja: Raja,
  mantri: Mantri,
  sipahi: Sipahi,
  chor: Chor,
};

export function CharacterArt({ role, className }: { role: Role; className?: string }) {
  const id = useId().replace(/:/g, "");
  const Body = BODIES[role];
  return (
    <svg viewBox="0 0 200 250" className={className} role="img" aria-label={role} preserveAspectRatio="xMidYMid slice">
      <Backdrop id={id} role={role} />
      <Body id={id} />
      <rect width="200" height="250" fill={`url(#${id}-fade)`} />
    </svg>
  );
}

/** Ornate face-down card back. */
export function CardBack({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 250" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}-b`} cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#2A1F5C" />
          <stop offset="100%" stopColor="#0A0F24" />
        </radialGradient>
        <pattern id={`${id}-p`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="none" stroke="#FFC83D" strokeOpacity="0.14" />
          <circle cx="10" cy="10" r="1.4" fill="#FFC83D" fillOpacity="0.25" />
        </pattern>
      </defs>
      <rect width="200" height="250" fill={`url(#${id}-b)`} />
      <rect width="200" height="250" fill={`url(#${id}-p)`} />
      <rect x="12" y="12" width="176" height="226" rx="10" fill="none" stroke="#FFC83D" strokeOpacity="0.55" strokeWidth="2" />
      <rect x="20" y="20" width="160" height="210" rx="7" fill="none" stroke="#FFC83D" strokeOpacity="0.25" />
      <circle cx="100" cy="125" r="46" fill="#0A0F24" stroke="#FFC83D" strokeWidth="3" />
      <circle cx="100" cy="125" r="38" fill="none" stroke="#FFC83D" strokeOpacity="0.4" strokeDasharray="2 5" />
      <path d="M78 116 L74 96 L86 106 L100 88 L114 106 L126 96 L122 116 Z" fill="#FFC83D" />
      <text x="100" y="152" textAnchor="middle" fontSize="30" fontWeight="800" fill="#FFC83D" fontFamily="var(--font-display), serif">?</text>
    </svg>
  );
}
