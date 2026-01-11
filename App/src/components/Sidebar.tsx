import { motion } from "framer-motion";

type View = "servers" | "worlds" | "console" | "settings";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const menuItems: { id: View; label: string }[] = [
  { id: "servers", label: "SERVERS" },
  { id: "worlds", label: "WORLDS" },
  { id: "console", label: "CONSOLE" },
  { id: "settings", label: "SETTINGS" },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-background-secondary h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="text-lg font-semibold text-text-primary font-mono"
        >
          HEXNODE
        </motion.h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
            onClick={() => onViewChange(item.id)}
            className={`w-full text-left px-4 py-3 text-sm font-mono uppercase tracking-wider transition-all ${
              currentView === item.id
                ? "text-accent bg-accent/10 border-l-2 border-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {item.label}
          </motion.button>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="text-xs text-text-muted font-mono uppercase tracking-wider">
          System v0.1.0
        </div>
      </div>
    </div>
  );
}

