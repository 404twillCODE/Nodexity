import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BootSequence from "./components/BootSequence";
import SetupView from "./components/SetupView";
import SetupOptionsView from "./components/SetupOptionsView";
import Sidebar from "./components/Sidebar";
import ServerList from "./components/ServerList";
import ServerDetailView from "./components/ServerDetailView";
import SettingsView from "./components/SettingsView";
import TitleBar from "./components/TitleBar";

type View = "servers" | "settings" | "server-detail";
type SetupStep = "boot" | "detection" | "options" | "complete";

function App() {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>("boot");
  const [bootComplete, setBootComplete] = useState(false);
  const [currentView, setCurrentView] = useState<View>("servers");
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    if (!window.electronAPI) {
      setSetupComplete(true); // Skip setup if API not available
      return;
    }

    try {
      const isComplete = await window.electronAPI.server.isSetupComplete();
      setSetupComplete(isComplete);
    } catch (error) {
      console.error('Failed to check setup status:', error);
      setSetupComplete(true); // Default to skipping setup on error
    }
  };

  const handleBootComplete = () => {
    if (!setupComplete) {
      setSetupStep("detection");
    } else {
      setBootComplete(true);
    }
  };

  const handleDetectionNext = () => {
    setSetupStep("options");
  };

  const handleSetupComplete = () => {
    setSetupComplete(true);
    setSetupStep("complete");
    setBootComplete(true);
  };

  const handleServerClick = (serverName: string) => {
    setSelectedServer(serverName);
    setCurrentView("server-detail");
  };

  const handleBackToServers = () => {
    setSelectedServer(null);
    setCurrentView("servers");
  };

  const renderView = () => {
    if (currentView === "server-detail" && selectedServer) {
      return <ServerDetailView serverName={selectedServer} onBack={handleBackToServers} />;
    }

    switch (currentView) {
      case "servers":
        return <ServerList onServerClick={handleServerClick} />;
      case "settings":
        return <SettingsView />;
      default:
        return <ServerList onServerClick={handleServerClick} />;
    }
  };

  // Show loading state while checking setup status
  if (setupComplete === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary font-mono text-sm">
          Initializing...
        </div>
      </div>
    );
  }

  // Show boot sequence first if setup not complete
  if (!setupComplete && setupStep === "boot") {
    return (
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <BootSequence onComplete={handleBootComplete} />
      </div>
    );
  }

  // Show system detection after boot
  if (!setupComplete && setupStep === "detection") {
    return (
      <AnimatePresence>
        <SetupView onNext={handleDetectionNext} />
      </AnimatePresence>
    );
  }

  // Show setup options after detection
  if (!setupComplete && setupStep === "options") {
    return (
      <AnimatePresence>
        <SetupOptionsView onComplete={handleSetupComplete} />
      </AnimatePresence>
    );
  }

  // Show boot sequence, then main app (for completed setup)
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <BootSequence onComplete={handleBootComplete} />
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
              {currentView !== "server-detail" && (
                <Sidebar currentView={currentView as "servers" | "settings"} onViewChange={setCurrentView} />
              )}
              <motion.main
                key={currentView + (selectedServer || '')}
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

