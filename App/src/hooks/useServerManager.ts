import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      windowControls?: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
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
          cpu: { model: string; cores: number; threads: number };
          memory: { totalGB: number; freeGB: number; usedGB: number };
          drives: Array<{ letter: string; label: string; totalGB: number; freeGB: number; usedGB: number }>;
          platform: string;
          arch: string;
          hostname: string;
        }>;
        isSetupComplete: () => Promise<boolean>;
        getAppSettings: () => Promise<any>;
        saveAppSettings: (settings: any) => Promise<void>;
        completeSetup: (settings?: any) => Promise<void>;
        resetSetup: () => Promise<void>;
        showFolderDialog: (options: { title: string; defaultPath?: string }) => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
        listServers: () => Promise<Server[]>;
        findAvailablePort: (startPort: number) => Promise<number | null>;
        createServer: (serverName: string, serverType: string, version?: string | null, ramGB?: number, port?: number | null, manualJarPath?: string | null, displayName?: string | null) => Promise<{ success: boolean; error?: string; path?: string; jarFile?: string; version?: string; build?: number }>;
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
        writeServerFile: (serverName: string, filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        listPlugins: (serverName: string) => Promise<{ success: boolean; plugins?: Array<{ name: string; size: number; modified: string }>; error?: string }>;
        deletePlugin: (serverName: string, pluginName: string) => Promise<{ success: boolean; error?: string }>;
        listWorlds: (serverName: string) => Promise<{ success: boolean; worlds?: Array<{ name: string; size: number; modified: string }>; error?: string }>;
        getServerProperties: (serverName: string) => Promise<{ success: boolean; properties?: Record<string, string>; error?: string }>;
        updateServerProperties: (serverName: string, properties: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
        deleteServer: (serverName: string) => Promise<{ success: boolean; error?: string }>;
        getServerUsage: (serverName: string) => Promise<{ success: boolean; cpu?: number; ram?: number; ramMB?: number; error?: string }>;
        getAllServersUsage: () => Promise<{ success: boolean; totalCPU?: number; totalRAM?: number; totalRAMMB?: number; serverUsages?: Record<string, { cpu: number; ram: number; ramMB: number }>; error?: string }>;
        getServersDiskUsage: () => Promise<{ success: boolean; totalSize?: number; totalSizeGB?: number; serverSizes?: Record<string, number>; error?: string }>;
        onServerLog: (callback: (data: { serverName: string; type: 'stdout' | 'stderr'; data: string }) => void) => void;
        removeServerLogListener: () => void;
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
}

export interface JavaStatus {
  installed: boolean;
  version: string | null;
  loading: boolean;
}

export function useServerManager() {
  const [servers, setServers] = useState<Server[]>([]);
  const [javaStatus, setJavaStatus] = useState<JavaStatus>({ installed: false, version: null, loading: true });
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(prev => (prev ? false : prev));
    }
  }, []);

  const createServer = useCallback(async (serverName: string = 'default', serverType: string = 'paper', version?: string | null, ramGB: number = 4, port?: number | null, manualJarPath?: string | null, displayName?: string | null) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.createServer(serverName, serverType, version, ramGB, port, manualJarPath, displayName);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
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
    } catch (error: any) {
      return { success: false, error: error.message };
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadServers]);

  const stopServer = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.stopServer(serverName);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadServers]);

  const restartServer = useCallback(async (serverName: string, ramGB: number = 4) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.restartServer(serverName, ramGB);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadServers]);

  const killServer = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      const result = await window.electronAPI.server.killServer(serverName);
      if (result.success) {
        await loadServers();
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadServers]);

  const getPlayerCount = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getPlayerCount(serverName);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const sendCommand = useCallback(async (serverName: string, command: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.sendCommand(serverName, command);
    } catch (error: any) {
      return { success: false, error: error.message };
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadServers]);

  const getServerUsage = useCallback(async (serverName: string) => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getServerUsage(serverName);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const getAllServersUsage = useCallback(async () => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getAllServersUsage();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const getServersDiskUsage = useCallback(async () => {
    if (!window.electronAPI) return { success: false, error: 'Electron API not available' };
    try {
      return await window.electronAPI.server.getServersDiskUsage();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    checkJava();
    loadServers();
    
    // Poll server status periodically
    const interval = setInterval(() => {
      loadServers();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkJava, loadServers]);

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

