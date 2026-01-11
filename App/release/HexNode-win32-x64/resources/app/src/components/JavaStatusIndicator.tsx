import { motion } from "framer-motion";
import { useServerManager } from "../hooks/useServerManager";

export default function JavaStatusIndicator() {
  const { javaStatus } = useServerManager();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex items-center gap-2 px-3 py-1.5 border border-border bg-background-secondary rounded"
    >
      <motion.div
        className={`h-1.5 w-1.5 rounded-full ${
          javaStatus.installed ? "bg-accent" : "bg-text-muted"
        }`}
        animate={{
          opacity: javaStatus.loading ? [1, 0.5, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: javaStatus.loading ? Infinity : 0,
        }}
      />
      <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">
        {javaStatus.loading
          ? "CHECKING JAVA..."
          : javaStatus.installed
          ? `JAVA ${javaStatus.version || "OK"}`
          : "JAVA NOT FOUND"}
      </span>
    </motion.div>
  );
}

