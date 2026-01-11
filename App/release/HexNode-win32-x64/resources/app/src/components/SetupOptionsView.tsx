import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface SetupOptionsViewProps {
  onComplete: () => void;
}

export default function SetupOptionsView({ onComplete }: SetupOptionsViewProps) {
  const [completing, setCompleting] = useState(false);
  const [serversPath, setServersPath] = useState("");
  const [backupsPath, setBackupsPath] = useState("");
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [startWithWindows, setStartWithWindows] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupInterval, setBackupInterval] = useState(24);
  const [maxBackups, setMaxBackups] = useState(10);
  const [defaultRAM, setDefaultRAM] = useState(4);
  const [maxRAM, setMaxRAM] = useState(32); // Default, will be updated from system
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
  }, [maxRAM]);

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
        notifications
      };

      await window.electronAPI.server.completeSetup(settings);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen flex items-center justify-center bg-background p-8 overflow-hidden"
    >
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

        <div 
          className="flex-1 mb-6 space-y-6 custom-scrollbar"
          style={{ 
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >

          {/* Storage Locations */}
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

          {/* Default Server Settings */}
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
              <div className="flex items-center justify-between">
                <div>
                  <span>Auto-backup enabled</span>
                  <p className="text-xs text-text-muted">Automatically backup servers</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                  className="w-4 h-4 accent-accent cursor-pointer"
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

          {/* Application Behavior */}
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
                <input
                  type="checkbox"
                  checked={showBootSequence}
                  onChange={(e) => setShowBootSequence(e.target.checked)}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Minimize to system tray</span>
                  <p className="text-xs text-text-muted">Keep app running in background</p>
                </div>
                <input
                  type="checkbox"
                  checked={minimizeToTray}
                  onChange={(e) => setMinimizeToTray(e.target.checked)}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Start with Windows</span>
                  <p className="text-xs text-text-muted">Launch automatically on system startup</p>
                </div>
                <input
                  type="checkbox"
                  checked={startWithWindows}
                  onChange={(e) => setStartWithWindows(e.target.checked)}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
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
                <input
                  type="checkbox"
                  checked={notifications.statusChanges}
                  onChange={(e) => updateNotification('statusChanges', e.target.checked)}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Server crashes</span>
                  <p className="text-xs text-text-muted">Alert when servers crash unexpectedly</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.crashes}
                  onChange={(e) => updateNotification('crashes', e.target.checked)}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span>Update available</span>
                  <p className="text-xs text-text-muted">Notify when app updates are available</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.updates}
                  onChange={(e) => updateNotification('updates', e.target.checked)}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end flex-shrink-0 pt-4 border-t border-border">
          <motion.button
            onClick={handleComplete}
            disabled={completing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: completing ? 1 : 1.02 }}
            whileTap={{ scale: completing ? 1 : 0.98 }}
          >
            {completing ? "COMPLETING..." : "FINISH SETUP"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
