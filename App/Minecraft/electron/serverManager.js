/**
 * Server Manager — barrel module.
 *
 * Re-exports every public function from the focused sub-modules so that
 * main.js (and tests) can continue to `require('./serverManager')` unchanged.
 */

const config = require('./modules/config');
const downloads = require('./modules/downloads');
const serverLifecycle = require('./modules/server-lifecycle');
const fileOps = require('./modules/file-ops');
const systemInfo = require('./modules/system-info');

module.exports = {
  // --- Config & setup ---
  ensureDirectories: config.ensureDirectories,
  getAppSettings: config.getAppSettings,
  saveAppSettings: config.saveAppSettings,
  isSetupComplete: config.isSetupComplete,
  completeSetup: config.completeSetup,
  resetSetup: config.resetSetup,
  getServerConfig: config.getServerConfig,
  getNodexityDir: config.getNodexityDir,
  showFolderDialog: config.showFolderDialog,
  isPortAvailable: serverLifecycle.isPortAvailable,
  findAvailablePort: serverLifecycle.findAvailablePort,

  // --- Downloads & versions ---
  getPaperVersions: downloads.getPaperVersions,
  getLatestPaperVersion: downloads.getLatestPaperVersion,
  getSpigotVersions: downloads.getSpigotVersions,
  getVanillaVersions: downloads.getVanillaVersions,
  getFabricVersions: downloads.getFabricVersions,
  getForgeVersions: downloads.getForgeVersions,
  getVelocityVersions: downloads.getVelocityVersions,
  getVelocityVersionForMC: downloads.getVelocityVersionForMC,
  getWaterfallVersions: downloads.getWaterfallVersions,
  getBungeeCordVersions: downloads.getBungeeCordVersions,
  getPurpurVersions: downloads.getPurpurVersions,

  // --- Server lifecycle ---
  checkJava: serverLifecycle.checkJava,
  createServer: serverLifecycle.createServer,
  startServer: serverLifecycle.startServer,
  stopServer: serverLifecycle.stopServer,
  restartServer: serverLifecycle.restartServer,
  killServer: serverLifecycle.killServer,
  getServerProcess: serverLifecycle.getServerProcess,
  listServers: serverLifecycle.listServers,
  updateServerRAM: serverLifecycle.updateServerRAM,
  deleteServer: serverLifecycle.deleteServer,
  getServerLogs: serverLifecycle.getServerLogs,
  getPlayerCount: serverLifecycle.getPlayerCount,
  feedServerOutput: serverLifecycle.feedServerOutput,
  importServer: serverLifecycle.importServer,

  // --- File operations ---
  getServerFiles: fileOps.getServerFiles,
  readServerFile: fileOps.readServerFile,
  readServerFileBinary: fileOps.readServerFileBinary,
  writeServerFile: fileOps.writeServerFile,
  writeServerFileBinary: fileOps.writeServerFileBinary,
  readServerFileNbt: fileOps.readServerFileNbt,
  writeServerFileNbt: fileOps.writeServerFileNbt,
  getServerProperties: fileOps.getServerProperties,
  updateServerProperties: fileOps.updateServerProperties,

  // --- Plugins ---
  checkJarSupportsPlugins: fileOps.checkJarSupportsPlugins,
  getModrinthPlugins: fileOps.getModrinthPlugins,
  installEssentialsXFromGitHub: fileOps.installEssentialsXFromGitHub,
  installModrinthPlugin: fileOps.installModrinthPlugin,
  listPlugins: fileOps.listPlugins,
  deletePlugin: fileOps.deletePlugin,

  // --- Mods ---
  checkJarSupportsMods: fileOps.checkJarSupportsMods,
  getModrinthMods: fileOps.getModrinthMods,
  installModrinthMod: fileOps.installModrinthMod,
  listMods: fileOps.listMods,
  deleteMod: fileOps.deleteMod,
  installGeyserFloodgate: fileOps.installGeyserFloodgate,

  // --- Worlds ---
  listWorlds: fileOps.listWorlds,
  deleteWorld: fileOps.deleteWorld,

  // --- System info & monitoring ---
  getSystemInfo: systemInfo.getSystemInfo,
  getServerUsage: systemInfo.getServerUsage,
  getAllServersUsage: systemInfo.getAllServersUsage,
  getServersDiskUsage: systemInfo.getServersDiskUsage,
};

// Start background loops
systemInfo.startUsageRefreshLoop();
systemInfo.startAutoBackupLoop();
