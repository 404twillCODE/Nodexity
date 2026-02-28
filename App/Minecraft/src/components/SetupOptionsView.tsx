import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import ToggleSwitch from "./ToggleSwitch";

interface SetupOptionsViewProps {
  onComplete: () => void;
  onFinalizing?: () => void;
  onFinalizingStatus?: (status: string) => void;
}

export default function SetupOptionsView({
  onComplete,
  onFinalizing,
  onFinalizingStatus
}: SetupOptionsViewProps) {
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
  type PresetType = "paper_plugins" | "vanilla" | "java_bedrock";
  const [presetEnabled, setPresetEnabled] = useState(true);
  const [presetType, setPresetType] = useState<PresetType>("paper_plugins");
  const [presetName, setPresetName] = useState("");
  const [presetVersion, setPresetVersion] = useState<string | null>(null);
  const [presetVersions, setPresetVersions] = useState<string[]>([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [presetRAM, setPresetRAM] = useState(4);
  const [presetRamTouched, setPresetRamTouched] = useState(false);
  const [presetStartNow, setPresetStartNow] = useState(true);
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
    if (defaultRAM > maxRAM && maxRAM > 0) setDefaultRAM(maxRAM);
    if (presetRAM > maxRAM && maxRAM > 0) setPresetRAM(maxRAM);
  }, [maxRAM]);

  useEffect(() => {
    if (!presetEnabled) {
      setPresetRamTouched(false);
      setPresetRAM(defaultRAM);
      return;
    }
    if (!presetRamTouched) setPresetRAM(defaultRAM);
  }, [defaultRAM, presetEnabled, presetRamTouched]);

  useEffect(() => {
    if (presetEnabled && (presetType === "paper_plugins" || presetType === "java_bedrock" || presetType === "vanilla")) {
      loadPresetVersions();
    }
  }, [presetEnabled, presetType]);

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
      setPresetRAM(settings.defaultRAM || 4);
      setNotifications({
        statusChanges: settings.notifications?.statusChanges ?? true,
        crashes: settings.notifications?.crashes ?? true,
        updates: settings.notifications?.updates ?? true
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

  const updateStatus = (status: string) => {
    setCompletingStatus(status);
    onFinalizingStatus?.(status);
  };

  const handleComplete = async () => {
    if (!window.electronAPI) {
      onComplete();
      return;
    }

    onFinalizing?.();
    setCompleting(true);
    updateStatus("Setting up dashboard...");
    setPresetError(null);
    
    try {
      // Small delay to ensure status is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateStatus("Saving settings...");
      const settings = {
        serversDirectory: serversPath || undefined,
        backupsDirectory: autoBackup ? (backupsPath || undefined) : undefined,
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

      if (presetEnabled) {
        const fallbackName = "My First Server";
        const trimmedName = presetName.trim() || fallbackName;
        if (defaultPort < 1024 || defaultPort > 65535) {
          setPresetError("Please set a valid default port (1024-65535).");
          return;
        }

        const sanitizedName = trimmedName.replace(/\s+/g, '-');
        let presetPort = defaultPort;
        if (window.electronAPI?.server?.findAvailablePort) {
          updateStatus("Checking port availability...");
          const resolvedPort = await window.electronAPI.server.findAvailablePort(defaultPort);
          if (resolvedPort) {
            presetPort = resolvedPort;
            if (resolvedPort !== defaultPort) {
              updateStatus(`Port ${defaultPort} in use. Using ${resolvedPort}...`);
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          }
        }

        const serverType = presetType === "vanilla" ? "vanilla" : "paper";
        const version = presetVersion || (presetType === "vanilla" ? (await window.electronAPI.server.getVanillaVersions())[0] : (await window.electronAPI.server.getPaperVersions())[0]);

        updateStatus("Downloading server jar...");
        const createResult = await window.electronAPI.server.createServer(
          sanitizedName,
          serverType,
          version,
          presetRAM,
          presetPort,
          null,
          trimmedName
        );

        if (!createResult.success) {
          setPresetError(createResult.error || "Failed to create the server.");
          return;
        }

        if (presetType === "paper_plugins") {
          updateStatus("Installing EssentialsX (from GitHub)...");
          const exResult = await window.electronAPI.server.installEssentialsXFromGitHub(sanitizedName);
          if (!exResult.success) console.warn("Could not install EssentialsX:", exResult.error);
          const modrinthPlugins = [
            { id: "luckperms", name: "LuckPerms" },
            { id: "worldedit", name: "WorldEdit" },
            { id: "chunky", name: "Chunky" }
          ];
          for (const p of modrinthPlugins) {
            updateStatus(`Installing ${p.name}...`);
            const r = await window.electronAPI.server.installModrinthPlugin(sanitizedName, p.id, version);
            if (!r.success) console.warn(`Could not install ${p.name}:`, r.error);
          }
        } else if (presetType === "java_bedrock") {
          updateStatus("Installing Geyser and Floodgate (Java + Bedrock)...");
          const r = await window.electronAPI.server.installGeyserFloodgate(sanitizedName, presetPort);
          if (!r.success) {
            setPresetError(r.error || "Failed to install Geyser/Floodgate.");
            return;
          }
        }

        if (presetStartNow) {
          updateStatus("Starting server...");
          const startResult = await window.electronAPI.server.startServer(sanitizedName, presetRAM);
          if (!startResult.success) {
            setPresetError(startResult.error || "Server created, but failed to start.");
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      updateStatus("Opening dashboard...");
      await new Promise(resolve => setTimeout(resolve, 500));
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

  const loadPresetVersions = async () => {
    if (!window.electronAPI) return;
    setPresetLoading(true);
    setPresetError(null);
    try {
      let versions: string[] = [];
      if (presetType === "paper_plugins" || presetType === "java_bedrock") {
        versions = await window.electronAPI.server.getPaperVersions();
      } else if (presetType === "vanilla") {
        versions = await window.electronAPI.server.getVanillaVersions();
      }
      setPresetVersions(versions);
      setPresetVersion(versions[0] || null);
    } catch (error) {
      setPresetVersions([]);
      setPresetVersion(null);
      setPresetError("Failed to load server versions.");
    } finally {
      setPresetLoading(false);
    }
  };

  const steps = [
    { key: "storage", title: "Storage Locations" },
    { key: "defaults", title: "Default Server Settings" },
    { key: "presets", title: "Preset Server" },
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
            Configure your Nodexity experience
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
                    value={serversPath || "(Using default: AppData\\Roaming\\.nodexity\\servers)"}
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
                <p className="text-xs text-text-muted mt-1">Where server files will be stored (default: AppData\Roaming\.nodexity\servers)</p>
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
                        value={backupsPath || "(Using default: AppData\\Roaming\\.nodexity\\backups)"}
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
                    <p className="text-xs text-text-muted mt-1">Where server backups will be stored (default: AppData\Roaming\.nodexity\backups)</p>
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

          {/* Preset Server */}
          {stepIndex === 2 && (
          <div className="border border-border rounded p-4">
            <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
              Preset Server (Recommended)
            </h3>
            <div className="space-y-4 text-text-secondary font-mono text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span>Create a preset server now</span>
                  <p className="text-xs text-text-muted">Skip the empty dashboard and launch instantly</p>
                </div>
                <ToggleSwitch
                  checked={presetEnabled}
                  onChange={(checked) => setPresetEnabled(checked)}
                  ariaLabel="Create a preset server now"
                />
              </div>

              {presetEnabled && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div>
                    <label className="block mb-2 text-text-primary">Preset</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => setPresetType("paper_plugins")}
                        className={`p-3 text-left rounded border transition-colors ${
                          presetType === "paper_plugins"
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <span className="font-mono font-medium text-text-primary">Paper + Plugins</span>
                        <p className="text-xs text-text-muted mt-0.5">Paper with EssentialsX, LuckPerms, WorldEdit, Chunky</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetType("vanilla")}
                        className={`p-3 text-left rounded border transition-colors ${
                          presetType === "vanilla"
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <span className="font-mono font-medium text-text-primary">Vanilla</span>
                        <p className="text-xs text-text-muted mt-0.5">Clean vanilla Minecraft server</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetType("java_bedrock")}
                        className={`p-3 text-left rounded border transition-colors ${
                          presetType === "java_bedrock"
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <span className="font-mono font-medium text-text-primary">Java + Bedrock</span>
                        <p className="text-xs text-text-muted mt-0.5">Geyser &amp; Floodgate — Bedrock players can join</p>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Server Name</label>
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                      placeholder="My First Server"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Version</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={presetVersion || ""}
                        onChange={(e) => setPresetVersion(e.target.value || null)}
                        className="select-custom flex-1"
                        disabled={presetLoading || presetVersions.length === 0}
                      >
                        {presetVersions.length === 0 && <option value="">Latest</option>}
                        {presetVersions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      {presetLoading && <span className="text-xs text-text-muted">Loading...</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-text-primary">Server RAM: {presetRAM} GB</label>
                    <div className="flex items-center gap-4 relative">
                      <div className="flex-1 relative h-2">
                        <div
                          className="absolute inset-y-0 left-0 h-2 bg-accent rounded-l-lg pointer-events-none"
                          style={{ width: `min(calc(${(presetRAM / maxRAM) * 100}% - 9px), calc(100% - 18px))`, zIndex: 1 }}
                        />
                        <input
                          type="range"
                          min="1"
                          max={maxRAM}
                          value={presetRAM}
                          onChange={(e) => {
                            setPresetRAM(parseInt(e.target.value));
                            setPresetRamTouched(true);
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
                      checked={presetStartNow}
                      onChange={(checked) => setPresetStartNow(checked)}
                      ariaLabel="Start server after setup"
                    />
                  </div>
                  {presetError && (
                    <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-2 rounded">
                      {presetError}
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
