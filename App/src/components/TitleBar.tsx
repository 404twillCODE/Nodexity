import { motion } from "framer-motion";

export default function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI?.windowControls?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowControls?.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.windowControls?.close();
  };

  return (
    <div className="h-10 bg-background-secondary border-b border-border flex items-center justify-between px-4 -webkit-app-region-drag">
      <div className="flex items-center gap-2 -webkit-app-region-drag">
        <div className="h-2 w-2 bg-accent rounded-sm"></div>
        <span className="text-xs font-mono text-text-secondary tracking-[0.2em]">HEXNODE</span>
      </div>
      <div className="flex items-center gap-2 -webkit-app-region-no-drag">
        {/* Minimize Button */}
        <motion.button
          onClick={handleMinimize}
          className="titlebar-btn titlebar-btn--minimize"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="titlebar-icon"
          >
            <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.button>

        {/* Maximize Button */}
        <motion.button
          onClick={handleMaximize}
          className="titlebar-btn titlebar-btn--maximize"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="titlebar-icon"
          >
            <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </motion.button>

        {/* Close Button */}
        <motion.button
          onClick={handleClose}
          className="titlebar-btn titlebar-btn--close"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            className="titlebar-icon"
          >
            <path
              d="M3 3L9 9M9 3L3 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

