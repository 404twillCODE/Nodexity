'use client';

import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: 'Online' | 'Offline' | 'Restarting';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isOnline = status === 'Online';
  const isRestarting = status === 'Restarting';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const getStatusClasses = () => {
    if (isOnline) {
      return 'bg-accent/20 text-accent';
    }
    if (isRestarting) {
      return 'bg-accent/30 text-accent';
    }
    return 'bg-foreground/10 text-muted';
  };

  return (
    <motion.span
      className={`${sizeClasses[size]} rounded font-medium ${getStatusClasses()}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        ...(isRestarting && {
          opacity: [1, 0.7, 1],
        }),
      }}
      transition={{
        duration: isRestarting ? 1.5 : 0.2,
        repeat: isRestarting ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      {status}
    </motion.span>
  );
}

