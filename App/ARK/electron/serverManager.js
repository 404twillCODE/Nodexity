/**
 * ARK Server Manager — barrel module.
 * Exposes config, ARK lifecycle, file-ops, and system-info.
 */
const config = require('./modules/config');
const arkLifecycle = require('./modules/ark-lifecycle');
const fileOps = require('./modules/file-ops');
const systemInfo = require('./modules/system-info');

module.exports = {
  ensureDirectories: config.ensureDirectories,
  getAppSettings: config.getAppSettings,
  saveAppSettings: config.saveAppSettings,
  isSetupComplete: config.isSetupComplete,
  completeSetup: config.completeSetup,
  resetSetup: config.resetSetup,
  getServerConfig: config.getServerConfig,
  getNodexityDir: config.getNodexityDir,
  showFolderDialog: config.showFolderDialog,
  isPortAvailable: arkLifecycle.isPortAvailable,
  findAvailablePort: arkLifecycle.findAvailablePort,
  checkJava: arkLifecycle.checkJava,
  createServer: arkLifecycle.createServer,
  startServer: arkLifecycle.startServer,
  stopServer: arkLifecycle.stopServer,
  restartServer: arkLifecycle.restartServer,
  killServer: arkLifecycle.killServer,
  getServerProcess: arkLifecycle.getServerProcess,
  listServers: arkLifecycle.listServers,
  updateServerRAM: arkLifecycle.updateServerRAM,
  getServerLogs: arkLifecycle.getServerLogs,
  getPlayerCount: arkLifecycle.getPlayerCount,
  feedServerOutput: arkLifecycle.feedServerOutput,
  importServer: arkLifecycle.importServer,
  getArkMaps: () => arkLifecycle.ARK_MAPS,
  getServerFiles: fileOps.getServerFiles,
  readServerFile: fileOps.readServerFile,
  readServerFileBinary: fileOps.readServerFileBinary,
  writeServerFile: fileOps.writeServerFile,
  writeServerFileBinary: fileOps.writeServerFileBinary,
  readServerFileNbt: fileOps.readServerFileNbt,
  writeServerFileNbt: fileOps.writeServerFileNbt,
  getServerProperties: fileOps.getServerProperties,
  updateServerProperties: fileOps.updateServerProperties,
  checkJarSupportsPlugins: fileOps.checkJarSupportsPlugins,
  getModrinthPlugins: fileOps.getModrinthPlugins,
  installEssentialsXFromGitHub: fileOps.installEssentialsXFromGitHub,
  installModrinthPlugin: fileOps.installModrinthPlugin,
  listPlugins: fileOps.listPlugins,
  deletePlugin: fileOps.deletePlugin,
  checkJarSupportsMods: fileOps.checkJarSupportsMods,
  getModrinthMods: fileOps.getModrinthMods,
  installModrinthMod: fileOps.installModrinthMod,
  listMods: fileOps.listMods,
  deleteMod: fileOps.deleteMod,
  installGeyserFloodgate: fileOps.installGeyserFloodgate,
  listWorlds: fileOps.listWorlds,
  deleteWorld: fileOps.deleteWorld,
  getSystemInfo: systemInfo.getSystemInfo,
  getServerUsage: systemInfo.getServerUsage,
  getAllServersUsage: systemInfo.getAllServersUsage,
  getServersDiskUsage: systemInfo.getServersDiskUsage,
};

systemInfo.startUsageRefreshLoop();
systemInfo.startAutoBackupLoop();
