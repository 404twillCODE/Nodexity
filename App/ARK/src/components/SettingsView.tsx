import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ToggleSwitch from "./ToggleSwitch";
import { useToast } from "./ToastProvider";

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'server' | 'rcon' | 'discord' | 'automation' | 'console' | 'dev' | 'about'>('general');
  const [settings, setSettings] = useState<import("../hooks/useServerManager").AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [maxRAM, setMaxRAM] = useState(32); // Default, will be updated from system
  const ramSliderRef = useRef<HTMLDivElement>(null);
  const { notify } = useToast();

  useEffect(() => {
    loadSettings();
    loadSystemRAM();
  }, []);

  useEffect(() => {
    // Update green bar position when settings or maxRAM changes
    if (activeTab !== 'server') return;
    if (ramSliderRef.current && settings) {
      const slider = ramSliderRef.current.querySelector('input[type="range"]') as HTMLInputElement;
      const fill = ramSliderRef.current.querySelector('.ram-fill') as HTMLElement;
      if (slider && fill) {
        const updateFill = () => {
          const value = parseFloat(slider.value);
          const min = parseFloat(slider.min);
          const max = parseFloat(slider.max);
          const percentage = ((value - min) / (max - min)) * 100;
          const sliderWidth = slider.offsetWidth || ramSliderRef.current?.offsetWidth || 0;
          const thumbWidth = 18;
          const thumbPosition = (percentage / 100) * (sliderWidth - thumbWidth) + (thumbWidth / 2);
          fill.style.width = `${Math.max(0, thumbPosition - (thumbWidth / 2))}px`;
        };

        const rafId = requestAnimationFrame(updateFill);
        const timeoutId = window.setTimeout(updateFill, 50);
        slider.addEventListener('input', updateFill);
        window.addEventListener('resize', updateFill);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => updateFill());
          resizeObserver.observe(ramSliderRef.current);
        }

        return () => {
          cancelAnimationFrame(rafId);
          window.clearTimeout(timeoutId);
          slider.removeEventListener('input', updateFill);
          window.removeEventListener('resize', updateFill);
          resizeObserver?.disconnect();
        };
      }
    }
  }, [settings?.defaultRAM, maxRAM, activeTab]);

  useEffect(() => {
    // Ensure defaultRAM doesn't exceed maxRAM when maxRAM changes
    if (settings?.defaultRAM && settings.defaultRAM > maxRAM && maxRAM > 0) {
      const updateRAM = async () => {
        await saveSetting('defaultRAM', maxRAM);
      };
      updateRAM();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadSettings = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const appSettings = await window.electronAPI.server.getAppSettings();
      setSettings(appSettings);
      setDevMode(appSettings.devMode || false);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: unknown) => {
    if (!window.electronAPI) return;

    try {
      // Get current settings if not loaded
      const currentSettings = settings || await window.electronAPI.server.getAppSettings();
      const updated = { ...currentSettings, [key]: value };
      const saved = await window.electronAPI.server.saveAppSettings(updated);
      setSettings(saved || updated);
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const saveNestedSetting = async (path: string[], value: unknown) => {
    if (!window.electronAPI) return;

    try {
      // Get current settings if not loaded
      const currentSettings = settings || await window.electronAPI.server.getAppSettings();
      const updated = { ...currentSettings };
      let current = updated;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) (current as Record<string, unknown>)[path[i]] = {};
        current = (current[path[i]] ?? {}) as import("../hooks/useServerManager").AppSettings;
      }
      (current as Record<string, unknown>)[path[path.length - 1]] = value;
      const saved = await window.electronAPI.server.saveAppSettings(updated);
      setSettings(saved || updated);
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const saveDevMode = async (enabled: boolean) => {
    await saveSetting('devMode', enabled);
    setDevMode(enabled);
  };

  const handleResetSetup = async () => {
    if (!window.electronAPI) return;
    
    const confirmed = confirm('This will reset the first time setup. The app will restart and show the setup screen again. Continue?');
    if (!confirmed) return;

    try {
      await window.electronAPI.server.resetSetup();
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset setup:', error);
      notify({
        type: "error",
        title: "Reset failed",
        message: "Failed to reset setup. Please try again."
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="text-text-secondary font-mono text-sm">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          SETTINGS
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          Configure system preferences
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {(['general', 'server', 'rcon', 'discord', 'automation', 'console', 'dev', 'about'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'text-accent border-accent'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Application
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span>Show boot sequence</span>
                    <p className="text-xs text-text-muted">Display boot animation on launch</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.showBootSequence !== false}
                    onChange={(checked) => saveSetting('showBootSequence', checked)}
                    ariaLabel="Show boot sequence"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Minimize to system tray</span>
                    <p className="text-xs text-text-muted">Keep app running in background</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.minimizeToTray || false}
                    onChange={(checked) => saveSetting('minimizeToTray', checked)}
                    ariaLabel="Minimize to system tray"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Start with Windows</span>
                    <p className="text-xs text-text-muted">Launch automatically on system startup</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.startWithWindows || false}
                    onChange={(checked) => saveSetting('startWithWindows', checked)}
                    ariaLabel="Start with Windows"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Check for updates automatically</span>
                    <p className="text-xs text-text-muted">Automatically check for app updates</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.autoUpdateCheck !== false}
                    onChange={(checked) => saveSetting('autoUpdateCheck', checked)}
                    ariaLabel="Check for updates automatically"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Notifications
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span>Server status changes</span>
                    <p className="text-xs text-text-muted">Notify when servers start or stop</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.notifications?.statusChanges !== false}
                    onChange={(checked) => saveNestedSetting(['notifications', 'statusChanges'], checked)}
                    ariaLabel="Server status changes notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Server crashes</span>
                    <p className="text-xs text-text-muted">Alert when servers crash unexpectedly</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.notifications?.crashes !== false}
                    onChange={(checked) => saveNestedSetting(['notifications', 'crashes'], checked)}
                    ariaLabel="Server crashes notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Update available</span>
                    <p className="text-xs text-text-muted">Notify when app updates are available</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.notifications?.updates !== false}
                    onChange={(checked) => saveNestedSetting(['notifications', 'updates'], checked)}
                    ariaLabel="Update available notifications"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Interface & Performance
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span>Reduce animations</span>
                    <p className="text-xs text-text-muted">Minimize motion effects across the UI</p>
                  </div>
                  <ToggleSwitch
                    checked={Boolean(settings?.reduceAnimations)}
                    onChange={(checked) => saveSetting('reduceAnimations', checked)}
                    ariaLabel="Reduce animations"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Status refresh rate (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={Number(settings?.statusRefreshRate) || 2}
                    onChange={(e) => saveSetting('statusRefreshRate', Math.max(1, Math.min(10, parseInt(e.target.value) || 2)))}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">Controls how often server status updates</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Server Settings */}
        {activeTab === 'server' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Default Server Settings
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div>
                  <label className="block mb-2 text-text-primary">Default RAM Allocation: {settings?.defaultRAM || 4} GB</label>
                  <div className="flex items-center gap-4 relative">
                    <div className="flex-1 relative h-2" ref={ramSliderRef}>
                      {/* Filled portion - calculated dynamically to stop at thumb */}
                      <div 
                        className="ram-fill absolute inset-y-0 left-0 h-2 bg-accent rounded-l-lg pointer-events-none"
                        style={{ zIndex: 1 }}
                      ></div>
                      {/* Slider input */}
                      <input
                        type="range"
                        min="1"
                        max={maxRAM}
                        value={Number(settings?.defaultRAM) || 4}
                        onChange={(e) => saveSetting('defaultRAM', parseInt(e.target.value))}
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
                    value={Number(settings?.defaultPort) ?? 7777}
                    onChange={(e) => saveSetting('defaultPort', parseInt(e.target.value) || 7777)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">Default game port for new ARK servers (1024-65535)</p>
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">ARK Dedicated Server Install Path</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings?.arkInstallPath ?? ''}
                      onChange={(e) => saveSetting('arkInstallPath', e.target.value)}
                      placeholder="e.g. C:\SteamCMD\steamapps\common\ARK Survival Evolved Dedicated Server"
                      className="flex-1 bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.electronAPI?.server?.showFolderDialog) return;
                        const res = await window.electronAPI.server.showFolderDialog({ title: 'Select ARK Dedicated Server folder', defaultPath: settings?.arkInstallPath });
                        if (res?.success && res?.path) saveSetting('arkInstallPath', res.path);
                      }}
                      className="btn-secondary whitespace-nowrap"
                    >
                      BROWSE
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Folder containing ShooterGame\Binaries\Win64\ShooterGameServer.exe</p>
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">SteamCMD Path</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings?.steamCmdPath ?? ''}
                      onChange={(e) => saveSetting('steamCmdPath', e.target.value)}
                      placeholder="e.g. C:\SteamCMD\steamcmd.exe"
                      className="flex-1 bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.electronAPI?.server?.showFolderDialog) return;
                        const res = await window.electronAPI.server.showFolderDialog({ title: 'Select SteamCMD folder', defaultPath: settings?.steamCmdPath });
                        if (res?.success && res?.path) saveSetting('steamCmdPath', res.path);
                      }}
                      className="btn-secondary whitespace-nowrap"
                    >
                      BROWSE
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Path to steamcmd.exe for server updates</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Auto-backup enabled</span>
                    <p className="text-xs text-text-muted">Automatically backup servers</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.autoBackup !== false}
                    onChange={(checked) => saveSetting('autoBackup', checked)}
                    ariaLabel="Auto-backup enabled"
                  />
                </div>
                {settings?.autoBackup && (
                  <div className="pl-4 space-y-3 border-l-2 border-border">
                    <div>
                      <label className="block mb-2 text-text-primary">Backup Interval (hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={Number(settings?.backupInterval) || 24}
                        onChange={(e) => saveSetting('backupInterval', parseInt(e.target.value) || 24)}
                        className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-text-primary">Maximum Backups</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={Number(settings?.maxBackups) || 10}
                        onChange={(e) => saveSetting('maxBackups', parseInt(e.target.value) || 10)}
                        className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                      />
                      <p className="text-xs text-text-muted mt-1">Old backups will be deleted when limit is reached</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* RCON Settings */}
        {activeTab === 'rcon' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                RCON Settings
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div>
                  <label className="block mb-2 text-text-primary">Default RCON Port</label>
                  <input
                    type="number"
                    min="1024"
                    max="65535"
                    value={Number(settings?.defaultRconPort) || 32330}
                    onChange={(e) => saveSetting('defaultRconPort', parseInt(e.target.value) || 32330)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">Default RCON port for connections</p>
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Default RCON Password</label>
                  <input
                    type="password"
                    value={(settings?.rcon as Record<string, unknown>)?.defaultPassword as string || ''}
                    onChange={(e) => saveNestedSetting(['rcon', 'defaultPassword'], e.target.value)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    placeholder="Pre-fill RCON console password"
                  />
                  <p className="text-xs text-text-muted mt-1">Pre-fills the RCON console password field</p>
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">RCON Timeout (seconds)</label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={(settings?.rcon as Record<string, unknown>)?.timeout as number || 10}
                    onChange={(e) => saveNestedSetting(['rcon', 'timeout'], parseInt(e.target.value) || 10)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">How long to wait for RCON responses</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Discord Settings */}
        {activeTab === 'discord' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Discord Bot
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span>Enable Discord bot</span>
                    <p className="text-xs text-text-muted">Allow the Discord bot to be started</p>
                  </div>
                  <ToggleSwitch
                    checked={(settings?.discord as Record<string, unknown>)?.enabled as boolean || false}
                    onChange={(checked) => saveNestedSetting(['discord', 'enabled'], checked)}
                    ariaLabel="Enable Discord bot"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Bot Token</label>
                  <input
                    type="password"
                    value={(settings?.discord as Record<string, unknown>)?.token as string || ''}
                    onChange={(e) => saveNestedSetting(['discord', 'token'], e.target.value)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    placeholder="Discord bot token"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Create a bot at{" "}
                    <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      discord.com/developers
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Allowed User IDs</label>
                  <input
                    type="text"
                    value={((settings?.discord as Record<string, unknown>)?.allowedUserIds as string[] || []).join(', ')}
                    onChange={(e) => saveNestedSetting(['discord', 'allowedUserIds'], e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    placeholder="123456789, 987654321"
                  />
                  <p className="text-xs text-text-muted mt-1">Comma-separated Discord user IDs allowed to use admin commands. Leave empty to allow all.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Server Join Info
              </h2>
              <p className="text-xs text-text-muted font-mono mb-4">
                These are shown when users run <code className="text-accent">/ark ip</code> in Discord.
              </p>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div>
                  <label className="block mb-2 text-text-primary">Server Join IP</label>
                  <input
                    type="text"
                    value={(settings?.discord as Record<string, unknown>)?.serverJoinIp as string || ''}
                    onChange={(e) => saveNestedSetting(['discord', 'serverJoinIp'], e.target.value)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    placeholder="your-server.com or public IP"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Server Join Port</label>
                  <input
                    type="text"
                    value={(settings?.discord as Record<string, unknown>)?.serverJoinPort as string || ''}
                    onChange={(e) => saveNestedSetting(['discord', 'serverJoinPort'], e.target.value)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    placeholder="27015"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Server Password</label>
                  <input
                    type="password"
                    value={(settings?.discord as Record<string, unknown>)?.serverPassword as string || ''}
                    onChange={(e) => saveNestedSetting(['discord', 'serverPassword'], e.target.value)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    placeholder="Server password (if any)"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Automation Settings */}
        {activeTab === 'automation' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Automation
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span>Auto-pause (slomo)</span>
                    <p className="text-xs text-text-muted">Slow server time when 0 players (requires RCON)</p>
                  </div>
                  <ToggleSwitch
                    checked={(settings?.automation as Record<string, unknown>)?.autoPause as boolean || false}
                    onChange={(checked) => saveNestedSetting(['automation', 'autoPause'], checked)}
                    ariaLabel="Auto-pause"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Auto-shutdown</span>
                    <p className="text-xs text-text-muted">Stop server after no players for a set time</p>
                  </div>
                  <ToggleSwitch
                    checked={(settings?.automation as Record<string, unknown>)?.autoShutdown as boolean || false}
                    onChange={(checked) => saveNestedSetting(['automation', 'autoShutdown'], checked)}
                    ariaLabel="Auto-shutdown"
                  />
                </div>
                {Boolean((settings?.automation as Record<string, unknown>)?.autoShutdown) && (
                  <div className="pl-4 border-l-2 border-border">
                    <label className="block mb-2 text-text-primary">Shutdown delay (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={(settings?.automation as Record<string, unknown>)?.autoShutdownMinutes as number || 10}
                      onChange={(e) => saveNestedSetting(['automation', 'autoShutdownMinutes'], parseInt(e.target.value) || 10)}
                      className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                    />
                    <p className="text-xs text-text-muted mt-1">Minutes to wait with 0 players before stopping</p>
                  </div>
                )}
                <div>
                  <label className="block mb-2 text-text-primary">Player check interval (seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={(settings?.automation as Record<string, unknown>)?.playerCheckInterval as number || 30}
                    onChange={(e) => saveNestedSetting(['automation', 'playerCheckInterval'], parseInt(e.target.value) || 30)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">How often to poll RCON for player count (requires RCON)</p>
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Stats refresh interval (seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={(settings?.automation as Record<string, unknown>)?.statsRefreshInterval as number || 30}
                    onChange={(e) => saveNestedSetting(['automation', 'statsRefreshInterval'], parseInt(e.target.value) || 30)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">How often to refresh server CPU/RAM stats</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Console Settings */}
        {activeTab === 'console' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Console
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span>Auto scroll by default</span>
                    <p className="text-xs text-text-muted">Automatically scroll console to bottom</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.consoleAutoScroll !== false}
                    onChange={(checked) => saveSetting('consoleAutoScroll', checked)}
                    ariaLabel="Auto scroll by default"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Max console lines</label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={Number(settings?.maxConsoleLines) || 1000}
                    onChange={(e) => saveSetting('maxConsoleLines', parseInt(e.target.value) || 1000)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">Maximum lines to keep in console (100-10000)</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Show timestamps</span>
                    <p className="text-xs text-text-muted">Display timestamps in console output</p>
                  </div>
                  <ToggleSwitch
                    checked={settings?.showTimestamps !== false}
                    onChange={(checked) => saveSetting('showTimestamps', checked)}
                    ariaLabel="Show timestamps"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span>Word wrap</span>
                    <p className="text-xs text-text-muted">Wrap long lines in console</p>
                  </div>
                  <ToggleSwitch
                    checked={Boolean(settings?.consoleWordWrap)}
                    onChange={(checked) => saveSetting('consoleWordWrap', checked)}
                    ariaLabel="Word wrap"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-text-primary">Font size</label>
                  <input
                    type="number"
                    min="10"
                    max="20"
                    value={Number(settings?.consoleFontSize) || 12}
                    onChange={(e) => saveSetting('consoleFontSize', parseInt(e.target.value) || 12)}
                    className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  />
                  <p className="text-xs text-text-muted mt-1">Console font size in pixels (10-20)</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Dev Settings */}
        {activeTab === 'dev' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
              className="system-card p-6 border-yellow-500/20"
            >
              <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
                Developer Mode
              </h2>
              <div className="space-y-4 text-text-secondary font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span>Enable developer mode</span>
                    <p className="text-xs text-text-muted">Show advanced developer options</p>
                  </div>
                  <ToggleSwitch
                    checked={devMode}
                    onChange={(checked) => saveDevMode(checked)}
                    ariaLabel="Enable developer mode"
                  />
                </div>
                {devMode && (
                  <div className="pl-4 space-y-4 border-l-2 border-yellow-500/30 mt-4">
                    <div>
                      <p className="text-text-secondary font-mono text-sm mb-2">
                        Reset first time setup to show the setup screen again on next launch.
                      </p>
                      <motion.button
                        onClick={handleResetSetup}
                        className="btn-secondary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        RESET SETUP
                      </motion.button>
                    </div>
                    <div>
                      <label className="block mb-2 text-text-primary">Config file location</label>
                      <input
                        type="text"
                        value={settings?.serversDirectory ? String(settings.serversDirectory).replace(/\\servers$/, '') + '\\servers.json' : 'AppData\\Roaming\\.nodexity\\ARK\\servers.json'}
                        readOnly
                        className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-xs focus:outline-none focus:border-accent/50 rounded"
                      />
                      <p className="text-xs text-text-muted mt-1">Location of the configuration file</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span>Enable debug logging</span>
                        <p className="text-xs text-text-muted">Show detailed debug information</p>
                      </div>
                      <ToggleSwitch
                        checked={Boolean(settings?.debugLogging)}
                        onChange={(checked) => saveSetting('debugLogging', checked)}
                        ariaLabel="Enable debug logging"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span>Show performance metrics</span>
                        <p className="text-xs text-text-muted">Display performance information</p>
                      </div>
                      <ToggleSwitch
                        checked={Boolean(settings?.showPerformanceMetrics)}
                        onChange={(checked) => saveSetting('showPerformanceMetrics', checked)}
                        ariaLabel="Show performance metrics"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-text-primary">Log level</label>
                      <select
                        value={String(settings?.logLevel || 'info')}
                        onChange={(e) => saveSetting('logLevel', e.target.value)}
                        className="select-custom w-full"
                      >
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                        <option value="verbose">Verbose</option>
                      </select>
                      <p className="text-xs text-text-muted mt-1">Minimum log level to display</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* About & Licenses */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
            className="system-card p-6"
          >
            <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
              About Nodexity ARK
            </h2>
            <p className="text-sm text-text-secondary font-mono mb-4">
              Nodexity ARK is a local first ARK server manager. Version 0.1.0.
            </p>
            <h3 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-wider mb-3">
              Third-party licenses
            </h3>
            <p className="text-xs text-text-muted font-mono mb-4">
              This app uses the following open source software. See each project for full license text.
            </p>
            <div className="space-y-4 text-sm font-mono">
              <div className="border border-border rounded-lg p-4 bg-background-secondary">
                <div className="font-semibold text-text-primary mb-1">Modrinth</div>
                <p className="text-text-secondary text-xs mb-2">
                  Plugin discovery and installation uses the Modrinth API.
                </p>
                <a
                  href="https://modrinth.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-xs"
                >
                  modrinth.com
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
