import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import ToggleSwitch from "./ToggleSwitch";

interface SetupOptionsViewProps {
  onComplete: () => void;
}

export default function SetupOptionsView({ onComplete }: SetupOptionsViewProps) {
  const [completing, setCompleting] = useState(false);
  const [completingStatus, setCompletingStatus] = useState("Saving setup...");
  const [serversPath, setServersPath] = useState("");
  const [backupsPath, setBackupsPath] = useState("");
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [startWithWindows, setStartWithWindows] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupInterval, setBackupInterval] = useState(24);
  const [maxBackups, setMaxBackups] = useState(10);
  const [defaultRAM, setDefaultRAM] = useState(4);
  const [defaultPort, setDefaultPort] = useState(25565);
  const [maxRAM, setMaxRAM] = useState(32); // Default, will be updated from system
  const [stepIndex, setStepIndex] = useState(0);
  const [quickStartEnabled, setQuickStartEnabled] = useState(true);
  const [quickStartName, setQuickStartName] = useState("");
  const [quickStartType, setQuickStartType] = useState<"paper" | "spigot" | "vanilla" | "fabric" | "forge" | "purpur" | "velocity" | "waterfall" | "bungeecord">("paper");
  const [quickStartVersion, setQuickStartVersion] = useState<string | null>(null);
  const [quickStartVersions, setQuickStartVersions] = useState<string[]>([]);
  const [quickStartLoading, setQuickStartLoading] = useState(false);
  const [quickStartError, setQuickStartError] = useState<string | null>(null);
  const [quickStartRAM, setQuickStartRAM] = useState(4);
  const [quickStartRamTouched, setQuickStartRamTouched] = useState(false);
  const [quickStartStartNow, setQuickStartStartNow] = useState(true);
  const [notifications, setNotifications] = useState({
    statusChanges: true,
    crashes: true,
    updates: true
  });

  useEffect(() => {
    loadDefaultSettings();
    loadSystemRAM();
  }, []);

  useEffect(() => {
    // Ensure defaultRAM doesn't exceed maxRAM when maxRAM changes
    if (defaultRAM > maxRAM && maxRAM > 0) {
      setDefaultRAM(maxRAM);
    }
    if (quickStartRAM > maxRAM && maxRAM > 0) {
      setQuickStartRAM(maxRAM);
    }
  }, [maxRAM]);

  useEffect(() => {
    if (!quickStartEnabled) {
      setQuickStartRamTouched(false);
      setQuickStartRAM(defaultRAM);
      return;
    }
    if (!quickStartRamTouched) {
      setQuickStartRAM(defaultRAM);
    }
  }, [defaultRAM, quickStartEnabled, quickStartRamTouched]);

  useEffect(() => {
    if (quickStartEnabled) {
      loadQuickStartVersions();
    }
  }, [quickStartEnabled, quickStartType]);

  const loadSystemRAM = async () => {
    if (!window.electronAPI) return;
    
    try {
      const systemInfo = await window.electronAPI.server.getSystemInfo();
      // Use system RAM as max, but ensure minimum of 4GB
      const systemMaxRAM = Math.max(4, Math.floor(systemInfo.memory.totalGB * 0.8)); // Use 80% of total as safe max
      setMaxRAM(systemMaxRAM);
    } catch (error) {
      console.error('Failed to load system RAM:', error);
    }
  };

  const loadDefaultSettings = async () => {
    if (!window.electronAPI) return;
    
    try {
      const settings = await window.electronAPI.server.getAppSettings();
      // Use settings if available, otherwise use defaults (which come from backend)
      setServersPath(settings.serversDirectory || "");
      setBackupsPath(settings.backupsDirectory || "");
      setShowBootSequence(settings.showBootSequence !== false);
      setMinimizeToTray(settings.minimizeToTray || false);
      setStartWithWindows(settings.startWithWindows || false);
      setAutoBackup(settings.autoBackup !== false);
      setBackupInterval(settings.backupInterval || 24);
      setMaxBackups(settings.maxBackups || 10);
      setDefaultRAM(settings.defaultRAM || 4);
      setDefaultPort(settings.defaultPort || 25565);
      setQuickStartRAM(settings.defaultRAM || 4);
      setNotifications(settings.notifications || {
        statusChanges: true,
        crashes: true,
        updates: true
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSelectFolder = async (type: 'servers' | 'backups') => {
    if (!window.electronAPI) return;

    try {
      const result = await window.electronAPI.server.showFolderDialog({
        title: type === 'servers' ? 'Select Servers Directory' : 'Select Backups Directory',
        defaultPath: type === 'servers' ? serversPath : backupsPath
      });

      if (result.success && result.path) {
        if (type === 'servers') {
          setServersPath(result.path);
        } else {
          setBackupsPath(result.path);
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleComplete = async () => {
    if (!window.electronAPI) {
      onComplete();
      return;
    }

    setCompleting(true);
    setCompletingStatus("Saving setup...");
    setQuickStartError(null);
    try {
      const settings = {
        serversDirectory: serversPath || undefined, // Will use default if empty
        backupsDirectory: autoBackup ? (backupsPath || undefined) : undefined, // Only set if autoBackup enabled
        showBootSequence,
        minimizeToTray,
        startWithWindows,
        autoBackup,
        backupInterval,
        maxBackups,
        defaultRAM,
        defaultPort,
        notifications
      };

      await window.electronAPI.server.completeSetup(settings);

      if (quickStartEnabled) {
        setCompletingStatus("Preparing starter server...");
        const fallbackName = "My First Server";
        const trimmedName = quickStartName.trim() || fallbackName;
        if (defaultPort < 1024 || defaultPort > 65535) {
          setQuickStartError("Please set a valid default port (1024-65535).");
          return;
        }

        const sanitizedName = trimmedName.replace(/\s+/g, '-');
        setCompletingStatus("Creating server files...");
        let quickStartPort = defaultPort;
        if (window.electronAPI?.server?.findAvailablePort) {
          const resolvedPort = await window.electronAPI.server.findAvailablePort(defaultPort);
          if (resolvedPort) {
            quickStartPort = resolvedPort;
            if (resolvedPort !== defaultPort) {
              setCompletingStatus(`Port ${defaultPort} in use. Using ${resolvedPort}...`);
            }
          }
        }
        const createResult = await window.electronAPI.server.createServer(
          sanitizedName,
          quickStartType,
          quickStartVersion,
          quickStartRAM,
          quickStartPort,
          null,
          trimmedName
        );

        if (!createResult.success) {
          setQuickStartError(createResult.error || "Failed to create the starter server.");
          return;
        }

        if (quickStartStartNow) {
          setCompletingStatus("Starting server...");
          const startResult = await window.electronAPI.server.startServer(sanitizedName, quickStartRAM);
          if (!startResult.success) {
            setQuickStartError(startResult.error || "Starter server created, but failed to start.");
            return;
          }
        }
      }

      setCompletingStatus("Finalizing...");
      onComplete();
    } catch (error) {
      console.error('Failed to complete setup:', error);
      onComplete();
    } finally {
      setCompleting(false);
    }
  };

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const loadQuickStartVersions = async () => {
    if (!window.electronAPI) return;
    setQuickStartLoading(true);
    setQuickStartError(null);
    try {
      let versions: string[] = [];
      switch (quickStartType) {
        case "paper":
          versions = await window.electronAPI.server.getPaperVersions();
          break;
        case "spigot":
          versions = await window.electronAPI.server.getSpigotVersions();
          break;
        case "vanilla":
          versions = await window.electronAPI.server.getVanillaVersions();
          break;
        case "fabric":
          versions = await window.electronAPI.server.getFabricVersions();
          break;
        case "forge":
          versions = await window.electronAPI.server.getForgeVersions();
          break;
        case "purpur":
          versions = await window.electronAPI.server.getPurpurVersions();
          break;
        case "velocity":
          versions = await window.electronAPI.server.getVelocityVersions();
          break;
        case "waterfall":
          versions = await window.electronAPI.server.getWaterfallVersions();
          break;
        case "bungeecord":
          versions = await window.electronAPI.server.getBungeeCordVersions();
          break;
        default:
          versions = [];
      }
      setQuickStartVersions(versions);
      setQuickStartVersion(versions[0] || null);
    } catch (error) {
      setQuickStartVersions([]);
      setQuickStartVersion(null);
      setQuickStartError("Failed to load server versions.");
    } finally {
      setQuickStartLoading(false);
    }
  };

  const steps = [
    { key: "storage", title: "Storage Locations" },
    { key: "defaults", title: "Default Server Settings" },
    { key: "quickstart", title: "Quick Start" },
    { key: "behavior", title: "Application Behavior" },
    { key: "notifications", title: "Notifications" }
  ];

  const handleNextStep = () => {
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevStep = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen flex items-center justify-center bg-background p-8 overflow-hidden"
    >
      {completing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-text-primary font-mono text-sm">
            <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
            {completingStatus}
          </div>
        </div>
      )}
      <motion.div
        className="relative border border-border bg-background-secondary p-8 max-w-2xl w-full max-h-[90vh] flex flex-col rounded"
        whileHover={{ 
          borderColor: 'rgba(46, 242, 162, 0.2)',
          transition: { duration: 0.3 }
        }}
        style={{ 
          borderColor: 'rgba(26, 26, 26, 1)',
          backgroundColor: 'rgba(17, 17, 17, 1)',
        }}
      >
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
            SETUP OPTIONS
          </h1>
          <p className="text-text-secondary font-mono text-sm">
            Configure your HexNode experience
          </p>
        </div>

        <div className="mb-6 border border-border rounded p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
            Step {stepIndex + 1} of {steps.length}
          </div>
          <div className="text-sm font-mono text-text-primary">
            {steps[stepIndex].title}
          </div>
        </div>

        <div 
          className="flex-1 mb-6 space-y-6 custom-scrollbar"
          style={{ 
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >

          {/* Storage Locations */}
          {stepIndex === 0 && (
          <div className="border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
              Storage Locations
            </h3>
            <div className="space-y-4 text-text-secondary font-mono text-sm">
              <div>
                <label className="block mb-2 text-text-primary">Servers Directory</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serversPath || "(Using default: AppData\\Roaming\\.hexnode\\servers)"}
                    readOnly
                    className="flex-1 bg-background border border-border px-3 py-2 text-text-primary font-mono text-xs focus:outline-none focus:border-accent/50 rounded"
                    style={{ color: serversPath ? undefined : 'rgba(102, 102, 102, 1)' }}
                  />
                  <motion.button
                    onClick={() => handleSelectFolder('servers')}
                    className="btn-secondary text-xs"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    BROWSE
                  </motion.button>
                </div>
                <p className="text-xs text-text-muted mt-1">Where server files will be stored (default: AppData\Roaming\.hexnode\servers)</p>
              </div>
            </div>
          </div>
          )}

          {/* Default Server Settings */}
          {stepIndex === 1 && (
          <div className="border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
              Default Server Settings
            </h3>
            <div className="space-y-4 text-text-secondary font-mono text-sm">
              <div>
                <label className="block mb-2 text-text-primary">Default RAM Allocation: {defaultRAM} GB</label>
                <div className="flex items-center gap-4 relative">
                  <div className="flex-1 relative h-2">
                    {/* Filled portion - stops just before thumb */}
                    <div 
                      className="absolute inset-y-0 left-0 h-2 bg-accent rounded-l-lg pointer-events-none"
                      style={{ 
                        width: `min(calc(${(defaultRAM / maxRAM) * 100}% - 9px), calc(100% - 18px))`, 
                        zIndex: 1
                      }}
                    ></div>
                    {/* Slider input */}
                    <input
                      type="range"
                      min="1"
                      max={maxRAM}
                      value={defaultRAM}
                      onChange={(e) => setDefaultRAM(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-2 appearance-none cursor-pointer slider-custom bg-transparent"
                      style={{ zIndex: 5 }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-text-muted font-mono mt-1">
                  <span>1GB</span>
                  <span>{maxRAM}GB</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Default RAM for new servers</p>
              </div>
              <div>
                <label className="block mb-2 text-text-primary">Default Port</label>
                <input
                  type="number"
                  min="1024"
                  max="65535"
                  value={defaultPort}
                  onChange={(e) => setDefaultPort(parseInt(e.target.value) || 0)}
                  className="w-full bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                />
                <p className="text-xs text-text-muted mt-1">Default port for new servers (1024-65535)</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Auto-backup enabled</span>
                  <p className="text-xs text-text-muted">Automatically backup servers</p>
                </div>
                <ToggleSwitch
                  checked={autoBackup}
                  onChange={(checked) => setAutoBackup(checked)}
                  ariaLabel="Auto-backup enabled"
                />
              </div>
              {autoBackup && (
                <div className="pl-4 space-y-3 border-l-2 border-border">
                  <div>
                    <label className="block mb-2 text-text-primary">Backups Directory</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={backupsPath || "(Using default: AppData\\Roaming\\.hexnode\\backups)"}
                        readOnly
                        className="flex-1 bg-background border border-border px-3 py-2 text-text-primary font-mono text-xs focus:outline-none focus:border-accent/50 rounded"
                        style={{ color: backupsPath ? undefined : 'rgba(102, 102, 102, 1)' }}
                      />
                      <motion.button
                        onClick={() => handleSelectFolder('backups')}
                        className="btn-secondary text-xs"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        BROWSE
                      </motion.button>
                    </div>
                    <p className="text-xs text-text-muted mt-1">Where server backups will be stored (default: AppData\Roaming\.hexnode\backups)</p>
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Backup Interval (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={backupInterval}
                      onChange={(e) => setBackupInterval(parseInt(e.target.value) || 24)}
                      className="w-full bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Maximum Backups</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxBackups}
                      onChange={(e) => setMaxBackups(parseInt(e.target.value) || 10)}
                      className="w-full bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    />
                    <p className="text-xs text-text-muted mt-1">Old backups will be deleted when limit is reached</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Quick Start */}
          {stepIndex === 2 && (
          <div className="border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
              Quick Start (Recommended)
            </h3>
            <div className="space-y-4 text-text-secondary font-mono text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span>Create a starter server now</span>
                  <p className="text-xs text-text-muted">Skip the empty dashboard and launch instantly</p>
                </div>
                <ToggleSwitch
                  checked={quickStartEnabled}
                  onChange={(checked) => setQuickStartEnabled(checked)}
                  ariaLabel="Create a starter server now"
                />
              </div>

              {quickStartEnabled && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div>
                    <label className="block mb-2 text-text-primary">Server Name</label>
                    <input
                      type="text"
                      value={quickStartName}
                      onChange={(e) => setQuickStartName(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                      placeholder="My First Server"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Server Type</label>
                    <select
                      value={quickStartType}
                      onChange={(e) => setQuickStartType(e.target.value as "paper" | "spigot" | "vanilla" | "fabric" | "forge" | "purpur" | "velocity" | "waterfall" | "bungeecord")}
                      className="select-custom w-full"
                    >
                      <option value="paper">Paper (recommended)</option>
                      <option value="purpur">Purpur</option>
                      <option value="spigot">Spigot</option>
                      <option value="vanilla">Vanilla</option>
                      <option value="fabric">Fabric</option>
                      <option value="forge">Forge</option>
                      <option value="velocity">Velocity (proxy)</option>
                      <option value="waterfall">Waterfall (proxy)</option>
                      <option value="bungeecord">BungeeCord (proxy)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Version</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={quickStartVersion || ""}
                        onChange={(e) => setQuickStartVersion(e.target.value || null)}
                        className="select-custom flex-1"
                        disabled={quickStartLoading || quickStartVersions.length === 0}
                      >
                        {quickStartVersions.length === 0 && (
                          <option value="">Latest</option>
                        )}
                        {quickStartVersions.map((version) => (
                          <option key={version} value={version}>
                            {version}
                          </option>
                        ))}
                      </select>
                      {quickStartLoading && (
                        <span className="text-xs text-text-muted">Loading...</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Starter Server RAM: {quickStartRAM} GB</label>
                    <div className="flex items-center gap-4 relative">
                      <div className="flex-1 relative h-2">
                        <div 
                          className="absolute inset-y-0 left-0 h-2 bg-accent rounded-l-lg pointer-events-none"
                          style={{ 
                            width: `min(calc(${(quickStartRAM / maxRAM) * 100}% - 9px), calc(100% - 18px))`, 
                            zIndex: 1
                          }}
                        ></div>
                        <input
                          type="range"
                          min="1"
                          max={maxRAM}
                          value={quickStartRAM}
                          onChange={(e) => {
                            setQuickStartRAM(parseInt(e.target.value));
                            setQuickStartRamTouched(true);
                          }}
                          className="absolute inset-0 w-full h-2 appearance-none cursor-pointer slider-custom bg-transparent"
                          style={{ zIndex: 5 }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-text-muted font-mono mt-1">
                      <span>1GB</span>
                      <span>{maxRAM}GB</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span>Start server after setup</span>
                      <p className="text-xs text-text-muted">Launch immediately with the RAM set above</p>
                    </div>
                    <ToggleSwitch
                      checked={quickStartStartNow}
                      onChange={(checked) => setQuickStartStartNow(checked)}
                      ariaLabel="Start server after setup"
                    />
                  </div>
                  {quickStartError && (
                    <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-2 rounded">
                      {quickStartError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Application Behavior */}
          {stepIndex === 3 && (
          <div className="border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
              Application Behavior
            </h3>
            <div className="space-y-3 text-text-secondary font-mono text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span>Show boot sequence</span>
                  <p className="text-xs text-text-muted">Display boot animation on launch</p>
                </div>
                <ToggleSwitch
                  checked={showBootSequence}
                  onChange={(checked) => setShowBootSequence(checked)}
                  ariaLabel="Show boot sequence"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Minimize to system tray</span>
                  <p className="text-xs text-text-muted">Keep app running in background</p>
                </div>
                <ToggleSwitch
                  checked={minimizeToTray}
                  onChange={(checked) => setMinimizeToTray(checked)}
                  ariaLabel="Minimize to system tray"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Start with Windows</span>
                  <p className="text-xs text-text-muted">Launch automatically on system startup</p>
                </div>
                <ToggleSwitch
                  checked={startWithWindows}
                  onChange={(checked) => setStartWithWindows(checked)}
                  ariaLabel="Start with Windows"
                />
              </div>
            </div>
          </div>
          )}

          {/* Notifications */}
          {stepIndex === 4 && (
          <div className="border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
              Notifications
            </h3>
            <div className="space-y-3 text-text-secondary font-mono text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span>Server status changes</span>
                  <p className="text-xs text-text-muted">Notify when servers start or stop</p>
                </div>
                <ToggleSwitch
                  checked={notifications.statusChanges}
                  onChange={(checked) => updateNotification('statusChanges', checked)}
                  ariaLabel="Server status changes notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Server crashes</span>
                  <p className="text-xs text-text-muted">Alert when servers crash unexpectedly</p>
                </div>
                <ToggleSwitch
                  checked={notifications.crashes}
                  onChange={(checked) => updateNotification('crashes', checked)}
                  ariaLabel="Server crashes notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Update available</span>
                  <p className="text-xs text-text-muted">Notify when app updates are available</p>
                </div>
                <ToggleSwitch
                  checked={notifications.updates}
                  onChange={(checked) => updateNotification('updates', checked)}
                  ariaLabel="Update available notifications"
                />
              </div>
            </div>
          </div>
          )}
        </div>

        <div className="flex justify-between flex-shrink-0 pt-4 border-t border-border">
          <motion.button
            onClick={handlePrevStep}
            disabled={stepIndex === 0 || completing}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: stepIndex === 0 || completing ? 1 : 1.02 }}
            whileTap={{ scale: stepIndex === 0 || completing ? 1 : 0.98 }}
          >
            BACK
          </motion.button>
          {stepIndex < steps.length - 1 ? (
            <motion.button
              onClick={handleNextStep}
              disabled={completing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: completing ? 1 : 1.02 }}
              whileTap={{ scale: completing ? 1 : 0.98 }}
            >
              NEXT
            </motion.button>
          ) : (
            <motion.button
              onClick={handleComplete}
              disabled={completing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: completing ? 1 : 1.02 }}
              whileTap={{ scale: completing ? 1 : 0.98 }}
            >
              {completing ? "COMPLETING..." : "FINISH SETUP"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
