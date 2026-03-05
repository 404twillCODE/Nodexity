/**
 * ARK configuration: constants, paths, server config CRUD, app settings, setup.
 * Base directory: AppData/Roaming/.nodexity/ARK (and everything for ARK inside it).
 */
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

function getAppDataPath() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', '.nodexity', 'ARK');
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', '.nodexity', 'ARK');
  } else {
    return path.join(os.homedir(), '.nodexity', 'ARK');
  }
}

const NODEXITY_DIR = getAppDataPath();
const SERVERS_DIR = path.join(NODEXITY_DIR, 'servers');
const BACKUPS_DIR = path.join(NODEXITY_DIR, 'backups');
const CONFIG_FILE = path.join(NODEXITY_DIR, 'servers.json');

const CONFIG_CACHE = { data: null, fileMtime: 0, cachedAt: 0 };
const CONFIG_CACHE_TTL_MS = 1500;

async function ensureDirectories(appSettings = null) {
  await fs.mkdir(NODEXITY_DIR, { recursive: true });

  let serversDirToUse = SERVERS_DIR;
  let backupsDirToUse = BACKUPS_DIR;

  if (appSettings) {
    if (appSettings.serversDirectory) serversDirToUse = appSettings.serversDirectory;
    if (appSettings.backupsDirectory) backupsDirToUse = appSettings.backupsDirectory;
  } else {
    try {
      const configs = await loadServerConfigs();
      const stored = configs._appSettings || {};
      if (stored.serversDirectory) serversDirToUse = stored.serversDirectory;
      if (stored.backupsDirectory) backupsDirToUse = stored.backupsDirectory;
    } catch {
      // ignore
    }
  }

  if (serversDirToUse) await fs.mkdir(serversDirToUse, { recursive: true });
  if (backupsDirToUse) await fs.mkdir(backupsDirToUse, { recursive: true });
}

function normalizeRamGB(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

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

function invalidateConfigCache() {
  CONFIG_CACHE.data = null;
  CONFIG_CACHE.fileMtime = 0;
  CONFIG_CACHE.cachedAt = 0;
}

async function saveServerConfigs(configs) {
  await ensureDirectories(configs?._appSettings || null);
  await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8');
  invalidateConfigCache();
}

async function getServerConfig(serverName) {
  const configs = await loadServerConfigs();
  return configs[serverName] || null;
}

async function saveServerConfig(serverName, config) {
  const configs = await loadServerConfigs();
  const appSettings = configs._appSettings || {};
  const serversDirForPath = appSettings.serversDirectory || SERVERS_DIR;
  configs[serverName] = {
    name: config.displayName || serverName,
    path: config.path || path.join(serversDirForPath, serverName),
    version: config.version || 'ARK',
    ramGB: config.ramGB || 4,
    status: config.status || 'STOPPED',
    port: config.port ?? 7777,
    queryPort: config.queryPort ?? 27015,
    map: config.map || 'TheIsland',
    sessionName: config.sessionName || serverName,
    ...config
  };
  await saveServerConfigs(configs);
}

async function isSetupComplete() {
  try {
    const configs = await loadServerConfigs();
    if (configs._setupComplete === true) return true;
    const hasSettings = !!configs._appSettings;
    const hasServers = Object.keys(configs).some((key) => !key.startsWith('_'));
    if (hasSettings || hasServers) {
      configs._setupComplete = true;
      try { await saveServerConfigs(configs); } catch { }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function getAppSettings() {
  const configs = await loadServerConfigs();
  return configs._appSettings || {
    serversDirectory: SERVERS_DIR,
    backupsDirectory: BACKUPS_DIR,
    arkInstallPath: '',
    steamCmdPath: '',
    sidebarCollapsed: false,
    showBootSequence: true,
    minimizeToTray: false,
    startWithWindows: false,
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 10,
    notifications: { statusChanges: true, crashes: true, updates: true },
    defaultPort: 7777,
    defaultQueryPort: 27015,
    defaultRconPort: 32330,
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
    logLevel: 'info',
    rcon: {
      defaultPassword: '',
      timeout: 10,
    },
    discord: {
      enabled: false,
      token: '',
      allowedUserIds: [],
      serverJoinIp: '',
      serverJoinPort: '',
      serverPassword: '',
    },
    automation: {
      autoPause: false,
      autoShutdown: false,
      autoShutdownMinutes: 10,
      playerCheckInterval: 30,
      statsRefreshInterval: 30,
    },
  };
}

async function getDiscordConfig() {
  const settings = await getAppSettings();
  return settings.discord || {};
}

async function saveDiscordConfig(discordConfig) {
  const settings = await getAppSettings();
  settings.discord = { ...(settings.discord || {}), ...discordConfig };
  return saveAppSettings(settings);
}

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
  if (finalSettings.serversDirectory) await fs.mkdir(finalSettings.serversDirectory, { recursive: true });
  if (finalSettings.backupsDirectory && finalSettings.autoBackup) await fs.mkdir(finalSettings.backupsDirectory, { recursive: true });
  return finalSettings;
}

async function completeSetup(settings = null) {
  if (settings) await saveAppSettings(settings);
  const configs = await loadServerConfigs();
  configs._setupComplete = true;
  await saveServerConfigs(configs);
}

async function resetSetup() {
  const configs = await loadServerConfigs();
  delete configs._setupComplete;
  await saveServerConfigs(configs);
}

function getNodexityDir() {
  return NODEXITY_DIR;
}

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
  getDiscordConfig,
  saveDiscordConfig,
};
