'use client';

import { motion } from "framer-motion";
import { fadeUp, fadeUpTransition } from "@/components/motionVariants";

interface RamSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  totalPool: number;
  currentlyUsed: number;
}

export default function RamSlider({
  value,
  onChange,
  min,
  max,
  totalPool,
  currentlyUsed,
}: RamSliderProps) {
  const availableAfter = max - value;
  const isMax = value === max;
  const valueInGB = value / 1024;

  return (
    <motion.div
      className="flex flex-col gap-4"
      variants={fadeUp}
      transition={fadeUpTransition}
    >
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">
          RAM Allocation
        </label>
        <span className="text-sm text-muted">
          Allocating: {valueInGB.toFixed(2)} GB
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={256}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-accent"
          style={{
            background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-muted">
          Available after creation: {(availableAfter / 1024).toFixed(2)} GB
        </span>
      </div>
      {isMax && (
        <motion.p
          className="text-sm text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          This will use all remaining available RAM.
        </motion.p>
      )}
    </motion.div>
  );
}

