"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootLine {
  text: string;
  delay: number;
}

const bootLines: BootLine[] = [
  { text: "HexNode System Initialization", delay: 0 },
  { text: "> Initializing modules...", delay: 500 },
  { text: "> Server Software... OK", delay: 1100 },
  { text: "> Recycle Host... Planned", delay: 1700 },
  { text: "> Hosting... Planned", delay: 2300 },
  { text: "System ready.", delay: 2900 },
];

interface BootSequenceProps {
  onComplete?: () => void;
}

function TypingText({ text, startTyping }: { text: string; startTyping: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!startTyping) {
      setDisplayedText("");
      setIsComplete(false);
      return;
    }

    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 30); // 30ms per character for typing effect

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
    }
  }, [displayedText, text, isComplete, startTyping]);

  if (!startTyping) return null;

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="inline-block w-2 h-4 bg-accent ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Show lines sequentially
    const timeouts: NodeJS.Timeout[] = [];
    bootLines.forEach((line, index) => {
      const timeout = setTimeout(() => {
        setCurrentLineIndex(index + 1);
        if (index === bootLines.length - 1) {
          // Wait for typing to complete + a bit more
          setTimeout(() => {
            setIsComplete(true);
            if (onComplete) {
              onComplete();
            }
          }, 500);
        }
      }, line.delay);
      timeouts.push(timeout);
    });

    // Auto-complete after max duration (accounting for typing)
    const maxTimeout = setTimeout(() => {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }, 5000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(maxTimeout);
    };
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setIsSkipped(true);
    setIsComplete(true);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isVisible && !isComplete) {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isVisible, isComplete, handleSkip]);

  if (!isVisible) return null;

  const visibleLines = bootLines.slice(0, currentLineIndex);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          onClick={handleSkip}
        >
          <div className="font-mono text-sm text-text-secondary">
            <div className="space-y-0.5">
              {visibleLines.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="whitespace-pre"
                >
                  {index === visibleLines.length - 1 && !isSkipped ? (
                    <TypingText text={line.text} startTyping={currentLineIndex === index + 1} />
                  ) : (
                    line.text
                  )}
                </motion.div>
              ))}
            </div>
            {!isSkipped && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 text-[10px] uppercase tracking-wider text-text-muted"
              >
                Press any key or click to skip
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
