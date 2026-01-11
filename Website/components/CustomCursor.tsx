"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(false);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const trailX = useMotionValue(0);
  const trailY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 400 };
  const cursorSpringX = useSpring(cursorX, springConfig);
  const cursorSpringY = useSpring(cursorY, springConfig);
  const trailSpringX = useSpring(trailX, springConfig);
  const trailSpringY = useSpring(trailY, springConfig);

  // All hooks must be called before any conditional returns
  const trailXTransformed = useTransform(trailSpringX, (x) => x - 24);
  const trailYTransformed = useTransform(trailSpringY, (y) => y - 24);
  const cursorXTransformed = useTransform(cursorSpringX, (x) => x - 1.5);
  const cursorYTransformed = useTransform(cursorSpringY, (y) => y - 1.5);

  useEffect(() => {
    // Check if desktop (has mouse)
    const checkDesktop = () => {
      const isFinePointer = window.matchMedia("(pointer: fine)").matches;
      setIsDesktop(isFinePointer);
    };
    
    checkDesktop();
    window.addEventListener("resize", checkDesktop);

    const updateCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      setTimeout(() => {
        trailX.set(e.clientX);
        trailY.set(e.clientY);
      }, 50);
    };

    // Only add listeners if desktop
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", updateCursor);
    }

    return () => {
      window.removeEventListener("resize", checkDesktop);
      window.removeEventListener("mousemove", updateCursor);
    };
  }, [cursorX, cursorY, trailX, trailY]);

  if (!isDesktop) return null;

  if (!isDesktop) return null;

  return (
    <>
      {/* Cursor trail - interacts with grid */}
      <motion.div
        style={{
          x: trailXTransformed,
          y: trailYTransformed,
        }}
        className="fixed top-0 left-0 w-12 h-12 pointer-events-none z-[9999]"
      >
        <div 
          className="w-full h-full rounded-full border border-accent/40 bg-accent/15 blur-md"
          style={{
            boxShadow: `0 0 20px rgba(46, 242, 162, 0.2), 
                       0 0 40px rgba(46, 242, 162, 0.1),
                       inset 0 0 20px rgba(46, 242, 162, 0.1)`,
          }}
        />
      </motion.div>
      
      {/* Main cursor */}
      <motion.div
        style={{
          x: cursorXTransformed,
          y: cursorYTransformed,
        }}
        className="fixed top-0 left-0 w-3 h-3 pointer-events-none z-[9999]"
      >
        <div 
          className="w-full h-full rounded-full bg-accent"
          style={{
            boxShadow: `0 0 10px rgba(46, 242, 162, 0.8),
                       0 0 20px rgba(46, 242, 162, 0.4)`,
          }}
        />
      </motion.div>
    </>
  );
}

