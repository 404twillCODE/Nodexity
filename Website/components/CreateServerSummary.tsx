'use client';

import { motion } from "framer-motion";
import { fadeUp, fadeUpTransition } from "@/components/motionVariants";

interface CreateServerSummaryProps {
  serverType: string | null;
  version: string | null;
  ramAllocation: number;
  totalPool: number;
  currentlyUsed: number;
}

export default function CreateServerSummary({
  serverType,
  version,
  ramAllocation,
  totalPool,
  currentlyUsed,
}: CreateServerSummaryProps) {
  const ramInGB = ramAllocation / 1024;
  const remainingAfter = totalPool - currentlyUsed - ramInGB;

  return (
    <motion.div
      className="p-6 border border-foreground/10 rounded-lg bg-foreground/5"
      variants={fadeUp}
      transition={fadeUpTransition}
      initial="hidden"
      animate="visible"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Summary
      </h3>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <span className="text-muted">Server Type:</span>
          <span className="text-foreground">{serverType || 'Not selected'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Version:</span>
          <span className="text-foreground">{version || 'Not selected'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">RAM Allocation:</span>
          <span className="text-foreground">{ramInGB.toFixed(2)} GB</span>
        </div>
        <div className="pt-3 border-t border-foreground/10">
          <div className="flex justify-between">
            <span className="text-muted">Remaining Pool:</span>
            <span className="text-foreground font-medium">
              {remainingAfter.toFixed(2)} GB
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

