/**
 * Configuration management: constants, paths, server config CRUD, app settings, setup.
 */
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Get AppData\Roaming path (like Minecraft)
function getAppDataPath() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', '.nodexity');
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', '.nodexity');
  } else {
    // Linux
    return path.join(os.homedir(), '.nodexity');
  }
}

const NODEXITY_DIR = getAppDataPath();
const SERVERS_DIR = path.join(NODEXITY_DIR, 'servers');
const BACKUPS_DIR = path.join(NODEXITY_DIR, 'backups');
const CONFIG_FILE = path.join(NODEXITY_DIR, 'servers.json');

// In-memory cache for server configs to avoid repeated disk reads (e.g. during listServers polling)
const CONFIG_CACHE = { data: null, fileMtime: 0, cachedAt: 0 };
const CONFIG_CACHE_TTL_MS = 1500;

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(NODEXITY_DIR, { recursive: true });
  await fs.mkdir(SERVERS_DIR, { recursive: true });
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

function normalizeRamGB(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

// Load server configs (with short-lived cache to reduce disk I/O when multiple servers are running)
async function loadServerConfigs() {
  const now = Date.now();
  try {
    const stat = await fs.stat(CONFIG_FILE);
    const mtime = stat.mtimeMs;
    if (CONFIG_CACHE.data !== null && CONFIG_CACHE.fileMtime === mtime && now - CONFIG_CACHE.cachedAt < CONFIG_CACHE_TTL_MS) {
      return CONFIG_CACHE.data;
    }
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(data);
    CONFIG_CACHE.data = parsed;
    CONFIG_CACHE.fileMtime = mtime;
    CONFIG_CACHE.cachedAt = now;
    return parsed;
  } catch (error) {
    return {};
  }
}

// Invalidate config cache (call after any save so next load reads from disk)
function invalidateConfigCache() {
  CONFIG_CACHE.data = null;
  CONFIG_CACHE.fileMtime = 0;
  CONFIG_CACHE.cachedAt = 0;
}

// Save server configs
async function saveServerConfigs(configs) {
  await ensureDirectories();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8');
  invalidateConfigCache();
}

// Get server config
async function getServerConfig(serverName) {
  const configs = await loadServerConfigs();
  return configs[serverName] || null;
}

// Save server config
async function saveServerConfig(serverName, config) {
  const configs = await loadServerConfigs();
  configs[serverName] = {
    name: config.displayName || serverName,
    path: path.join(SERVERS_DIR, serverName),
    version: config.version || 'unknown',
    ramGB: config.ramGB || 4,
    status: config.status || 'STOPPED',
    port: config.port || 25565,
    ...config
  };
  await saveServerConfigs(configs);
}

// Check if setup is complete
async function isSetupComplete() {
  try {
    const configs = await loadServerConfigs();
    if (configs._setupComplete === true) {
      return true;
    }
    const hasSettings = !!configs._appSettings;
    const hasServers = Object.keys(configs).some((key) => !key.startsWith('_'));
    if (hasSettings || hasServers) {
      configs._setupComplete = true;
      try {
        await saveServerConfigs(configs);
      } catch {
        // Ignore persistence errors, still treat as complete
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Get app settings
async function getAppSettings() {
  const configs = await loadServerConfigs();
  return configs._appSettings || {
    serversDirectory: SERVERS_DIR,
    backupsDirectory: BACKUPS_DIR,
    sidebarCollapsed: false,
    showBootSequence: true,
    minimizeToTray: false,
    startWithWindows: false,
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 10,
    notifications: {
      statusChanges: true,
      crashes: true,
      updates: true
    },
    defaultRAM: 4,
    defaultPort: 25565,
    devMode: false,
    consoleAutoScroll: true,
    maxConsoleLines: 1000,
    showTimestamps: true,
    statusRefreshRate: 2,
    reduceAnimations: false,
    autoUpdateCheck: true,
    consoleWordWrap: false,
    consoleFontSize: 12,
    debugLogging: false,
    showPerformanceMetrics: false,
    logLevel: 'info'
  };
}

// Save app settings (merges with existing so partial updates e.g. sidebarCollapsed persist correctly)
async function saveAppSettings(settings) {
  const configs = await loadServerConfigs();
  const existing = configs._appSettings || {};
  const finalSettings = {
    ...existing,
    ...settings,
    serversDirectory: settings.serversDirectory ?? existing.serversDirectory ?? SERVERS_DIR,
    backupsDirectory: settings.backupsDirectory ?? existing.backupsDirectory ?? BACKUPS_DIR
  };
  configs._appSettings = finalSettings;
  await saveServerConfigs(configs);

  if (finalSettings.serversDirectory) {
    await fs.mkdir(finalSettings.serversDirectory, { recursive: true });
  }
  if (finalSettings.backupsDirectory && finalSettings.autoBackup) {
    await fs.mkdir(finalSettings.backupsDirectory, { recursive: true });
  }
  return finalSettings;
}

// Mark setup as complete
async function completeSetup(settings = null) {
  if (settings) {
    await saveAppSettings(settings);
  }
  const configs = await loadServerConfigs();
  configs._setupComplete = true;
  await saveServerConfigs(configs);
}

// Reset setup (for testing/development)
async function resetSetup() {
  const configs = await loadServerConfigs();
  delete configs._setupComplete;
  await saveServerConfigs(configs);
}

// Get Nodexity data directory
function getNodexityDir() {
  return NODEXITY_DIR;
}

// Show folder dialog (placeholder - actual implementation is in main.js via IPC)
async function showFolderDialog() {
  throw new Error('showFolderDialog should be called via IPC, not directly');
}

module.exports = {
  NODEXITY_DIR,
  SERVERS_DIR,
  BACKUPS_DIR,
  CONFIG_FILE,
  ensureDirectories,
  normalizeRamGB,
  loadServerConfigs,
  saveServerConfigs,
  getServerConfig,
  saveServerConfig,
  isSetupComplete,
  getAppSettings,
  saveAppSettings,
  completeSetup,
  resetSetup,
  getNodexityDir,
  showFolderDialog,
};
