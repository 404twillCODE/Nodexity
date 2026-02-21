import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import BootSequence from "./components/BootSequence";
import SetupView from "./components/SetupView";
import SetupOptionsView from "./components/SetupOptionsView";
import Sidebar from "./components/Sidebar";
import ServerList from "./components/ServerList";
import ServerDetailView from "./components/ServerDetailView";
import SettingsView from "./components/SettingsView";
import ConnectTunnelsView from "./components/ConnectTunnelsView";
import TitleBar from "./components/TitleBar";
import { ToastProvider, useToast } from "./components/ToastProvider";

type View = "servers" | "settings" | "playit" | "server-detail";

/** Listens for update-available and shows in-app toast (must be inside ToastProvider). */
function UpdateNotifier() {
  const { notify } = useToast();
  const [settings, setSettings] = useState<import("@/hooks/useServerManager").AppSettings>({});

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    const load = async () => {
      const s = await api.server.getAppSettings();
      setSettings(s || {});
    };
    load();
    const unsub = api.server?.onAppSettingsUpdated?.(setSettings);
    return () => { unsub?.(); };
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.server?.onUpdateAvailable) return;
    const handle = (payload: { version: string; url: string }) => {
      if (settings?.notifications?.updates === false) return;
      notify({ type: "info", title: "Update available", message: `Nodexity ${payload.version} is available.` });
    };
    const unsub = window.electronAPI.server.onUpdateAvailable(handle);
    return () => { unsub?.(); };
  }, [notify, settings?.notifications?.updates]);

  return null;
}
type SetupStep = "boot" | "detection" | "options" | "complete";

