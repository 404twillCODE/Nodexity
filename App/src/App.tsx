import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BootSequence from "./components/BootSequence";
import Sidebar from "./components/Sidebar";
import ServerList from "./components/ServerList";
import ConsolePanel from "./components/ConsolePanel";
import WorldsView from "./components/WorldsView";
import SettingsView from "./components/SettingsView";
import TitleBar from "./components/TitleBar";

type View = "servers" | "worlds" | "console" | "settings";

function App() {
  const [bootComplete, setBootComplete] = useState(false);
  const [currentView, setCurrentView] = useState<View>("servers");

  const renderView = () => {
    switch (currentView) {
      case "servers":
        return <ServerList />;
      case "worlds":
        return <WorldsView />;
      case "console":
        return <ConsolePanel />;
      case "settings":
        return <SettingsView />;
      default:
        return <ServerList />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <BootSequence onComplete={() => setBootComplete(true)} />
      <AnimatePresence>
        {bootComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-full"
          >
            <TitleBar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar currentView={currentView} onViewChange={setCurrentView} />
              <motion.main
                key={currentView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="flex-1 overflow-hidden"
              >
                {renderView()}
              </motion.main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

