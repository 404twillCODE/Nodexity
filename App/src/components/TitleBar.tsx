import { motion } from "framer-motion";

declare global {
  interface Window {
    electronAPI?: {
      windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
    };
  }
}

export default function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI?.windowControls.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowControls.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.windowControls.close();
  };

  return (
    <div className="h-8 bg-background-secondary border-b border-border flex items-center justify-between px-4 -webkit-app-region-drag">
      <div className="flex items-center gap-2 -webkit-app-region-drag">
        <div className="h-1.5 w-1.5 bg-accent rounded-full"></div>
        <span className="text-xs font-mono text-text-secondary">HEXNODE</span>
      </div>
      <div className="flex items-center gap-1 -webkit-app-region-no-drag">
        {/* Minimize Button */}
        <motion.button
          onClick={handleMinimize}
          className="h-8 w-8 flex items-center justify-center rounded transition-colors hover:bg-white/10 group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-text-secondary group-hover:text-text-primary transition-colors"
          >
            <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.button>

        {/* Maximize Button */}
        <motion.button
          onClick={handleMaximize}
          className="h-8 w-8 flex items-center justify-center rounded transition-colors hover:bg-white/10 group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-text-secondary group-hover:text-text-primary transition-colors"
          >
            <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </motion.button>

        {/* Close Button */}
        <motion.button
          onClick={handleClose}
          className="h-8 w-8 flex items-center justify-center rounded transition-colors hover:bg-red-500/20 group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-text-secondary group-hover:text-red-400 transition-colors"
          >
            <path
              d="M3 3L9 9M9 3L3 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

