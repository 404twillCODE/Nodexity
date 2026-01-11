const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

// Clear module cache and reload serverManager to ensure latest functions are available
delete require.cache[require.resolve('./serverManager')];
const serverManager = require('./serverManager');

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
  });

  mainWindow = win;

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
  return await serverManager.saveAppSettings(settings);
});

ipcMain.handle('complete-setup', async (event, settings) => {
  return await serverManager.completeSetup(settings);
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

ipcMain.handle('create-server', async (event, serverName, serverType, version, ramGB, manualJarPath) => {
  return await serverManager.createServer(serverName, serverType, version, ramGB, manualJarPath);
});

ipcMain.handle('start-server', async (event, serverName, ramGB) => {
  const result = await serverManager.startServer(serverName, ramGB);
  
  if (result.success) {
    // Set up log streaming
    const process = serverManager.getServerProcess(serverName);
    if (process && mainWindow) {
      // Remove existing listeners to avoid duplicates
      process.stdout.removeAllListeners('data');
      process.stderr.removeAllListeners('data');
      
      process.stdout.on('data', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server-log', {
            serverName,
            type: 'stdout',
            data: data.toString(),
          });
        }
      });

      process.stderr.on('data', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server-log', {
            serverName,
            type: 'stderr',
            data: data.toString(),
          });
        }
      });
    }
  }
  
  return result;
});

ipcMain.handle('stop-server', async (event, serverName) => {
  return await serverManager.stopServer(serverName);
});

ipcMain.handle('restart-server', async (event, serverName, ramGB) => {
  return await serverManager.restartServer(serverName, ramGB);
});

ipcMain.handle('kill-server', async (event, serverName) => {
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

ipcMain.handle('list-plugins', async (event, serverName) => {
  return await serverManager.listPlugins(serverName);
});

ipcMain.handle('delete-plugin', async (event, serverName, pluginName) => {
  return await serverManager.deletePlugin(serverName, pluginName);
});

ipcMain.handle('list-worlds', async (event, serverName) => {
  return await serverManager.listWorlds(serverName);
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
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-log', {
          serverName,
          type: 'stdout',
          data: data.toString(),
        });
      }
    });

    process.stderr.on('data', (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-log', {
          serverName,
          type: 'stderr',
          data: data.toString(),
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop all servers before quitting
  const { listServers, stopServer } = serverManager;
  listServers().then(servers => {
    servers.forEach(server => {
      if (server.status === 'RUNNING') {
        stopServer(server.name);
      }
    });
  });
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

