"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CrownIcon } from "./ui";

export function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  if (size === "sm") {
    return (
      <Link href="/" className="logo logo--sm" aria-label="Chor Police home">
        <CrownIcon size={18} className="logo__crown-sm" />
        <span>CHOR</span>
        <span>POLICE</span>
      </Link>
    );
  }
  return (
    <div className="logo logo--lg">
      <motion.div
        className="logo__crown"
        initial={{ y: -60, opacity: 0, rotate: -20 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 12 }}
      >
        <CrownIcon size={64} />
      </motion.div>
      <motion.h1
        initial={{ scale: 0.6, opacity: 0, filter: "blur(12px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.2, 0.9, 0.3, 1.2] }}
      >
        <span className="logo__word">CHOR</span>
        <span className="logo__word">POLICE</span>
      </motion.h1>
    </div>
  );
}
