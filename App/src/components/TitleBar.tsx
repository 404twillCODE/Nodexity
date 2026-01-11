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
      <div className="flex items-center gap-2 -webkit-app-region-no-drag">
        <motion.button
          onClick={handleMinimize}
          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          className="h-4 w-4 rounded-full bg-text-muted/20"
        />
        <motion.button
          onClick={handleMaximize}
          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          className="h-4 w-4 rounded-full bg-text-muted/20"
        />
        <motion.button
          onClick={handleClose}
          whileHover={{ backgroundColor: "rgba(255, 0, 0, 0.3)" }}
          className="h-4 w-4 rounded-full bg-text-muted/20"
        />
      </div>
    </div>
  );
}

