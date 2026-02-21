const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

// Keep Nodexity data (servers, backups, config) in .nodexity; put Electron/Chromium caches in a subfolder
const config = require('./modules/config');
const ELECTRON_USER_DATA = path.join(config.NODEXITY_DIR, '_app');
app.setPath('userData', ELECTRON_USER_DATA);

const serverManager = require('./serverManager');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let minimizeToTrayEnabled = false;
let pendingUpdateCheck = null;
let cachedSettings = null;
let closePromptInProgress = false;

function compareVersions(a, b) {
  const partsA = String(a).replace(/^v/i, '').split('.').map(Number);
  const partsB = String(b).replace(/^v/i, '').split('.').map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i += 1) {
    const aVal = partsA[i] || 0;
    const bVal = partsB[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
}

function resolveAppIcon() {
  const candidates = [
    path.join(app.getAppPath(), 'logo', 'icon.png'),
    path.join(app.getAppPath(), '..', 'logo', 'icon.png'),
    path.join(__dirname, '..', 'logo', 'icon.png'),
  ];
  const iconPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!iconPath) return nativeImage.createEmpty();
  return nativeImage.createFromPath(iconPath);
}

function ensureTray() {
  if (tray) return;
  const icon = resolveAppIcon();
  tray = new Tray(icon);
  tray.setToolTip('Nodexity');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Nodexity',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

function scheduleUpdateCheck() {
  if (pendingUpdateCheck) return;
  pendingUpdateCheck = setTimeout(() => {
    pendingUpdateCheck = null;
    checkForUpdates();
  }, 5000);
}

function checkForUpdates() {
  const settings = cachedSettings || {};
  if (!settings.autoUpdateCheck) return;

  const requestOptions = {
    headers: {
      'User-Agent': 'Nodexity'
    }
  };

  https.get('https://api.github.com/repos/404twillCODE/Nodexity/releases/latest', requestOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        if (!data) return;
        const payload = JSON.parse(data);
        const latestVersion = payload.tag_name || payload.name;
        if (!latestVersion) return;
        const currentVersion = app.getVersion();
        if (compareVersions(latestVersion, currentVersion) > 0) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-available', {
              version: latestVersion,
              url: payload.html_url || 'https://github.com/404twillCODE/Nodexity/releases'
            });
          }
        }
      } catch (error) {
        // Ignore update check errors
      }
    });
  }).on('error', () => {
    // Ignore update check errors
  });
}

function applyAppSettings(settings) {
  cachedSettings = settings || cachedSettings || {};
  minimizeToTrayEnabled = !!cachedSettings.minimizeToTray;

  if (cachedSettings.startWithWindows !== undefined) {
    try {
      app.setLoginItemSettings({
        openAtLogin: !!cachedSettings.startWithWindows
      });
    } catch (error) {
      // Ignore login item errors
    }
  }

  if (!minimizeToTrayEnabled) {
    destroyTray();
  }

  scheduleUpdateCheck();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    frame: false,
    titleBarStyle: 'hidden',
    icon: resolveAppIcon(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
  });

  mainWindow = win;

  // Open external links (http/https) in the user's system browser, not in-app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (/^https?:\/\//i.test(url) && !url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on('minimize', (event) => {
    if (minimizeToTrayEnabled && !isQuitting) {
      event.preventDefault();
      win.hide();
      ensureTray();
    }
  });

  win.on('close', (event) => {
    if (minimizeToTrayEnabled && !isQuitting) {
      event.preventDefault();
      win.hide();
      ensureTray();
      return;
    }
    if (isQuitting || closePromptInProgress) return;
    event.preventDefault();
    void (async () => {
      try {
        const servers = await serverManager.listServers();
        const hasRunningServers = servers.some(
          (server) => server.status === 'RUNNING' || server.status === 'STARTING'
        );
        if (hasRunningServers) {
          closePromptInProgress = true;
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('close-prompt');
          } else {
            closePromptInProgress = false;
          }
          return;
        }
      } catch (error) {
        // If we cannot determine server state, allow close without prompt
      }
      isQuitting = true;
      app.quit();
    })();
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return win;
}

