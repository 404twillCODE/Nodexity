// Premium easing curves
export const easeOut = [0.4, 0, 0.2, 1];
export const easeInOut = [0.4, 0, 0.2, 1];

// Hero section variants with scale and blur
export const heroFadeUp = {
  hidden: { 
    opacity: 0, 
    y: 12,
    scale: 0.98,
    filter: "blur(6px)",
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
};

export const heroTransition = {
  duration: 0.7,
  ease: easeOut,
};

export const heroStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Section variants
export const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const fadeUpTransition = {
  duration: 0.7,
  ease: easeOut,
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeInTransition = {
  duration: 0.6,
  ease: easeInOut,
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Button interactions
export const buttonHover = {
  y: -2,
  scale: 1.01,
};

export const buttonTap = {
  y: 0,
  scale: 0.99,
};

export const buttonTransition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
};

