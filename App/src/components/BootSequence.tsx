import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootLine {
  text: string;
  delay: number;
}

const bootLines: BootLine[] = [
  { text: "HexNode Server Manager", delay: 0 },
  { text: "> Initializing core systems...", delay: 500 },
  { text: "> Server Manager... OK", delay: 1100 },
  { text: "> Process Controller... OK", delay: 1700 },
  { text: "> Console Interface... OK", delay: 2300 },
  { text: "> File System... OK", delay: 2900 },
  { text: "System ready.", delay: 3500 },
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
      }, 30);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
    }
  }, [displayedText, text, isComplete, startTyping]);

  if (!startTyping) return null;

  return (
    <span className="terminal-text">
      {displayedText}
      {!isComplete && (
        <span className="terminal-cursor">█</span>
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

    const timeouts: NodeJS.Timeout[] = [];
    bootLines.forEach((line, index) => {
      const timeout = setTimeout(() => {
        setCurrentLineIndex(index + 1);
        if (index === bootLines.length - 1) {
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

  const handleSkip = () => {
    setIsSkipped(true);
    setIsComplete(true);
    if (onComplete) {
      onComplete();
    }
  };

  useEffect(() => {
    const handleKeyPress = () => {
      if (isVisible && !isComplete) {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isVisible, isComplete]);

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
          <div className="terminal-loader">
            <div className="terminal-header">
              <div className="terminal-title">HexNode</div>
              <div className="terminal-controls">
                <div className="control close"></div>
                <div className="control minimize"></div>
                <div className="control maximize"></div>
              </div>
            </div>
            <div className="terminal-content">
              <div className="space-y-0.5">
                {visibleLines.map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="whitespace-pre terminal-line"
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
                  className="mt-4 text-[10px] uppercase tracking-wider terminal-skip"
                >
                  Press any key or click to skip
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