// Window controls
ipcMain.on('window-minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.on('close-prompt-response', (event, confirmed) => {
  closePromptInProgress = false;
  if (confirmed) {
    isQuitting = true;
    app.quit();
  }
});

// Java detection
ipcMain.handle('check-java', async () => {
  return await serverManager.checkJava();
});

// System information
ipcMain.handle('get-system-info', async () => {
  return await serverManager.getSystemInfo();
});

ipcMain.handle('is-setup-complete', async () => {
  return await serverManager.isSetupComplete();
});

ipcMain.handle('get-app-settings', async () => {
  return await serverManager.getAppSettings();
});

ipcMain.handle('save-app-settings', async (event, settings) => {
  const updated = await serverManager.saveAppSettings(settings);
  applyAppSettings(updated);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-settings-updated', updated);
  }
  return updated;
});

ipcMain.handle('complete-setup', async (event, settings) => {
  await serverManager.completeSetup(settings);
  const updated = await serverManager.getAppSettings();
  applyAppSettings(updated);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-settings-updated', updated);
  }
  return updated;
});

ipcMain.handle('reset-setup', async () => {
  return await serverManager.resetSetup();
});

// Folder picker dialogs
ipcMain.handle('show-folder-dialog', async (event, options) => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win || mainWindow, {
    properties: ['openDirectory'],
    title: options.title || 'Select Folder',
    defaultPath: options.defaultPath
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  return { success: false, canceled: true };
});

// Version management
ipcMain.handle('get-paper-versions', async () => {
  return await serverManager.getPaperVersions();
});

ipcMain.handle('get-spigot-versions', async () => {
  return await serverManager.getSpigotVersions();
});

ipcMain.handle('get-vanilla-versions', async () => {
  return await serverManager.getVanillaVersions();
});

ipcMain.handle('get-fabric-versions', async () => {
  return await serverManager.getFabricVersions();
});

ipcMain.handle('get-forge-versions', async () => {
  return await serverManager.getForgeVersions();
});

ipcMain.handle('get-purpur-versions', async () => {
  return await serverManager.getPurpurVersions();
});

ipcMain.handle('get-velocity-versions', async () => {
  return await serverManager.getVelocityVersions();
});

ipcMain.handle('get-waterfall-versions', async () => {
  return await serverManager.getWaterfallVersions();
});

ipcMain.handle('get-bungeecord-versions', async () => {
  return await serverManager.getBungeeCordVersions();
});

