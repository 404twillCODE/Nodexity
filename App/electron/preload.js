const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    onClosePrompt: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('close-prompt', handler);
      return () => ipcRenderer.removeListener('close-prompt', handler);
    },
    respondToClosePrompt: (confirmed) => ipcRenderer.send('close-prompt-response', confirmed),
  },
  server: {
    checkJava: () => ipcRenderer.invoke('check-java'),
    getPaperVersions: () => ipcRenderer.invoke('get-paper-versions'),
    getSpigotVersions: () => ipcRenderer.invoke('get-spigot-versions'),
    getVanillaVersions: () => ipcRenderer.invoke('get-vanilla-versions'),
    getFabricVersions: () => ipcRenderer.invoke('get-fabric-versions'),
    getForgeVersions: () => ipcRenderer.invoke('get-forge-versions'),
    getPurpurVersions: () => ipcRenderer.invoke('get-purpur-versions'),
    getVelocityVersions: () => ipcRenderer.invoke('get-velocity-versions'),
    getWaterfallVersions: () => ipcRenderer.invoke('get-waterfall-versions'),
    getBungeeCordVersions: () => ipcRenderer.invoke('get-bungeecord-versions'),
    selectJarFile: () => ipcRenderer.invoke('select-jar-file'),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    isSetupComplete: () => ipcRenderer.invoke('is-setup-complete'),
    getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
    saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
    completeSetup: (settings) => ipcRenderer.invoke('complete-setup', settings),
    resetSetup: () => ipcRenderer.invoke('reset-setup'),
    showFolderDialog: (options) => ipcRenderer.invoke('show-folder-dialog', options),
    listServers: () => ipcRenderer.invoke('list-servers'),
    findAvailablePort: (startPort) => ipcRenderer.invoke('find-available-port', startPort),
    createServer: (serverName, serverType, version, ramGB, port, manualJarPath, displayName) => ipcRenderer.invoke('create-server', serverName, serverType, version, ramGB, port, manualJarPath, displayName),
    importServer: (sourceFolderPath, serverName) => ipcRenderer.invoke('import-server', sourceFolderPath, serverName),
    startServer: (serverName, ramGB) => ipcRenderer.invoke('start-server', serverName, ramGB),
    stopServer: (serverName) => ipcRenderer.invoke('stop-server', serverName),
    restartServer: (serverName, ramGB) => ipcRenderer.invoke('restart-server', serverName, ramGB),
    killServer: (serverName) => ipcRenderer.invoke('kill-server', serverName),
    getServerLogs: (serverName, maxLines) => ipcRenderer.invoke('get-server-logs', serverName, maxLines),
    setupLogStreaming: (serverName) => ipcRenderer.invoke('setup-log-streaming', serverName),
    getPlayerCount: (serverName) => ipcRenderer.invoke('get-player-count', serverName),
    updateServerRAM: (serverName, ramGB) => ipcRenderer.invoke('update-server-ram', serverName, ramGB),
    sendCommand: (serverName, command) => ipcRenderer.invoke('send-server-command', serverName, command),
    getServerFiles: (serverName, filePath) => ipcRenderer.invoke('get-server-files', serverName, filePath),
    readServerFile: (serverName, filePath) => ipcRenderer.invoke('read-server-file', serverName, filePath),
    readServerFileBinary: (serverName, filePath) => ipcRenderer.invoke('read-server-file-binary', serverName, filePath),
    writeServerFile: (serverName, filePath, content) => ipcRenderer.invoke('write-server-file', serverName, filePath, content),
    writeServerFileBinary: (serverName, filePath, contentBase64, wasGzipped) => ipcRenderer.invoke('write-server-file-binary', serverName, filePath, contentBase64, wasGzipped),
    readServerFileNbt: (serverName, filePath) => ipcRenderer.invoke('read-server-file-nbt', serverName, filePath),
    writeServerFileNbt: (serverName, filePath, parsed, nbtFormat) => ipcRenderer.invoke('write-server-file-nbt', serverName, filePath, parsed, nbtFormat),
    getServerConfig: (serverName) => ipcRenderer.invoke('get-server-config', serverName),
    listPlugins: (serverName) => ipcRenderer.invoke('list-plugins', serverName),
    deletePlugin: (serverName, pluginName) => ipcRenderer.invoke('delete-plugin', serverName, pluginName),
    checkJarSupportsPlugins: (serverName) => ipcRenderer.invoke('check-jar-supports-plugins', serverName),
    getModrinthPlugins: (minecraftVersion, limit) => ipcRenderer.invoke('get-modrinth-plugins', minecraftVersion, limit),
    installModrinthPlugin: (serverName, projectId, minecraftVersion) => ipcRenderer.invoke('install-modrinth-plugin', serverName, projectId, minecraftVersion),
    listWorlds: (serverName) => ipcRenderer.invoke('list-worlds', serverName),
    deleteWorld: (serverName, worldName) => ipcRenderer.invoke('delete-world', serverName, worldName),
    getServerProperties: (serverName) => ipcRenderer.invoke('get-server-properties', serverName),
    updateServerProperties: (serverName, properties) => ipcRenderer.invoke('update-server-properties', serverName, properties),
    deleteServer: (serverName) => ipcRenderer.invoke('delete-server', serverName),
    getServerUsage: (serverName) => ipcRenderer.invoke('get-server-usage', serverName),
    getAllServersUsage: () => ipcRenderer.invoke('get-all-servers-usage'),
    getServersDiskUsage: () => ipcRenderer.invoke('get-servers-disk-usage'),
    onServerLog: (callback) => {
      ipcRenderer.on('server-log', (event, data) => callback(data));
    },
    removeServerLogListener: () => {
      ipcRenderer.removeAllListeners('server-log');
    },
    onAppSettingsUpdated: (callback) => {
      const handler = (event, data) => callback(data);
      ipcRenderer.on('app-settings-updated', handler);
      return () => ipcRenderer.removeListener('app-settings-updated', handler);
    },
    onUpdateAvailable: (callback) => {
      const handler = (event, data) => callback(data);
      ipcRenderer.on('update-available', handler);
      return () => ipcRenderer.removeListener('update-available', handler);
    }
  },
  playit: {
    ensureInstalled: () => ipcRenderer.invoke('playit-ensure-installed'),
    start: (serverName, options) => ipcRenderer.invoke('playit-start', serverName, options),
    stop: (serverName) => ipcRenderer.invoke('playit-stop', serverName),
    restart: (serverName) => ipcRenderer.invoke('playit-restart', serverName),
    getStatus: (serverName) => ipcRenderer.invoke('playit-status', serverName),
    setSecret: (serverName, secret) => ipcRenderer.invoke('playit-set-secret', serverName, secret),
    hasSecret: (serverName) => ipcRenderer.invoke('playit-has-secret', serverName),
    onLog: (callback) => {
      const handler = (event, data) => callback(data.serverName, data.line, data.type);
      ipcRenderer.on('playit-log', handler);
      return () => ipcRenderer.removeListener('playit-log', handler);
    },
  },
});
