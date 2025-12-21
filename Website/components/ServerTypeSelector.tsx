'use client';

import { motion } from "framer-motion";
import { fadeUp, fadeUpTransition } from "@/components/motionVariants";

interface ServerTypeSelectorProps {
  selected: string | null;
  onSelect: (type: string) => void;
}

const serverTypes = ['Paper', 'Fabric', 'Forge', 'Proxy (Velocity)'];

export default function ServerTypeSelector({ selected, onSelect }: ServerTypeSelectorProps) {
  return (
    <motion.div
      className="flex flex-col gap-3"
      variants={fadeUp}
      transition={fadeUpTransition}
    >
      <label className="text-sm font-medium text-foreground">
        Server Type
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {serverTypes.map((type) => (
          <motion.button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`p-4 border rounded-lg text-left transition-colors ${
              selected === type
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-foreground/10 text-foreground hover:border-foreground/20 hover:bg-foreground/5'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-medium">{type}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

