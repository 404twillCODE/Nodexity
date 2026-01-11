import { motion } from "framer-motion";

export default function SettingsView() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          SETTINGS
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          Configure system preferences
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
        className="system-card p-8 text-center"
      >
        <p className="text-text-muted font-mono text-sm">
          Settings panel coming soon
        </p>
      </motion.div>
    </div>
  );
}

