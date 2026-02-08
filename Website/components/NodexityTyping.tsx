"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface HexNodeTypingProps {
  onComplete?: () => void;
}

export default function HexNodeTyping({ onComplete }: HexNodeTypingProps) {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "HEXNODE";
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 120); // 120ms per letter

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) {
        setTimeout(() => onComplete(), 300);
      }
    }
  }, [displayedText, fullText, isComplete, onComplete]);

  return (
    <motion.h1
      className="hero-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        animate={isComplete ? { scale: [1, 1.05, 1] } : {}}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1], // Spring with overshoot
        }}
      >
        {displayedText}
      </motion.span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="inline-block w-0.5 h-4 bg-white ml-1.5 align-baseline"
        style={{ 
          fontWeight: 700,
          verticalAlign: 'baseline',
        }}
      />
    </motion.h1>
  );
}

