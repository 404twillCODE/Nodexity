import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../components/ToastProvider';

/** App settings shape from getAppSettings / saveAppSettings */
export interface AppSettings {
  defaultRAM?: number;
  defaultPort?: number;
  serversDirectory?: string;
  backupsDirectory?: string;
  consoleAutoScroll?: boolean;
  showBootSequence?: boolean;
  reduceAnimations?: boolean;
  devMode?: boolean;
  defaultServerType?: string;
  defaultVersion?: string;
  minimizeToTray?: boolean;
  startWithWindows?: boolean;
  autoBackup?: boolean;
  backupInterval?: number;
  maxBackups?: number;
  maxConsoleLines?: number;
  statusRefreshRate?: number;
  consoleWordWrap?: boolean;
  consoleFontSize?: number;
  notifications?: { updates?: boolean; statusChanges?: boolean; crashes?: boolean };
  sidebarCollapsed?: boolean;
  [key: string]: unknown;
}

declare global {
  interface Window {
    electronAPI?: {
      windowControls?: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        onClosePrompt: (callback: () => void) => () => void;
        respondToClosePrompt: (confirmed: boolean) => void;
      };
      server: {
        checkJava: () => Promise<{ installed: boolean; version: string | null }>;
        getPaperVersions: () => Promise<string[]>;
        getSpigotVersions: () => Promise<string[]>;
        getVanillaVersions: () => Promise<string[]>;
        getFabricVersions: () => Promise<string[]>;
        getForgeVersions: () => Promise<string[]>;
        getPurpurVersions: () => Promise<string[]>;
        getVelocityVersions: () => Promise<string[]>;
        getWaterfallVersions: () => Promise<string[]>;
        getBungeeCordVersions: () => Promise<string[]>;
        selectJarFile: () => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
        getSystemInfo: () => Promise<{
          cpu: { model: string; cores: number; threads: number; tempCelsius?: number | null };
          memory: { totalGB: number; freeGB: number; usedGB: number };
          drives: Array<{ letter: string; label: string; totalGB: number; freeGB: number; usedGB: number }>;
          platform: string;
          arch: string;
          hostname: string;
          localAddress?: string | null;
        }>;
        isSetupComplete: () => Promise<boolean>;
        getAppSettings: () => Promise<AppSettings>;
        saveAppSettings: (settings: AppSettings) => Promise<AppSettings>;
        completeSetup: (settings?: AppSettings) => Promise<void>;
        resetSetup: () => Promise<void>;
        showFolderDialog: (options: { title: string; defaultPath?: string }) => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
        listServers: () => Promise<Server[]>;
        findAvailablePort: (startPort: number) => Promise<number | null>;
        createServer: (serverName: string, serverType: string, version?: string | null, ramGB?: number, port?: number | null, manualJarPath?: string | null, displayName?: string | null) => Promise<{ success: boolean; error?: string; path?: string; jarFile?: string; version?: string; build?: number }>;
        importServer: (sourceFolderPath: string, serverName: string) => Promise<{ success: boolean; error?: string }>;
        startServer: (serverName: string, ramGB?: number) => Promise<{ success: boolean; error?: string; pid?: number }>;
        stopServer: (serverName: string) => Promise<{ success: boolean; error?: string }>;
        restartServer: (serverName: string, ramGB?: number) => Promise<{ success: boolean; error?: string; pid?: number }>;
        killServer: (serverName: string) => Promise<{ success: boolean; error?: string }>;
        getServerLogs: (serverName: string, maxLines?: number) => Promise<{ success: boolean; lines?: string[]; error?: string }>;
        setupLogStreaming: (serverName: string) => Promise<{ success: boolean; error?: string }>;
        getPlayerCount: (serverName: string) => Promise<{ success: boolean; online?: number; max?: number; error?: string }>;
        updateServerRAM: (serverName: string, ramGB: number) => Promise<{ success: boolean; error?: string }>;
        sendCommand: (serverName: string, command: string) => Promise<{ success: boolean; error?: string }>;
        getServerFiles: (serverName: string, filePath?: string) => Promise<{ success: boolean; items?: Array<{ name: string; type: 'file' | 'directory'; size: number; modified: string; path: string }>; error?: string }>;
        readServerFile: (serverName: string, filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        readServerFileBinary: (serverName: string, filePath: string) => Promise<{ success: boolean; contentBase64?: string; wasGzipped?: boolean; error?: string }>;
        writeServerFile: (serverName: string, filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        writeServerFileBinary: (serverName: string, filePath: string, contentBase64: string, wasGzipped?: boolean) => Promise<{ success: boolean; error?: string }>;
        readServerFileNbt: (serverName: string, filePath: string) => Promise<{ success: boolean; parsed?: unknown; type?: string; error?: string }>;
        writeServerFileNbt: (serverName: string, filePath: string, parsed: unknown, nbtFormat: string) => Promise<{ success: boolean; error?: string }>;
        listPlugins: (serverName: string) => Promise<{ success: boolean; plugins?: Array<{ name: string; size: number; modified: string }>; supportsPlugins?: boolean; error?: string }>;
        deletePlugin: (serverName: string, pluginName: string) => Promise<{ success: boolean; error?: string }>;
        checkJarSupportsPlugins: (serverName: string) => Promise<{ supportsPlugins: boolean }>;
        getModrinthPlugins: (minecraftVersion: string | null, limit?: number) => Promise<Array<{ id: string; name: string; slug: string; [key: string]: unknown }>>;
        installEssentialsXFromGitHub: (serverName: string) => Promise<{ success: boolean; error?: string }>;
        installModrinthPlugin: (serverName: string, projectId: string, minecraftVersion: string) => Promise<{ success: boolean; error?: string }>;
        listMods: (serverName: string) => Promise<{ success: boolean; mods?: Array<{ name: string; size: number; modified: string }>; supportsMods?: boolean; error?: string }>;
        deleteMod: (serverName: string, modName: string) => Promise<{ success: boolean; error?: string }>;
        checkJarSupportsMods: (serverName: string) => Promise<{ supportsMods: boolean }>;
        getModrinthMods: (minecraftVersion: string | null, loader: string, limit?: number) => Promise<Array<{ project_id: string; title: string; slug: string; [key: string]: unknown }>>;
        installModrinthMod: (serverName: string, projectId: string, minecraftVersion: string) => Promise<{ success: boolean; error?: string }>;
        installGeyserFloodgate: (serverName: string, serverPort?: number) => Promise<{ success: boolean; error?: string }>;
        getServerConfig: (serverName: string) => Promise<{ version?: string; path?: string; [key: string]: unknown } | null>;
        listWorlds: (serverName: string) => Promise<{ success: boolean; worlds?: Array<{ name: string; size: number; modified: string }>; error?: string }>;
        deleteWorld: (serverName: string, worldName: string) => Promise<{ success: boolean; error?: string }>;
        getServerProperties: (serverName: string) => Promise<{ success: boolean; properties?: Record<string, string>; error?: string }>;
        updateServerProperties: (serverName: string, properties: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
        deleteServer: (serverName: string) => Promise<{ success: boolean; error?: string }>;
        getServerUsage: (serverName: string) => Promise<{ success: boolean; cpu?: number; ram?: number; ramMB?: number; error?: string }>;
        getAllServersUsage: () => Promise<{ success: boolean; totalCPU?: number; totalRAM?: number; totalRAMMB?: number; serverUsages?: Record<string, { cpu: number; ram: number; ramMB: number }>; error?: string }>;
        getServersDiskUsage: () => Promise<{ success: boolean; totalSize?: number; totalSizeGB?: number; serverSizes?: Record<string, number>; error?: string }>;
        onServerLog: (callback: (data: { serverName: string; type: 'stdout' | 'stderr'; data: string }) => void) => void;
        removeServerLogListener: () => void;
        onAppSettingsUpdated: (callback: (data: AppSettings) => void) => () => void;
        onUpdateAvailable: (callback: (data: { version: string; url: string }) => void) => () => void;
      };
    };
  }
}

export interface Server {
  id: string;
  name: string;
  version: string;
  status: 'RUNNING' | 'STOPPED' | 'STARTING';
  port: number;
  ramGB?: number;
  serverType?: string;
}

export interface JavaStatus {
  installed: boolean;
  version: string | null;
  loading: boolean;
}

export function useServerManager() {
  const { notify } = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [javaStatus, setJavaStatus] = useState<JavaStatus>({ installed: false, version: null, loading: true });
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [refreshMs, setRefreshMs] = useState(2000);
  const prevServersRef = useRef<Server[]>([]);
  const userStopRef = useRef<Map<string, number>>(new Map());
  const lastNotifyRef = useRef<Map<string, number>>(new Map());
  const NOTIFY_COOLDOWN_MS = 45000; // Don't re-notify same server for 45 seconds

  const markUserStop = (serverName: string) => {
    userStopRef.current.set(serverName, Date.now());
  };

  const wasUserStop = (serverName: string) => {
    const timestamp = userStopRef.current.get(serverName);
    if (!timestamp) return false;
    if (Date.now() - timestamp < 15000) return true;
    userStopRef.current.delete(serverName);
    return false;
  };

  const notifyIfAllowed = useCallback((serverId: string, title: string, body: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (!appSettings?.notifications) return;
    const key = `${serverId}:${title}`;
    const now = Date.now();
    const last = lastNotifyRef.current.get(key);
    if (last && now - last < NOTIFY_COOLDOWN_MS) return;
    lastNotifyRef.current.set(key, now);
    notify({ type, title, message: body });
  }, [appSettings?.notifications, notify]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) return;
      try {
        const settings = await window.electronAPI.server.getAppSettings();
        setAppSettings(settings || {});
        const nextRate = Math.max(1, Math.min(10, Number(settings?.statusRefreshRate ?? 2)));
        setRefreshMs(nextRate * 1000);
      } catch (error) {
        console.error('Failed to load app settings:', error);
      }
    };

    const handleSettingsUpdate = (updated: AppSettings) => {
      setAppSettings(updated || {});
      const nextRate = Math.max(1, Math.min(10, Number(updated?.statusRefreshRate ?? 2)));
      setRefreshMs(nextRate * 1000);
    };

    loadSettings();
    const unsubscribe = window.electronAPI?.server?.onAppSettingsUpdated?.(handleSettingsUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const checkJava = useCallback(async () => {
    if (!window.electronAPI) return;
    setJavaStatus(prev => ({ ...prev, loading: true }));
    try {
      const result = await window.electronAPI.server.checkJava();
      setJavaStatus({ installed: result.installed, version: result.version, loading: false });
    } catch (error) {
      setJavaStatus({ installed: false, version: null, loading: false });
    }
  }, []);

  const loadServers = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const serverList = await window.electronAPI.server.listServers();
      setServers(prev => {
        if (prev.length !== serverList.length) return serverList;
        const isSame = prev.every((server, index) => {
          const next = serverList[index];
          return (
            server.id === next.id &&
            server.name === next.name &&
            server.status === next.status &&
            server.version === next.version &&
            server.port === next.port &&
            (server.ramGB || 0) === (next.ramGB || 0)
          );
        });
        return isSame ? prev : serverList;
      });
      if (prevServersRef.current.length > 0 && appSettings?.notifications) {
        serverList.forEach((nextServer) => {
          const prevServer = prevServersRef.current.find((item) => item.id === nextServer.id);
          if (!prevServer || prevServer.status === nextServer.status) return;

          const isCrash = prevServer.status === 'RUNNING' && nextServer.status === 'STOPPED' && !wasUserStop(nextServer.id);

          if (isCrash && appSettings.notifications?.crashes) {
            notifyIfAllowed(nextServer.id, 'Server crash detected', `${nextServer.name} stopped unexpectedly.`, 'error');
          } else if (appSettings.notifications?.statusChanges !== false) {
            if (nextServer.status === 'RUNNING') {
              notifyIfAllowed(nextServer.id, 'Server started', `${nextServer.name} is now running.`, 'success');
            } else if (nextServer.status === 'STOPPED') {
              notifyIfAllowed(nextServer.id, 'Server stopped', `${nextServer.name} has stopped.`, 'info');
            }
          }
        });
      }
      prevServersRef.current = serverList;
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(prev => (prev ? false : prev));
    }
  }, [appSettings?.notifications, notifyIfAllowed]);

  const createServer = useCallback(async (serverName: string = 'default', serverType: string = 'paper', version?: string | null, ramGB: number = 4, port?: number | null, manualJarPath?: string | null, displayName?: string | null) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.createServer(serverName, serverType, version, ramGB, port, manualJarPath, displayName);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [loadServers]);

  const getPaperVersions = useCallback(async () => {
    if (!window.electronAPI) return [];
    try {
      return await window.electronAPI.server.getPaperVersions();
    } catch (error) {
      console.error('Failed to fetch Paper versions:', error);
      return [];
    }
  }, []);

  const updateServerRAM = useCallback(async (serverName: string, ramGB: number) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.updateServerRAM(serverName, ramGB);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [loadServers]);

  const startServer = useCallback(async (serverName: string, ramGB: number = 4) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.startServer(serverName, ramGB);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [loadServers]);

  const stopServer = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      markUserStop(serverName);
      const result = await window.electronAPI.server.stopServer(serverName);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [loadServers]);

  const restartServer = useCallback(async (serverName: string, ramGB: number = 4) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      markUserStop(serverName);
      const result = await window.electronAPI.server.restartServer(serverName, ramGB);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [loadServers]);

  const killServer = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      markUserStop(serverName);
      const result = await window.electronAPI.server.killServer(serverName);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [loadServers]);

  const getPlayerCount = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getPlayerCount(serverName);
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const sendCommand = useCallback(async (serverName: string, command: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.sendCommand(serverName, command);
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const deleteServer = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.deleteServer(serverName);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [loadServers]);

  const getServerUsage = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getServerUsage(serverName);
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const getAllServersUsage = useCallback(async () => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getAllServersUsage();
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const getServersDiskUsage = useCallback(async () => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getServersDiskUsage();
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  useEffect(() => {
    checkJava();
    loadServers();
    
    // Poll server status periodically
    const interval = setInterval(() => {
      loadServers();
    }, refreshMs);

    return () => clearInterval(interval);
  }, [checkJava, loadServers, refreshMs]);

  return {
    servers,
    javaStatus,
    loading,
    checkJava,
    getPaperVersions,
    createServer,
    startServer,
    stopServer,
    restartServer,
    killServer,
    getPlayerCount,
    updateServerRAM,
    sendCommand,
    deleteServer,
    getServerUsage,
    getAllServersUsage,
    getServersDiskUsage,
    refreshServers: loadServers,
  };
}

