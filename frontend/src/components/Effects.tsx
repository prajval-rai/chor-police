"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type EffectKind = "confetti" | "fireworks" | "gold" | "purple" | "blue" | "red" | "green";

const COLORS: Record<EffectKind, string[]> = {
  confetti: ["#FFC83D", "#A855F7", "#3B82F6", "#EF4444", "#22C55E", "#F472B6"],
  fireworks: ["#FFC83D", "#FFE08A", "#F472B6", "#60A5FA", "#A855F7", "#4ADE80"],
  gold: ["#FFC83D", "#FFE08A", "#FFB800", "#FFF7E0"],
  purple: ["#A855F7", "#C084FC", "#E9D5FF", "#7E22CE"],
  blue: ["#3B82F6", "#93C5FD", "#DBEAFE", "#1D4ED8"],
  red: ["#EF4444", "#F87171", "#7F1D1D", "#111111"],
  green: ["#22C55E", "#86EFAC", "#FFC83D", "#DCFCE7"],
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
  angle: number;
  shape: "rect" | "dot";
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Lightweight full-screen canvas particle effect. Plays for `duration` ms
 * then stops drawing. Renders nothing when reduced motion is requested.
 */
export function Effect({ kind, duration = 3500 }: { kind: EffectKind; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const colors = COLORS[kind];
    const pick = () => colors[Math.floor(Math.random() * colors.length)];
    const particles: Particle[] = [];
    const small = W() < 640;

    const spawn = (p: Partial<Particle>) =>
      particles.push({
        x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 120, size: 6,
        color: pick(), spin: (Math.random() - 0.5) * 0.3, angle: Math.random() * 6,
        shape: "rect", ...p,
      });

    const confettiBurst = (count: number) => {
      for (let i = 0; i < count; i++) {
        const fromLeft = i % 2 === 0;
        spawn({
          x: fromLeft ? -10 : W() + 10,
          y: H() * (0.55 + Math.random() * 0.3),
          vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9),
          vy: -(10 + Math.random() * 10),
          max: 160 + Math.random() * 60,
          size: 6 + Math.random() * 6,
        });
      }
    };

    const firework = () => {
      const cx = W() * (0.15 + Math.random() * 0.7);
      const cy = H() * (0.12 + Math.random() * 0.35);
      const color = pick();
      const n = small ? 40 : 70;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const s = 2 + Math.random() * 4;
        spawn({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, max: 70 + Math.random() * 30, size: 2.4, color, shape: "dot" });
      }
    };

    const aura = (count: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 5;
        spawn({
          x: W() / 2, y: H() * 0.45,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
          max: 90 + Math.random() * 70, size: 2 + Math.random() * 3.5, shape: "dot",
        });
      }
    };

    const start = performance.now();
    let lastSpawn = 0;
    if (kind === "confetti" || kind === "green") confettiBurst(small ? 90 : 160);
    else if (kind === "fireworks") confettiBurst(small ? 60 : 110);
    else aura(small ? 80 : 140);

    let raf = 0;
    const frame = (now: number) => {
      const elapsed = now - start;
      if (kind === "fireworks" && elapsed < duration - 800 && now - lastSpawn > 450) {
        firework();
        lastSpawn = now;
      }
      if (["gold", "purple", "blue", "red"].includes(kind) && elapsed < duration - 1000 && now - lastSpawn > 120) {
        aura(small ? 3 : 6);
        lastSpawn = now;
      }
      ctx.clearRect(0, 0, W(), H());
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.shape === "rect") {
          p.vy += 0.35;
          p.vx *= 0.985;
          p.vy *= 0.985;
        } else {
          p.vy += kind === "fireworks" ? 0.05 : -0.01;
          p.vx *= 0.97;
          p.vy *= 0.97;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        const alpha = Math.max(0, 1 - p.life / p.max);
        if (alpha <= 0 || p.y > H() + 40) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
      if (elapsed < duration || particles.length) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [kind, duration]);

  // Portal to <body>: a fixed canvas inside a transformed (animating) parent
  // would be positioned relative to that parent instead of the viewport.
  if (typeof document === "undefined") return null;
  return createPortal(<canvas ref={ref} className="effect-canvas" aria-hidden />, document.body);
}
