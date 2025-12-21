'use client';

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export default function ScrollIndicator() {
  const controls = useAnimation();

  const handleScroll = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Initial fade-in and then start bounce animation
    controls.start({
      opacity: [0, 0.6],
      y: [8, 0],
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      },
    }).then(() => {
      // After fade-in, start the bounce animation
      controls.start({
        y: [0, 4, 0],
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        },
      });
    });
  }, [controls]);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center">
      <motion.button
        onClick={handleScroll}
        className="text-muted opacity-60 hover:opacity-100 hover:text-foreground transition-opacity transition-colors cursor-pointer"
        aria-label="Scroll to next section"
        initial={{ opacity: 0, y: 8 }}
        animate={controls}
        onHoverStart={() => controls.stop()}
        onHoverEnd={() => {
          controls.start({
            y: [0, 4, 0],
            transition: {
              duration: 4,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
            },
          });
        }}
        whileHover={{ y: -3 }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.button>
    </div>
  );
}

