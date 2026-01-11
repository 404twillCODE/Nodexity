import { motion } from "framer-motion";

type Status = "ACTIVE" | "STOPPED" | "PLANNED";

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "ACTIVE":
        return "bg-accent";
      case "STOPPED":
        return "bg-text-muted";
      case "PLANNED":
        return "bg-border";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex items-center gap-2"
    >
      <motion.div
        className={`h-1.5 w-1.5 rounded-full ${getStatusColor()}`}
        animate={{
          opacity: status === "ACTIVE" ? [1, 0.5, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: status === "ACTIVE" ? Infinity : 0,
        }}
      />
      <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">
        {status}
      </span>
    </motion.div>
  );
}