function App() {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>("boot");
  const [bootComplete, setBootComplete] = useState(false);
  const [currentView, setCurrentView] = useState<View>("servers");
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const sidebarView = currentView === "server-detail" ? "servers" : currentView;
  const [appSettings, setAppSettings] = useState<import("@/hooks/useServerManager").AppSettings>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const setupFinalizedRef = useRef(false);
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [setupFinalizing, setSetupFinalizing] = useState(false);
  const [setupFinalizingStatus, setSetupFinalizingStatus] = useState("Setting up your dashboard...");

  useEffect(() => {
    checkSetupStatus();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) {
        setSettingsLoaded(true);
        return;
      }
      try {
        const settings = await window.electronAPI.server.getAppSettings();
        setAppSettings(settings || {});
      } catch (error) {
        console.error('Failed to load app settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    const handleSettingsUpdate = (updated: import("@/hooks/useServerManager").AppSettings) => {
      setAppSettings(updated || {});
    };

    loadSettings();

    const unsubscribe = window.electronAPI?.server?.onAppSettingsUpdated?.(handleSettingsUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!setupComplete) return;
    setSetupStep("complete");
    setBootComplete(true);
    setCurrentView("servers");
    setSelectedServer(null);
    setSetupFinalizing(false);
    setSetupFinalizingStatus("Setting up your dashboard...");
  }, [setupComplete]);

  useEffect(() => {
    const onClosePrompt = window.electronAPI?.windowControls?.onClosePrompt;
    if (!onClosePrompt) return;
    const unsubscribe = onClosePrompt(() => {
      setShowClosePrompt(true);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const respondToClosePrompt = (confirmed: boolean) => {
    setShowClosePrompt(false);
    window.electronAPI?.windowControls?.respondToClosePrompt?.(confirmed);
  };

  const renderClosePrompt = () => {
    if (!showClosePrompt) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
        <div className="system-card w-full max-w-md p-6">
          <div className="text-lg font-semibold text-text-primary font-mono mb-3">
            Close Nodexity
          </div>
          <div className="text-sm text-text-secondary font-mono mb-2">
            Are you sure you want to close the program?
          </div>
          <div className="text-xs text-text-muted font-mono mb-6">
            All servers will stop.
          </div>
          <div className="flex justify-end gap-3">
            <motion.button
              onClick={() => respondToClosePrompt(false)}
              className="btn-secondary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              CANCEL
            </motion.button>
            <motion.button
              onClick={() => respondToClosePrompt(true)}
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              CLOSE
            </motion.button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!settingsLoaded) return;
    const shouldShowBoot = appSettings?.showBootSequence !== false;
    const setupFinished = !!setupComplete || setupFinalizedRef.current;
    if (!shouldShowBoot) {
      if (!setupFinished) {
        setSetupStep("detection");
      } else {
        setBootComplete(true);
      }
    }
  }, [settingsLoaded, appSettings?.showBootSequence, setupComplete]);

  const checkSetupStatus = async () => {
    if (!window.electronAPI) {
      setSetupComplete(true); // Skip setup if API not available
      return;
    }

    try {
      const isComplete = await window.electronAPI.server.isSetupComplete();
      setSetupComplete((prev) => {
        if (prev) return true;
        if (setupFinalizedRef.current) return true;
        return isComplete;
      });
      if (isComplete) {
        setupFinalizedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
      setSetupComplete(true); // Default to skipping setup on error
    }
  };

  const handleBootComplete = () => {
    const setupFinished = !!setupComplete || setupFinalizedRef.current;
    if (!setupFinished) {
      setSetupStep("detection");
    } else {
      setBootComplete(true);
    }
  };

  const handleDetectionNext = () => {
    setSetupStep("options");
  };

  const handleSetupComplete = () => {
    setupFinalizedRef.current = true;
    setSetupComplete(true);
    setSetupStep("complete");
    setBootComplete(true);
    setSetupFinalizing(false);
    setSetupFinalizingStatus("Setting up your dashboard...");
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
      case "playit":
        return <ConnectTunnelsView />;
      default:
        return <ServerList onServerClick={handleServerClick} />;
    }
  };

  // Show loading state while checking setup status
  if (setupComplete === null || !settingsLoaded) {
    return (
      <>
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="text-text-secondary font-mono text-sm">
            Initializing...
          </div>
        </div>
        {renderClosePrompt()}
      </>
    );
  }

  const shouldShowBootSequence = appSettings?.showBootSequence !== false;

  const setupFinished = !!setupComplete || setupFinalizedRef.current;

  if (setupFinalizing && !setupFinished) {
    return (
      <>
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="flex items-center gap-3 text-text-secondary font-mono text-sm">
            <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
            {setupFinalizingStatus}
          </div>
        </div>
        {renderClosePrompt()}
      </>
    );
  }

  // Show boot sequence first if setup not complete
  if (!setupFinished && setupStep === "boot" && shouldShowBootSequence) {
    return (
      <>
        <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
          <BootSequence onComplete={handleBootComplete} />
        </div>
        {renderClosePrompt()}
      </>
    );
  }

  // Show system detection after boot
  if (!setupFinished && setupStep === "detection") {
    return (
      <>
        <AnimatePresence>
          <SetupView onNext={handleDetectionNext} />
        </AnimatePresence>
        {renderClosePrompt()}
      </>
    );
  }

  // Show setup options after detection
  if (!setupFinished && setupStep === "options") {
    return (
      <>
        <AnimatePresence>
          <SetupOptionsView
            onComplete={handleSetupComplete}
            onFinalizing={() => setSetupFinalizing(true)}
            onFinalizingStatus={setSetupFinalizingStatus}
          />
        </AnimatePresence>
        {renderClosePrompt()}
      </>
    );
  }

  // Show boot sequence, then main app (for completed setup)
  return (
    <MotionConfig reducedMotion={appSettings?.reduceAnimations ? "always" : "never"}>
      <ToastProvider>
        <UpdateNotifier />
        <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
          {shouldShowBootSequence && <BootSequence onComplete={handleBootComplete} />}
          <AnimatePresence>
            {(!shouldShowBootSequence || bootComplete) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col h-full min-h-0"
              >
                <TitleBar />
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  {currentView !== "server-detail" && (
                    <Sidebar
                      currentView={sidebarView as "servers" | "settings" | "playit"}
                      onViewChange={(v) => setCurrentView(v)}
                      collapsed={appSettings?.sidebarCollapsed ?? false}
                      onCollapsedChange={(collapsed) => {
                        setAppSettings((prev) => ({ ...prev, sidebarCollapsed: collapsed }));
                        window.electronAPI?.server?.saveAppSettings?.({ sidebarCollapsed: collapsed });
                      }}
                    />
                  )}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.main
                      key={currentView + (selectedServer || '')}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className="flex-1 min-h-0 overflow-hidden"
                    >
                      {renderView()}
                    </motion.main>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {renderClosePrompt()}
      </ToastProvider>
    </MotionConfig>
  );
}

export default App;
