'use client';

import { motion } from "framer-motion";

interface ResourceBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  percentage?: number;
}

export default function ResourceBar({
  label,
  value,
  max,
  unit = 'GB',
  percentage,
}: ResourceBarProps) {
  const displayPercentage = percentage ?? (value / max) * 100;
  const displayValue = unit === '%' ? `${value}%` : `${value} / ${max} ${unit}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm text-muted">{displayValue}</span>
      </div>
      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${displayPercentage}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