// File picker for manual jar
ipcMain.handle('select-jar-file', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Server JAR File',
    filters: [
      { name: 'JAR Files', extensions: ['jar'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  
  if (result.canceled) {
    return { success: false, canceled: true };
  }
  return { success: true, path: result.filePaths[0] };
});

// Server management IPC handlers
ipcMain.handle('list-servers', async () => {
  return await serverManager.listServers();
});

ipcMain.handle('find-available-port', async (event, startPort) => {
  return await serverManager.findAvailablePort(startPort);
});

ipcMain.handle('create-server', async (event, serverName, serverType, version, ramGB, port, manualJarPath, displayName) => {
  return await serverManager.createServer(serverName, serverType, version, ramGB, port, manualJarPath, displayName);
});

ipcMain.handle('import-server', async (event, sourceFolderPath, serverName) => {
  return await serverManager.importServer(sourceFolderPath, serverName);
});

// Batched log buffers per server to reduce IPC volume when multiple servers are running
const serverLogBuffers = new Map(); // serverName -> { stdout: string, stderr: string, timer: NodeJS.Timeout | null }
const LOG_FLUSH_MS = 80;

function flushServerLog(serverName) {
  const buf = serverLogBuffers.get(serverName);
  if (!buf || (!buf.stdout && !buf.stderr) || !mainWindow || mainWindow.isDestroyed()) {
    if (buf) buf.timer = null;
    return;
  }
  if (buf.stdout) {
    mainWindow.webContents.send('server-log', { serverName, type: 'stdout', data: buf.stdout });
    buf.stdout = '';
  }
  if (buf.stderr) {
    mainWindow.webContents.send('server-log', { serverName, type: 'stderr', data: buf.stderr });
    buf.stderr = '';
  }
  buf.timer = null;
}

function pushServerLog(serverName, type, data) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  let buf = serverLogBuffers.get(serverName);
  if (!buf) {
    buf = { stdout: '', stderr: '', timer: null };
    serverLogBuffers.set(serverName, buf);
  }
  if (type === 'stdout') buf.stdout += data;
  else buf.stderr += data;
  if (!buf.timer) {
    buf.timer = setTimeout(() => {
      flushServerLog(serverName);
    }, LOG_FLUSH_MS);
  }
}

ipcMain.handle('start-server', async (event, serverName, ramGB) => {
  const result = await serverManager.startServer(serverName, ramGB);
  
  if (result.success) {
    const process = serverManager.getServerProcess(serverName);
    if (process && mainWindow) {
      process.stdout.removeAllListeners('data');
      process.stderr.removeAllListeners('data');
      serverLogBuffers.delete(serverName);

      process.stdout.on('data', (data) => {
        const str = data.toString();
        serverManager.feedServerOutput(serverName, str);
        pushServerLog(serverName, 'stdout', str);
      });
      process.stderr.on('data', (data) => {
        const str = data.toString();
        serverManager.feedServerOutput(serverName, str);
        pushServerLog(serverName, 'stderr', str);
      });
    }
  }
  
  return result;
});

ipcMain.handle('stop-server', async (event, serverName) => {
  const buf = serverLogBuffers.get(serverName);
  if (buf?.timer) clearTimeout(buf.timer);
  serverLogBuffers.delete(serverName);
  return await serverManager.stopServer(serverName);
});

ipcMain.handle('restart-server', async (event, serverName, ramGB) => {
  return await serverManager.restartServer(serverName, ramGB);
});

ipcMain.handle('kill-server', async (event, serverName) => {
  const buf = serverLogBuffers.get(serverName);
  if (buf?.timer) clearTimeout(buf.timer);
  serverLogBuffers.delete(serverName);
  return await serverManager.killServer(serverName);
});

ipcMain.handle('get-server-logs', async (event, serverName, maxLines) => {
  return await serverManager.getServerLogs(serverName, maxLines);
});

ipcMain.handle('get-player-count', async (event, serverName) => {
  return await serverManager.getPlayerCount(serverName);
});

ipcMain.handle('get-server-files', async (event, serverName, filePath) => {
  return await serverManager.getServerFiles(serverName, filePath);
});

ipcMain.handle('read-server-file', async (event, serverName, filePath) => {
  return await serverManager.readServerFile(serverName, filePath);
});

ipcMain.handle('write-server-file', async (event, serverName, filePath, content) => {
  return await serverManager.writeServerFile(serverName, filePath, content);
});

ipcMain.handle('get-server-config', async (event, serverName) => {
  return await serverManager.getServerConfig(serverName);
});

ipcMain.handle('read-server-file-binary', async (event, serverName, filePath) => {
  return await serverManager.readServerFileBinary(serverName, filePath);
});

ipcMain.handle('write-server-file-binary', async (event, serverName, filePath, contentBase64, wasGzipped) => {
  return await serverManager.writeServerFileBinary(serverName, filePath, contentBase64, wasGzipped === true);
});

ipcMain.handle('read-server-file-nbt', async (event, serverName, filePath) => {
  return await serverManager.readServerFileNbt(serverName, filePath);
});

ipcMain.handle('write-server-file-nbt', async (event, serverName, filePath, parsed, nbtFormat) => {
  return await serverManager.writeServerFileNbt(serverName, filePath, parsed, nbtFormat);
});

ipcMain.handle('list-plugins', async (event, serverName) => {
  return await serverManager.listPlugins(serverName);
});

ipcMain.handle('delete-plugin', async (event, serverName, pluginName) => {
  return await serverManager.deletePlugin(serverName, pluginName);
});

ipcMain.handle('check-jar-supports-plugins', async (event, serverName) => {
  try {
    if (!serverManager.checkJarSupportsPlugins) {
      console.error('checkJarSupportsPlugins function not found in serverManager');
      return { supportsPlugins: false };
    }
    const result = await serverManager.checkJarSupportsPlugins(serverName);
    return typeof result === 'object' && result !== null && 'supportsPlugins' in result ? result : { supportsPlugins: !!result };
  } catch (error) {
    console.error('Error in check-jar-supports-plugins handler:', error);
    return { supportsPlugins: false };
  }
});

// Log handler registration for debugging
  // IPC handler registered: check-jar-supports-plugins

ipcMain.handle('get-modrinth-plugins', async (event, minecraftVersion, limit) => {
  try {
    if (!serverManager.getModrinthPlugins) {
      console.error('getModrinthPlugins function not found in serverManager');
      return [];
    }
    return await serverManager.getModrinthPlugins(minecraftVersion, limit);
  } catch (error) {
    console.error('Error in get-modrinth-plugins handler:', error);
    return [];
  }
});

ipcMain.handle('install-essentialsx-from-github', async (event, serverName) => {
  try {
    return await serverManager.installEssentialsXFromGitHub(serverName);
  } catch (error) {
    console.error('Error in install-essentialsx-from-github handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-modrinth-plugin', async (event, serverName, projectId, minecraftVersion) => {
  try {
    if (!serverManager.installModrinthPlugin) {
      console.error('installModrinthPlugin function not found in serverManager');
      return { success: false, error: 'Function not available' };
    }
    return await serverManager.installModrinthPlugin(serverName, projectId, minecraftVersion);
  } catch (error) {
    console.error('Error in install-modrinth-plugin handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-mods', async (event, serverName) => {
  return await serverManager.listMods(serverName);
});

ipcMain.handle('delete-mod', async (event, serverName, modName) => {
  return await serverManager.deleteMod(serverName, modName);
});

ipcMain.handle('check-jar-supports-mods', async (event, serverName) => {
  try {
    const result = await serverManager.checkJarSupportsMods(serverName);
    return result && typeof result === 'object' ? result : { supportsMods: false };
  } catch (error) {
    return { supportsMods: false };
  }
});

ipcMain.handle('get-modrinth-mods', async (event, minecraftVersion, loader, limit) => {
  try {
    return await serverManager.getModrinthMods(minecraftVersion, loader || 'fabric', limit);
  } catch (error) {
    console.error('Error in get-modrinth-mods handler:', error);
    return [];
  }
});

ipcMain.handle('install-modrinth-mod', async (event, serverName, projectId, minecraftVersion) => {
  try {
    return await serverManager.installModrinthMod(serverName, projectId, minecraftVersion);
  } catch (error) {
    console.error('Error in install-modrinth-mod handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-geyser-floodgate', async (event, serverName, serverPort) => {
  try {
    return await serverManager.installGeyserFloodgate(serverName, serverPort || 25565);
  } catch (error) {
    console.error('Error in install-geyser-floodgate handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-worlds', async (event, serverName) => {
  return await serverManager.listWorlds(serverName);
});

ipcMain.handle('delete-world', async (event, serverName, worldName) => {
  return await serverManager.deleteWorld(serverName, worldName);
});

ipcMain.handle('get-server-properties', async (event, serverName) => {
  return await serverManager.getServerProperties(serverName);
});

ipcMain.handle('update-server-properties', async (event, serverName, properties) => {
  return await serverManager.updateServerProperties(serverName, properties);
});

// Re-establish log streaming for already running servers
ipcMain.handle('setup-log-streaming', async (event, serverName) => {
  const process = serverManager.getServerProcess(serverName);
  if (process && mainWindow && !mainWindow.isDestroyed()) {
    // Remove existing listeners to avoid duplicates
    process.stdout.removeAllListeners('data');
    process.stderr.removeAllListeners('data');
    
    process.stdout.on('data', (data) => {
      const str = data.toString();
      serverManager.feedServerOutput(serverName, str);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-log', {
          serverName,
          type: 'stdout',
          data: str,
        });
      }
    });

    process.stderr.on('data', (data) => {
      const str = data.toString();
      serverManager.feedServerOutput(serverName, str);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-log', {
          serverName,
          type: 'stderr',
          data: str,
        });
      }
    });
    return { success: true };
  }
  return { success: false, error: 'Server not running' };
});

ipcMain.handle('update-server-ram', async (event, serverName, ramGB) => {
  return await serverManager.updateServerRAM(serverName, ramGB);
});

ipcMain.handle('send-server-command', async (event, serverName, command) => {
  const process = serverManager.getServerProcess(serverName);
  if (process) {
    process.stdin.write(command + '\n');
    return { success: true };
  }
  return { success: false, error: 'Server not running' };
});

ipcMain.handle('delete-server', async (event, serverName) => {
  return await serverManager.deleteServer(serverName);
});

ipcMain.handle('get-server-usage', async (event, serverName) => {
  return await serverManager.getServerUsage(serverName);
});

ipcMain.handle('get-all-servers-usage', async () => {
  return await serverManager.getAllServersUsage();
});

ipcMain.handle('get-servers-disk-usage', async () => {
  return await serverManager.getServersDiskUsage();
});

// One-time cleanup: remove old Electron/Chromium files from parent dir (now in _app/)
const CHROMIUM_ENTRIES = ['Cache', 'Code Cache', 'DawnCache', 'GPUCache', 'Local Storage', 'Network', 'Session Storage', 'Shared Dictionary', 'blob_storage', 'Local State', 'Preferences', 'SharedStorage'];
async function cleanupLegacyElectronFolders() {
  try {
    const parentDir = config.NODEXITY_DIR;
    const entries = await fs.promises.readdir(parentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (CHROMIUM_ENTRIES.includes(entry.name)) {
        const fullPath = path.join(parentDir, entry.name);
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

app.whenReady().then(() => {
  // Clean up old Chromium folders from previous layout (runs once, non-blocking)
  cleanupLegacyElectronFolders();

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws://localhost:* http://localhost:*"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  createWindow();
  serverManager.getAppSettings().then((settings) => {
    applyAppSettings(settings);
  }).catch(() => {
    // Ignore settings load errors
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Stop all servers before quitting
let shutdownInProgress = false;

async function stopAllServers() {
  try {
    const servers = await serverManager.listServers();
    const stopPromises = servers
      .filter(server => server.status === 'RUNNING' || server.status === 'STARTING')
      .map(server => serverManager.stopServer(server.id));

    // Stop all servers in parallel and wait for completion
    await Promise.allSettled(stopPromises);
  } catch (error) {
    console.error('Error stopping servers on shutdown:', error);
  }
}

// Handle before-quit event (more reliable than window-all-closed)
app.on('before-quit', async (event) => {
  isQuitting = true;
  if (shutdownInProgress) return;
  shutdownInProgress = true;
  event.preventDefault(); // Prevent immediate quit
  await stopAllServers();
  app.exit(0); // Force exit after stopping servers
});

app.on('window-all-closed', async () => {
  // Stop all servers before quitting
  if (!shutdownInProgress) {
    await stopAllServers();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
