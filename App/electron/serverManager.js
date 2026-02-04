const { spawn, execSync, execFile } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const net = require('net');

// Get AppData\Roaming path (like Minecraft)
function getAppDataPath() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', '.hexnode');
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', '.hexnode');
  } else {
    // Linux
    return path.join(os.homedir(), '.hexnode');
  }
}

const HEXNODE_DIR = getAppDataPath();
const SERVERS_DIR = path.join(HEXNODE_DIR, 'servers');
const BACKUPS_DIR = path.join(HEXNODE_DIR, 'backups');
const CONFIG_FILE = path.join(HEXNODE_DIR, 'servers.json');

// Auto-backup scheduling
let backupTimer = null;
let backupInFlight = false;
const backupLastRun = new Map(); // Map<serverName, timestampMs>

function formatBackupTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('') + '-' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
}

async function getLatestBackupTime(serverName, backupsDir) {
  try {
    const serverBackupDir = path.join(backupsDir, serverName);
    const entries = await fs.readdir(serverBackupDir, { withFileTypes: true });
    const backupDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
      .reverse();

    if (backupDirs.length === 0) return 0;
    const latestName = backupDirs[0];
    const match = latestName.match(/^(\d{8})-(\d{6})$/);
    if (!match) return 0;
    const datePart = match[1];
    const timePart = match[2];
    const iso = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}T${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}`;
    const parsed = Date.parse(iso);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    return 0;
  }
}

async function pruneBackups(serverName, backupsDir, maxBackups) {
  if (!maxBackups || maxBackups <= 0) return;
  try {
    const serverBackupDir = path.join(backupsDir, serverName);
    const entries = await fs.readdir(serverBackupDir, { withFileTypes: true });
    const backupDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
      .reverse();

    const excess = backupDirs.slice(maxBackups);
    for (const dirName of excess) {
      const fullPath = path.join(serverBackupDir, dirName);
      await fs.rm(fullPath, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore prune errors
  }
}

async function runAutoBackups() {
  if (backupInFlight) return;
  backupInFlight = true;
  try {
    const settings = await getAppSettings();
    if (!settings.autoBackup) return;

    const backupsDir = settings.backupsDirectory || BACKUPS_DIR;
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const intervalHours = Math.max(1, Number(settings.backupInterval || 24));
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const maxBackups = Math.max(1, Number(settings.maxBackups || 10));

    await fs.mkdir(backupsDir, { recursive: true });

    const servers = await listServers();
    const now = Date.now();

    for (const server of servers) {
      const lastRun = backupLastRun.get(server.name) || await getLatestBackupTime(server.name, backupsDir);
      if (now - lastRun < intervalMs) continue;

      const serverPath = path.join(serversDir, server.name);
      const serverBackupDir = path.join(backupsDir, server.name);
      const timestamp = formatBackupTimestamp(new Date());
      const targetDir = path.join(serverBackupDir, timestamp);

      await fs.mkdir(serverBackupDir, { recursive: true });
      await fs.cp(serverPath, targetDir, { recursive: true });
      backupLastRun.set(server.name, now);

      await pruneBackups(server.name, backupsDir, maxBackups);
    }
  } catch (error) {
    // Ignore auto-backup errors
  } finally {
    backupInFlight = false;
  }
}

function startAutoBackupLoop() {
  if (backupTimer) return;
  backupTimer = setInterval(() => {
    runAutoBackups();
  }, 5 * 60 * 1000); // check every 5 minutes
  runAutoBackups();
}

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(HEXNODE_DIR, { recursive: true });
  await fs.mkdir(SERVERS_DIR, { recursive: true });
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      resolve(false);
      return;
    }
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
    tester.unref();
  });
}

async function findAvailablePort(startPort, maxAttempts = 50) {
  let port = Number(startPort);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    port = 25565;
  }
  const configs = await loadServerConfigs();
  const usedPorts = new Set(
    Object.values(configs)
      .map((config) => Number(config?.port))
      .filter((value) => Number.isInteger(value))
  );
  for (let i = 0; i < maxAttempts; i += 1) {
    const currentPort = port + i;
    if (currentPort > 65535) break;
    // eslint-disable-next-line no-await-in-loop
    const available = await isPortAvailable(currentPort);
    if (available && !usedPorts.has(currentPort)) return currentPort;
  }
  return null;
}

function normalizeRamGB(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

// Get system information
const systemInfoCache = { timestamp: 0, value: null };
let systemInfoPending = null;

function execFilePromise(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout) => {
      if (error) return reject(error);
      resolve(stdout);
    });
  });
}

async function getSystemInfo() {
  const now = Date.now();
  if (systemInfoCache.value && now - systemInfoCache.timestamp < 15000) {
    return systemInfoCache.value;
  }
  if (systemInfoPending) {
    return await systemInfoPending;
  }

  systemInfoPending = (async () => {
  try {
    const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    const freeMemoryGB = Math.round(os.freemem() / (1024 * 1024 * 1024));
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuCores = cpus.length;
    
    // Get disk space from all drives - return as array
    const drives = [];
    
    try {
      if (os.platform() === 'win32') {
        try {
          const result = await execFilePromise('powershell', ['-NoProfile', '-Command', "Get-WmiObject -Class Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,Size,FreeSpace | ConvertTo-Json"], {
            timeout: 10000,
            windowsHide: true
          });
          const parsed = result.trim();
          if (parsed) {
            try {
              const disks = JSON.parse(parsed);
              const diskArray = Array.isArray(disks) ? disks : [disks];
              diskArray.forEach(disk => {
                if (disk && disk.Size && disk.FreeSpace !== undefined && disk.DeviceID) {
                  drives.push({
                    letter: disk.DeviceID,
                    label: disk.VolumeName || disk.DeviceID,
                    totalGB: Math.round(disk.Size / (1024 * 1024 * 1024)),
                    freeGB: Math.round(disk.FreeSpace / (1024 * 1024 * 1024)),
                    usedGB: Math.round((disk.Size - disk.FreeSpace) / (1024 * 1024 * 1024))
                  });
                }
              });
            } catch (parseErr) {
              // Silently handle JSON parse errors
            }
          }
        } catch (err) {
          try {
            const result = await execFilePromise('powershell', ['-NoProfile', '-Command', "Get-CimInstance -ClassName Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,Size,FreeSpace | ConvertTo-Json"], {
              timeout: 10000,
              windowsHide: true
            });
            const parsed = result.trim();
            if (parsed) {
              try {
                const disks = JSON.parse(parsed);
                const diskArray = Array.isArray(disks) ? disks : [disks];
                diskArray.forEach(disk => {
                  if (disk && disk.Size && disk.FreeSpace !== undefined && disk.DeviceID) {
                    drives.push({
                      letter: disk.DeviceID,
                      label: disk.VolumeName || disk.DeviceID,
                      totalGB: Math.round(disk.Size / (1024 * 1024 * 1024)),
                      freeGB: Math.round(disk.FreeSpace / (1024 * 1024 * 1024)),
                      usedGB: Math.round((disk.Size - disk.FreeSpace) / (1024 * 1024 * 1024))
                    });
                  }
                });
              } catch (parseErr) {
                // Silently handle JSON parse errors
              }
            }
          } catch (err2) {
            // Silently fail - no drives will be shown
          }
        }
      } else if (process.platform === 'darwin') {
        try {
          const result = await execFilePromise('df', ['-g'], { timeout: 10000 });
          const lines = result.trim().split('\n').slice(1);
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
              const mountPoint = parts[0];
              const total = parseInt(parts[1]);
              const free = parseInt(parts[2]);
              if (total > 0 && free >= 0) {
                drives.push({
                  letter: mountPoint,
                  label: mountPoint.split('/').pop() || mountPoint,
                  totalGB: total,
                  freeGB: free,
                  usedGB: total - free
                });
              }
            }
          });
        } catch (err) {
          // Silently fail - no drives will be shown
        }
      } else {
        try {
          const result = await execFilePromise('df', ['-BG'], { timeout: 10000 });
          const lines = result.trim().split('\n').slice(1);
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
              const mountPoint = parts[0];
              const total = parseInt(parts[1]) || 0;
              const free = parseInt(parts[2]) || 0;
              if (total > 0 && free >= 0) {
                drives.push({
                  letter: mountPoint,
                  label: mountPoint.split('/').pop() || mountPoint,
                  totalGB: total,
                  freeGB: free,
                  usedGB: total - free
                });
              }
            }
          });
        } catch (err) {
          // Silently fail - no drives will be shown
        }
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }

    const payload = {
      cpu: {
        model: cpuModel,
        cores: cpuCores,
        threads: cpuCores
      },
      memory: {
        totalGB: totalMemoryGB,
        freeGB: freeMemoryGB,
        usedGB: totalMemoryGB - freeMemoryGB
      },
      drives: drives,
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname()
    };
    systemInfoCache.value = payload;
    systemInfoCache.timestamp = Date.now();
    return payload;
  } catch (error) {
    const payload = {
      cpu: { model: 'Unknown', cores: 0, threads: 0 },
      memory: { totalGB: 0, freeGB: 0, usedGB: 0 },
      storage: { totalGB: 0, freeGB: 0, usedGB: 0 },
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname()
    };
    systemInfoCache.value = payload;
    systemInfoCache.timestamp = Date.now();
    return payload;
  }
  })();

  try {
    return await systemInfoPending;
  } finally {
    systemInfoPending = null;
  }
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
    showBootSequence: true,
    minimizeToTray: false,
    startWithWindows: false,
    autoBackup: true,
    backupInterval: 24, // hours
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

// Save app settings
async function saveAppSettings(settings) {
  const configs = await loadServerConfigs();
  // Use defaults if paths are not provided
  const finalSettings = {
    ...settings,
    serversDirectory: settings.serversDirectory || SERVERS_DIR,
    backupsDirectory: settings.backupsDirectory || BACKUPS_DIR
  };
  configs._appSettings = finalSettings;
  await saveServerConfigs(configs);
  
  // Ensure the directories exist
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
  const configs = await loadServerConfigs();
  configs._setupComplete = true;
  if (settings) {
    configs._appSettings = settings;
  }
  await saveServerConfigs(configs);
}

// Reset setup (for testing/development)
async function resetSetup() {
  const configs = await loadServerConfigs();
  delete configs._setupComplete;
  await saveServerConfigs(configs);
}

// Java detection
async function checkJava() {
  return new Promise((resolve) => {
    const javaProcess = spawn('java', ['-version']);
    let output = '';
    let errorOutput = '';

    javaProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    javaProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    javaProcess.on('close', (code) => {
      const fullOutput = output + errorOutput;
      if (code === 0 || fullOutput.includes('version')) {
        // Parse version from output
        const versionMatch = fullOutput.match(/version\s+"?(\d+\.\d+\.\d+)/i);
        const version = versionMatch ? versionMatch[1] : 'unknown';
        resolve({ installed: true, version });
      } else {
        resolve({ installed: false, version: null });
      }
    });

    javaProcess.on('error', () => {
      resolve({ installed: false, version: null });
    });
  });
}

// Get all Paper versions
async function getPaperVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.papermc.io/v2/projects/paper';
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Reverse to show newest first
          resolve((json.versions || []).reverse());
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get latest Paper version
async function getLatestPaperVersion() {
  const versions = await getPaperVersions();
  return versions[0]; // Now newest first
}

// Get latest Paper build for a version
async function getLatestPaperBuild(version) {
  return new Promise((resolve, reject) => {
    const url = `https://api.papermc.io/v2/projects/paper/versions/${version}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const latestBuild = json.builds[json.builds.length - 1];
          resolve(latestBuild);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Generic download function
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filepath);
    
    const makeRequest = (requestUrl) => {
      const request = https.get(requestUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          makeRequest(response.headers.location);
        } else if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filepath);
          });
        } else {
          file.close();
          if (require('fs').existsSync(filepath)) {
            require('fs').unlinkSync(filepath);
          }
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        }
      });
      
      request.on('error', (error) => {
        file.close();
        if (require('fs').existsSync(filepath)) {
          require('fs').unlinkSync(filepath);
        }
        reject(error);
      });
      
      request.setTimeout(60000, () => {
        request.destroy();
        file.close();
        if (require('fs').existsSync(filepath)) {
          require('fs').unlinkSync(filepath);
        }
        reject(new Error('Download timeout'));
      });
    };
    
    makeRequest(url);
  });
}

// Download Paper server jar
async function downloadPaper(serverPath, version, build) {
  const filename = `paper-${version}-${build}.jar`;
  const filepath = path.join(serverPath, filename);
  const url = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${build}/downloads/${filename}`;
  return await downloadFile(url, filepath);
}

// Get Spigot versions (from BuildTools)
async function getSpigotVersions() {
  // Spigot doesn't have a public API, so we return common versions
  // Ordered from newest to oldest
  return [
    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21', 
    '1.20.6', '1.20.5', '1.20.4', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.17',
    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
    '1.15.2', '1.15.1', '1.15',
    '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
    '1.13.2', '1.13.1', '1.13',
    '1.12.2', '1.12.1', '1.12',
    '1.11.2', '1.11.1', '1.11',
    '1.10.2', '1.10.1', '1.10',
    '1.9.4', '1.9.2', '1.9',
    '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.3', '1.8'
  ];
}

// Download Spigot
// Note: Spigot requires BuildTools to compile, but we can try alternative sources
async function downloadSpigot(serverPath, version) {
  const filename = `spigot-${version}.jar`;
  const filepath = path.join(serverPath, filename);
  
  // Try multiple sources
  const urls = [
    `https://download.getbukkit.org/spigot/spigot-${version}.jar`,
    `https://cdn.getbukkit.org/spigot/spigot-${version}.jar`
  ];
  
  for (const url of urls) {
    try {
      await downloadFile(url, filepath);
      return filepath;
    } catch (error) {
      // Try next URL
      if (await fs.access(filepath).then(() => true).catch(() => false)) {
        await fs.unlink(filepath).catch(() => {});
      }
      continue;
    }
  }
  
  // Check if this is a newer version that requires BuildTools
  const versionParts = version.split('.').map(Number);
  const needsBuildTools = versionParts[0] > 1 || (versionParts[0] === 1 && versionParts[1] >= 17);
  
  if (needsBuildTools) {
    throw new Error(`Spigot ${version} requires BuildTools to compile. Download BuildTools from https://www.spigotmc.org/wiki/buildtools/ or use Paper instead (Spigot-compatible).`);
  }
  
  // If all URLs fail for older versions
  throw new Error(`Failed to download Spigot ${version} from available sources. Consider using Paper instead (it's Spigot-compatible), or download BuildTools from https://www.spigotmc.org/wiki/buildtools/`);
}

// Get Vanilla versions
async function getVanillaVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const versions = json.versions
            .filter(v => v.type === 'release')
            .map(v => v.id);
          // Already in order (newest first), but ensure it's correct
          resolve(versions);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Download Vanilla
async function downloadVanilla(serverPath, version) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get version manifest
      const manifestUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
      https.get(manifestUrl, async (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            const manifest = JSON.parse(data);
            const versionInfo = manifest.versions.find(v => v.id === version);
            if (!versionInfo) {
              reject(new Error(`Version ${version} not found`));
              return;
            }
            
            // Get version details
            https.get(versionInfo.url, (res2) => {
              let versionData = '';
              res2.on('data', (chunk) => { versionData += chunk; });
              res2.on('end', () => {
                try {
                  const versionJson = JSON.parse(versionData);
                  const serverUrl = versionJson.downloads.server.url;
                  const filename = `server-${version}.jar`;
                  const filepath = path.join(serverPath, filename);
                  downloadFile(serverUrl, filepath).then(resolve).catch(reject);
                } catch (e) {
                  reject(e);
                }
              });
            }).on('error', reject);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Get Fabric versions
async function getFabricVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://meta.fabricmc.net/v2/versions/game';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const versions = json
            .filter(v => v.stable)
            .map(v => v.version);
          // Already newest first from API, but ensure it's correct
          resolve(versions);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Download Fabric installer and server
async function downloadFabric(serverPath, version) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get latest installer
      https.get('https://meta.fabricmc.net/v2/versions/installer', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            const installers = JSON.parse(data);
            const installer = installers[0];
            const installerUrl = installer.url;
            
            // Download installer
            const installerPath = path.join(serverPath, 'fabric-installer.jar');
            await downloadFile(installerUrl, installerPath);
            
            // Get loader version
            https.get('https://meta.fabricmc.net/v2/versions/loader', (res2) => {
              let loaderData = '';
              res2.on('data', (chunk) => { loaderData += chunk; });
              res2.on('end', async () => {
                try {
                  const loaders = JSON.parse(loaderData);
                  const loader = loaders[0];
                  
                  // Use installer to generate server jar
                  // For now, we'll use a direct download approach
                  const serverJar = `fabric-server-mc.${version}-loader.${loader.version}-launcher.${installer.version}.jar`;
                  const serverPath_final = path.join(serverPath, serverJar);
                  
                  // Fabric doesn't provide direct server downloads, so we'll need to use the installer
                  // For simplicity, we'll create a script that runs the installer
                  const script = `java -jar fabric-installer.jar server -mcversion ${version} -loader ${loader.version} -downloadMinecraft`;
                  const scriptPath = path.join(serverPath, 'install-fabric.bat');
                  await fs.writeFile(scriptPath, script);
                  
                  resolve(serverPath_final);
                } catch (e) {
                  reject(e);
                }
              });
            }).on('error', reject);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Get Forge versions
async function getForgeVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Get all version keys and sort them (newest first)
          const versions = Object.keys(json).sort((a, b) => {
            // Parse version numbers for proper sorting
            const aParts = a.split('.').map(Number);
            const bParts = b.split('.').map(Number);
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
              const aVal = aParts[i] || 0;
              const bVal = bParts[i] || 0;
              if (bVal !== aVal) {
                return bVal - aVal; // Descending order (newest first)
              }
            }
            return 0;
          });
          resolve(versions);
        } catch (e) {
          // Fallback to common versions (newest first)
          resolve(['1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.17.1', '1.16.5']);
        }
      });
    }).on('error', () => {
      // Fallback (newest first)
      resolve(['1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.17.1', '1.16.5']);
    });
  });
}

// Download Forge
async function downloadForge(serverPath, version) {
  return new Promise(async (resolve, reject) => {
    try {
      // Forge uses Maven repository structure
      // Format: https://maven.minecraftforge.net/net/minecraftforge/forge/{version}/forge-{version}-installer.jar
      // But we need the server jar, not installer
      // For server, we need: forge-{version}-server.jar
      
      // Parse version to get Forge version format (e.g., 1.21.1 -> 1.21.1-47.2.0)
      // We'll need to fetch the metadata to get the actual Forge version
      const metadataUrl = `https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json`;
      
      https.get(metadataUrl, async (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            const forgeVersions = json[version];
            if (!forgeVersions || !forgeVersions.length) {
              reject(new Error(`Forge version not found for Minecraft ${version}. Please use the Forge installer manually.`));
              return;
            }
            
            // Get the latest Forge version for this MC version
            const forgeVersion = forgeVersions[forgeVersions.length - 1];
            const filename = `forge-${version}-${forgeVersion}-server.jar`;
            const filepath = path.join(serverPath, filename);
            
            // Try to download from Maven
            const mavenUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}-${forgeVersion}/${filename}`;
            
            try {
              await downloadFile(mavenUrl, filepath);
              resolve(filepath);
            } catch (error) {
              // If direct download fails, suggest manual installation
              reject(new Error(`Failed to download Forge ${version}. Please download the installer from https://files.minecraftforge.net/ and run it manually.`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Forge metadata. Please use the Forge installer manually from https://files.minecraftforge.net/`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Failed to fetch Forge metadata. Please use the Forge installer manually from https://files.minecraftforge.net/`));
      });
    } catch (error) {
      reject(new Error(`Forge installation requires manual setup. Please download from https://files.minecraftforge.net/ and use the installer.`));
    }
  });
}

// Map Velocity version numbers to Minecraft versions they support
// Velocity uses its own versioning (3.4.0, 3.3.0, etc.) but supports specific MC versions
function mapVelocityToMinecraft(velocityVersion) {
  const majorMinor = velocityVersion.split('.').slice(0, 2).join('.');
  const versionMap = {
    '3.4': '1.21',  // Velocity 3.4.x supports MC 1.21.x
    '3.3': '1.20',  // Velocity 3.3.x supports MC 1.20.x
    '3.2': '1.19',  // Velocity 3.2.x supports MC 1.19.x
    '3.1': '1.18',  // Velocity 3.1.x supports MC 1.18.x
    '3.0': '1.17',  // Velocity 3.0.x supports MC 1.17.x
    '2.0': '1.16',  // Velocity 2.0.x supports MC 1.16.x
    '1.1': '1.15',  // Velocity 1.1.x supports MC 1.15.x
    '1.0': '1.14',  // Velocity 1.0.x supports MC 1.14.x
  };
  return versionMap[majorMinor] || '1.21'; // Default to latest if unknown
}

// Get Velocity versions (proxy) - returns Minecraft versions
async function getVelocityVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.papermc.io/v2/projects/velocity';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const velocityVersions = (json.versions || []).reverse(); // Newest first
          
          // Map Velocity versions to Minecraft versions and get unique MC versions
          const mcVersionMap = new Map();
          velocityVersions.forEach(vVersion => {
            const mcVersion = mapVelocityToMinecraft(vVersion);
            // Store the latest Velocity version for each MC version
            if (!mcVersionMap.has(mcVersion) || velocityVersions.indexOf(vVersion) < velocityVersions.indexOf(mcVersionMap.get(mcVersion))) {
              mcVersionMap.set(mcVersion, vVersion);
            }
          });
          
          // Return Minecraft versions sorted newest first
          const mcVersions = Array.from(mcVersionMap.keys()).sort((a, b) => {
            const aParts = a.split('.').map(Number);
            const bParts = b.split('.').map(Number);
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
              const aVal = aParts[i] || 0;
              const bVal = bParts[i] || 0;
              if (bVal !== aVal) return bVal - aVal;
            }
            return 0;
          });
          
          resolve(mcVersions);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get Velocity version number from Minecraft version
async function getVelocityVersionForMC(mcVersion) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.papermc.io/v2/projects/velocity';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const velocityVersions = (json.versions || []).reverse();
          
          // Find the latest Velocity version that supports this MC version
          for (const vVersion of velocityVersions) {
            const supportedMC = mapVelocityToMinecraft(vVersion);
            if (supportedMC === mcVersion) {
              resolve(vVersion);
              return;
            }
          }
          
          // Reject if no compatible Velocity version found for this MC version
          reject(new Error(`No compatible Velocity version found for Minecraft ${mcVersion}. Please select a supported Minecraft version.`));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get Velocity build
async function getVelocityBuild(version) {
  return new Promise((resolve, reject) => {
    const url = `https://api.papermc.io/v2/projects/velocity/versions/${version}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.builds[json.builds.length - 1]);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get Purpur versions (Paper fork with better performance)
async function getPurpurVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.purpurmc.org/v2/purpur';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Reverse to show newest first
          resolve((json.versions || []).reverse());
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get latest Purpur build for a version
async function getPurpurBuild(version) {
  return new Promise((resolve, reject) => {
    const url = `https://api.purpurmc.org/v2/purpur/${version}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.builds.latest);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Download Purpur
async function downloadPurpur(serverPath, version, build) {
  const filename = `purpur-${version}-${build}.jar`;
  const filepath = path.join(serverPath, filename);
  const url = `https://api.purpurmc.org/v2/purpur/${version}/${build}/download`;
  return await downloadFile(url, filepath);
}

// Download Velocity
async function downloadVelocity(serverPath, version, build) {
  const filename = `velocity-${version}-${build}.jar`;
  const filepath = path.join(serverPath, filename);
  const url = `https://api.papermc.io/v2/projects/velocity/versions/${version}/builds/${build}/downloads/${filename}`;
  return await downloadFile(url, filepath);
}

// Get Waterfall versions (proxy)
async function getWaterfallVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.papermc.io/v2/projects/waterfall';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Reverse to show newest first (versions are already Minecraft versions)
          const versions = (json.versions || []).reverse();
          resolve(versions);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get Waterfall build
async function getWaterfallBuild(version) {
  return new Promise((resolve, reject) => {
    const url = `https://api.papermc.io/v2/projects/waterfall/versions/${version}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.builds[json.builds.length - 1]);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Download Waterfall
async function downloadWaterfall(serverPath, version, build) {
  const filename = `waterfall-${version}-${build}.jar`;
  const filepath = path.join(serverPath, filename);
  const url = `https://api.papermc.io/v2/projects/waterfall/versions/${version}/builds/${build}/downloads/${filename}`;
  return await downloadFile(url, filepath);
}

// Get BungeeCord versions (proxy)
// BungeeCord doesn't have clear version mapping, so we map to Minecraft versions
async function getBungeeCordVersions() {
  // Map common BungeeCord builds to Minecraft versions they support
  // Newest first
  return [
    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
    '1.20.6', '1.20.5', '1.20.4', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.17',
    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
    '1.15.2', '1.15.1', '1.15',
    '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
    '1.13.2', '1.13.1', '1.13',
    '1.12.2', '1.12.1', '1.12',
    '1.11.2', '1.11.1', '1.11',
    '1.10.2', '1.10.1', '1.10',
    '1.9.4', '1.9.2', '1.9',
    '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.3', '1.8'
  ];
}

// Download BungeeCord
// Note: BungeeCord uses build numbers, but we're accepting Minecraft versions
// Map Minecraft versions to approximate BungeeCord build numbers
function getBungeeCordBuildForVersion(version) {
  // Map of Minecraft versions to known BungeeCord build numbers
  // These are approximate mappings based on when builds were released
  const versionToBuild = {
    // 1.21.x series
    '1.21.4': '1770', '1.21.3': '1770', '1.21.2': '1770', '1.21.1': '1770', '1.21': '1770',
    // 1.20.x series
    '1.20.6': '1770', '1.20.5': '1770', '1.20.4': '1770', '1.20.2': '1770', '1.20.1': '1770', '1.20': '1770',
    // 1.19.x series
    '1.19.4': '1770', '1.19.3': '1770', '1.19.2': '1770', '1.19.1': '1770', '1.19': '1770',
    // 1.18.x series
    '1.18.2': '1770', '1.18.1': '1770', '1.18': '1770',
    // 1.17.x series
    '1.17.1': '1770', '1.17': '1770',
    // 1.16.x series
    '1.16.5': '1770', '1.16.4': '1770', '1.16.3': '1770', '1.16.2': '1770', '1.16.1': '1770', '1.16': '1770',
    // Older versions - use older builds
    '1.15.2': '1700', '1.15.1': '1700', '1.15': '1700',
    '1.14.4': '1600', '1.14.3': '1600', '1.14.2': '1600', '1.14.1': '1600', '1.14': '1600',
    '1.13.2': '1500', '1.13.1': '1500', '1.13': '1500',
    '1.12.2': '1400', '1.12.1': '1400', '1.12': '1400',
    '1.11.2': '1300', '1.11.1': '1300', '1.11': '1300',
    '1.10.2': '1200', '1.10.1': '1200', '1.10': '1200',
    '1.9.4': '1100', '1.9.2': '1100', '1.9': '1100',
    '1.8.9': '1000', '1.8.8': '1000', '1.8.7': '1000', '1.8.6': '1000', '1.8.5': '1000', '1.8.4': '1000', '1.8.3': '1000', '1.8': '1000'
  };
  
  // Return mapped build number or default to latest (1770)
  return versionToBuild[version] || '1770';
}

async function downloadBungeeCord(serverPath, version) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get build number based on version
      const buildNumber = getBungeeCordBuildForVersion(version);
      
      // Try to get all GitHub releases to find one matching the version/build
      const allReleasesUrl = 'https://api.github.com/repos/SpigotMC/BungeeCord/releases';
      https.get(allReleasesUrl, {
        headers: { 'User-Agent': 'HexNode' }
      }, async (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            const releases = JSON.parse(data);
            // Try to find a release that might match (check tag names for build numbers)
            let matchingRelease = null;
            if (Array.isArray(releases) && releases.length > 0) {
              // Look for releases with build numbers in tag name
              matchingRelease = releases.find(release => {
                const tag = release.tag_name || '';
                // Check if tag contains the build number
                return tag.includes(buildNumber) || tag.includes(version);
              });
              // If no specific match, use latest
              if (!matchingRelease && releases.length > 0) {
                matchingRelease = releases[0];
              }
            }
            
            if (matchingRelease && matchingRelease.assets && matchingRelease.assets.length > 0) {
              const jarAsset = matchingRelease.assets.find(asset => asset.name.endsWith('.jar') && !asset.name.includes('sources'));
              if (jarAsset) {
                const filename = jarAsset.name;
                const filepath = path.join(serverPath, filename);
                try {
                  await downloadFile(jarAsset.browser_download_url, filepath);
                  resolve(filepath);
                  return;
                } catch (error) {
                  // Fall through to CI server
                }
              }
            }
          } catch (e) {
            // Fall through to CI server
          }
          
          // Fallback to CI server with version-specific build
          const filename = `BungeeCord-${buildNumber}.jar`;
          const filepath = path.join(serverPath, filename);
          const ciUrl = `https://ci.md-5.net/job/BungeeCord/${buildNumber}/artifact/bootstrap/target/${filename}`;
          
          try {
            await downloadFile(ciUrl, filepath);
            resolve(filepath);
          } catch (error) {
            // Try alternative CI URL format
            const altUrl = `https://ci.md-5.net/job/BungeeCord/${buildNumber}/artifact/bootstrap/target/BungeeCord.jar`;
            try {
              await downloadFile(altUrl, filepath);
              resolve(filepath);
            } catch (altError) {
              // Final fallback to latest build if version-specific fails
              if (buildNumber !== '1770') {
                const latestFilename = `BungeeCord-1770.jar`;
                const latestFilepath = path.join(serverPath, latestFilename);
                const latestCiUrl = `https://ci.md-5.net/job/BungeeCord/1770/artifact/bootstrap/target/${latestFilename}`;
                try {
                  await downloadFile(latestCiUrl, latestFilepath);
                  resolve(latestFilepath);
                } catch (latestError) {
                  reject(new Error(`Failed to download BungeeCord ${version} (build ${buildNumber}). Please download manually from https://www.spigotmc.org/wiki/bungeecord/`));
                }
              } else {
                reject(new Error(`Failed to download BungeeCord ${version}. Please download manually from https://www.spigotmc.org/wiki/bungeecord/`));
              }
            }
          }
        });
      }).on('error', async () => {
        // Fallback to CI server with version-specific build
        const buildNumber = getBungeeCordBuildForVersion(version);
        const filename = `BungeeCord-${buildNumber}.jar`;
        const filepath = path.join(serverPath, filename);
        const ciUrl = `https://ci.md-5.net/job/BungeeCord/${buildNumber}/artifact/bootstrap/target/${filename}`;
        
        try {
          await downloadFile(ciUrl, filepath);
          resolve(filepath);
        } catch (error) {
          // Final fallback to latest build if version-specific fails
          if (buildNumber !== '1770') {
            const latestFilename = `BungeeCord-1770.jar`;
            const latestFilepath = path.join(serverPath, latestFilename);
            const latestCiUrl = `https://ci.md-5.net/job/BungeeCord/1770/artifact/bootstrap/target/${latestFilename}`;
            try {
              await downloadFile(latestCiUrl, latestFilepath);
              resolve(latestFilepath);
            } catch (latestError) {
              reject(new Error(`Failed to download BungeeCord ${version} (build ${buildNumber}). Please download manually from https://www.spigotmc.org/wiki/bungeecord/`));
            }
          } else {
            reject(new Error(`Failed to download BungeeCord ${version}. Please download manually from https://www.spigotmc.org/wiki/bungeecord/`));
          }
        }
      });
    } catch (error) {
      reject(new Error(`Failed to download BungeeCord ${version}: ${error.message}. Please download manually from https://www.spigotmc.org/wiki/bungeecord/`));
    }
  });
}

// Load server configs
async function loadServerConfigs() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Save server configs
async function saveServerConfigs(configs) {
  await ensureDirectories();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8');
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
    name: config.displayName || serverName, // Use display name if provided, otherwise use serverName
    path: path.join(SERVERS_DIR, serverName),
    version: config.version || 'unknown',
    ramGB: config.ramGB || 4,
    status: config.status || 'STOPPED',
    port: config.port || 25565,
    ...config
  };
  await saveServerConfigs(configs);
}

// Create server
async function createServer(serverName = 'default', serverType = 'paper', version = null, ramGB = null, port = null, manualJarPath = null, displayName = null) {
  try {
    await ensureDirectories();
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    await fs.mkdir(serverPath, { recursive: true });

    // Check if server already exists
    const existingConfig = await getServerConfig(serverName);
    if (existingConfig) {
      const files = await fs.readdir(serverPath);
      const jarFile = files.find(f => f.endsWith('.jar'));
      if (jarFile) {
        return { success: true, path: serverPath, jarFile, message: 'Server already exists' };
      }
    }

    let jarPath, jarFile, selectedVersion, build;

    // Handle manual jar file
    if (serverType === 'manual' && manualJarPath) {
      jarFile = path.basename(manualJarPath);
      jarPath = path.join(serverPath, jarFile);
      // Copy the jar file to server directory
      await fs.copyFile(manualJarPath, jarPath);
      selectedVersion = 'manual';
    } else {
      // Download based on server type
      switch (serverType) {
        case 'paper':
          selectedVersion = version || await getLatestPaperVersion();
          build = await getLatestPaperBuild(selectedVersion);
          jarPath = await downloadPaper(serverPath, selectedVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        case 'spigot':
          selectedVersion = version || '1.20.4';
          jarPath = await downloadSpigot(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'vanilla':
          selectedVersion = version || (await getVanillaVersions())[0];
          jarPath = await downloadVanilla(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'fabric':
          selectedVersion = version || (await getFabricVersions())[0];
          jarPath = await downloadFabric(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'forge':
          selectedVersion = version || (await getForgeVersions())[0];
          jarPath = await downloadForge(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'velocity':
          const velocityVersions = await getVelocityVersions();
          const mcVersion = version || velocityVersions[0];
          // Convert Minecraft version to Velocity version number
          const velocityVersion = await getVelocityVersionForMC(mcVersion);
          selectedVersion = mcVersion; // Store MC version for display
          build = await getVelocityBuild(velocityVersion);
          jarPath = await downloadVelocity(serverPath, velocityVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        case 'waterfall':
          const waterfallVersions = await getWaterfallVersions();
          selectedVersion = version || waterfallVersions[0];
          build = await getWaterfallBuild(selectedVersion);
          jarPath = await downloadWaterfall(serverPath, selectedVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        case 'bungeecord':
          const bungeeVersions = await getBungeeCordVersions();
          selectedVersion = version || bungeeVersions[0];
          jarPath = await downloadBungeeCord(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'purpur':
          const purpurVersions = await getPurpurVersions();
          selectedVersion = version || purpurVersions[0];
          build = await getPurpurBuild(selectedVersion);
          jarPath = await downloadPurpur(serverPath, selectedVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        default:
          throw new Error(`Unsupported server type: ${serverType}`);
      }
    }

    const serverRAM = normalizeRamGB(ramGB, settings.defaultRAM || 4);
    const parsedPort = Number.isFinite(port) ? Number(port) : null;
    const serverPort = parsedPort && parsedPort >= 1024 && parsedPort <= 65535
      ? parsedPort
      : (settings.defaultPort || 25565);

    // Create eula.txt (not needed for proxy servers)
    if (!['velocity', 'waterfall', 'bungeecord'].includes(serverType)) {
      const eulaPath = path.join(serverPath, 'eula.txt');
      await fs.writeFile(eulaPath, 'eula=true\n', 'utf8');
    }

    // Set server port early so first boot uses the correct port
    if (!['velocity', 'waterfall', 'bungeecord'].includes(serverType)) {
      const propertiesPath = path.join(serverPath, 'server.properties');
      try {
        let contents = '';
        try {
          contents = await fs.readFile(propertiesPath, 'utf8');
        } catch (readError) {
          if (readError.code !== 'ENOENT') throw readError;
        }
        if (contents.includes('server-port=')) {
          contents = contents.replace(/^server-port=.*$/m, `server-port=${serverPort}`);
        } else {
          contents = `${contents}${contents && !contents.endsWith('\n') ? '\n' : ''}server-port=${serverPort}\n`;
        }
        await fs.writeFile(propertiesPath, contents, 'utf8');
      } catch (error) {
        console.error('Failed to set server port:', error);
      }
    }

    // Save server config
    await saveServerConfig(serverName, {
      serverType: serverType,
      version: selectedVersion,
      ramGB: serverRAM,
      status: 'STOPPED',
      port: serverPort,
      displayName: displayName || serverName // Store display name if provided
    });

    return { success: true, path: serverPath, jarFile, version: selectedVersion, build };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Server process management
const serverProcesses = new Map();
// Track CPU usage over time for Windows (needed for accurate CPU percentage)
const cpuUsageTracking = new Map(); // Map<serverName, { lastCpuTime: number, lastCheckTime: number }>

async function waitForProcessExit(proc, timeoutMs = 10000) {
  if (!proc || !proc.pid) return true;
  if (proc.killed) return true;

  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, timeoutMs);

    proc.once('exit', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(true);
      }
    });
  });
}

function killProcessTree(pid) {
  try {
    if (os.platform() === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: ['ignore', 'pipe', 'ignore'] });
      return;
    }
  } catch (error) {
    // Fall through to process.kill as a best effort
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    // Ignore if process is already gone
  }
}

// Check if a process is actually still running
function isProcessAlive(process) {
  if (!process || !process.pid) {
    return false;
  }
  
  // Check if process is marked as killed
  if (process.killed) {
    return false;
  }
  
  try {
    // On Windows, use tasklist to check if process exists
    if (os.platform() === 'win32') {
      try {
        const result = execSync(`tasklist /FI "PID eq ${process.pid}" /FO CSV /NH`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 2000
        });
        // If process exists, tasklist will return a line with the PID
        return result.trim().includes(process.pid.toString());
      } catch (error) {
        // Process doesn't exist or error checking
        return false;
      }
    } else {
      // On Unix-like systems, use kill with signal 0
      try {
        process.kill(0); // Signal 0 doesn't kill, just checks if process exists
        return true;
      } catch (error) {
        // Process doesn't exist (ESRCH error)
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    if (os.platform() === 'win32') {
      const result = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 2000
      });
      return result.trim().includes(pid.toString());
    }
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Start server
async function startServer(serverName, ramGB = null) {
  try {
    // Get custom servers directory from settings, or use default
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    
    // Check if server directory exists
    try {
      await fs.access(serverPath);
    } catch {
      return { success: false, error: 'Server directory not found. Please create the server first.' };
    }
    
    // Check if server exists
    const files = await fs.readdir(serverPath);
    const jarFile = files.find(f => f.endsWith('.jar'));
    
    if (!jarFile) {
      return { success: false, error: 'Server jar not found. Please create the server first.' };
    }

    // Check if already running
    const config = await getServerConfig(serverName);
    if (config?.pid && isPidAlive(config.pid)) {
      return { success: false, error: 'Server is already running' };
    }

    if (serverProcesses.has(serverName)) {
      const existingProcess = serverProcesses.get(serverName);
      // Check if process is still alive
      if (existingProcess && !existingProcess.killed && existingProcess.pid) {
        return { success: false, error: 'Server is already running' };
      } else {
        // Process is dead, remove it
        serverProcesses.delete(serverName);
      }
    }

    // Get RAM from config or use provided/default
    if (config?.pid && !isPidAlive(config.pid)) {
      await saveServerConfig(serverName, { ...config, pid: undefined, status: 'STOPPED' });
    }
    const serverRAM = normalizeRamGB(ramGB, config?.ramGB || 4);
    
    // Update status to STARTING
    await saveServerConfig(serverName, {
      ...config,
      status: 'STARTING',
      ramGB: serverRAM
    });

    const jarPath = path.join(serverPath, jarFile);
    const ramMB = serverRAM * 1024;
    
    const javaProcess = spawn('java', [
      `-Xms${ramMB}M`,
      `-Xmx${ramMB}M`,
      '-jar',
      jarPath,
      'nogui'
    ], {
      cwd: serverPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverProcesses.set(serverName, javaProcess);

    // Handle process events
    javaProcess.on('exit', async (code) => {
      serverProcesses.delete(serverName);
      cpuUsageTracking.delete(serverName); // Clean up CPU tracking
      const currentConfig = await getServerConfig(serverName);
      if (currentConfig) {
        await saveServerConfig(serverName, {
          ...currentConfig,
          status: 'STOPPED',
          pid: undefined
        });
      }
    });

    javaProcess.on('error', async (error) => {
      serverProcesses.delete(serverName);
      cpuUsageTracking.delete(serverName); // Clean up CPU tracking
      const currentConfig = await getServerConfig(serverName);
      if (currentConfig) {
        await saveServerConfig(serverName, {
          ...currentConfig,
          status: 'STOPPED',
          pid: undefined
        });
      }
    });

    await saveServerConfig(serverName, {
      ...config,
      status: 'STARTING',
      ramGB: serverRAM,
      pid: javaProcess.pid
    });

    // Update status to RUNNING after a short delay (server is starting)
    setTimeout(async () => {
      if (serverProcesses.has(serverName)) {
        const currentConfig = await getServerConfig(serverName);
        if (currentConfig) {
          await saveServerConfig(serverName, {
            ...currentConfig,
            status: 'RUNNING'
          });
        }
      }
    }, 2000);

    return { success: true, pid: javaProcess.pid };
  } catch (error) {
    // Update status to STOPPED on error
    const config = await getServerConfig(serverName);
    if (config) {
      await saveServerConfig(serverName, {
        ...config,
        status: 'STOPPED'
      });
    }
    return { success: false, error: error.message };
  }
}

// Stop server
async function stopServer(serverName) {
  try {
    const process = serverProcesses.get(serverName);
    if (!process) {
      const config = await getServerConfig(serverName);
      if (config?.pid && isPidAlive(config.pid)) {
        killProcessTree(config.pid);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      if (config && config.status !== 'STOPPED') {
        await saveServerConfig(serverName, {
          ...config,
          status: 'STOPPED',
          pid: undefined
        });
      }
      return { success: true };
    }

    // Send stop command to server
    try {
      if (process.stdin && process.stdin.writable) {
        process.stdin.write('stop\n');
      }
    } catch (error) {
      // Ignore if stdin is not writable
    }
    
    // Force kill after 10 seconds if still running
    const exited = await waitForProcessExit(process, 10000);
    if (!exited) {
      killProcessTree(process.pid);
      await waitForProcessExit(process, 5000);
    }

    serverProcesses.delete(serverName);
    cpuUsageTracking.delete(serverName);

    const config = await getServerConfig(serverName);
    if (config) {
      await saveServerConfig(serverName, {
        ...config,
        status: 'STOPPED',
        pid: undefined
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get server process for log streaming
function getServerProcess(serverName) {
  return serverProcesses.get(serverName);
}

// Delete server
async function deleteServer(serverName) {
  try {
    // Stop server if running
    if (serverProcesses.has(serverName)) {
      const process = serverProcesses.get(serverName);
      if (process && !process.killed) {
        process.kill('SIGKILL');
      }
      serverProcesses.delete(serverName);
    }

    // Get server directory
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);

    // Check if directory exists
    try {
      await fs.access(serverPath);
    } catch {
      // Directory doesn't exist, just remove from config
      const configs = await loadServerConfigs();
      delete configs[serverName];
      await saveServerConfigs(configs);
      return { success: true };
    }

    // Delete server directory and all contents
    await fs.rm(serverPath, { recursive: true, force: true });

    // Remove from config
    const configs = await loadServerConfigs();
    delete configs[serverName];
    await saveServerConfigs(configs);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Cache for server usage to reduce stuttering
const serverUsageCache = new Map(); // Map<serverName, { usage, timestamp }>
const USAGE_CACHE_TTL = 1000; // 1 second cache
const USAGE_REFRESH_INTERVAL = 2000;
let aggregateUsageCache = { totalCPU: 0, totalRAM: 0, totalRAMMB: 0, serverUsages: {}, timestamp: 0 };
let usageRefreshTimer = null;
let usageRefreshInFlight = false;
let diskUsageCache = { timestamp: 0, payload: null };

function startUsageRefreshLoop() {
  if (usageRefreshTimer) return;
  usageRefreshTimer = setInterval(async () => {
    if (usageRefreshInFlight) return;
    usageRefreshInFlight = true;
    try {
      await refreshUsageCache();
    } catch (error) {
      // Ignore refresh errors
    } finally {
      usageRefreshInFlight = false;
    }
  }, USAGE_REFRESH_INTERVAL);
}

// Get server usage (CPU, RAM) for a single server
// Now reads from jar file config and caches results to reduce stuttering
async function computeServerUsage(serverName, pid, configuredRAM) {
  let cpuPercent = 0;
  let ramMB = configuredRAM * 1024;
  const now = Date.now();

  if (os.platform() === 'win32') {
    try {
      const cmd = `$pids = @(${pid}); $pids += (Get-CimInstance Win32_Process -Filter "ParentProcessId=${pid}" | Select-Object -ExpandProperty ProcessId); $procs = Get-Process -Id $pids -ErrorAction SilentlyContinue; if ($procs) { $totalWorkingSet = ($procs | Measure-Object -Property WorkingSet64 -Sum).Sum; $totalCpuMs = ($procs | ForEach-Object { $_.TotalProcessorTime.TotalMilliseconds } | Measure-Object -Sum).Sum; @{ WorkingSet = $totalWorkingSet; ProcessorTime = $totalCpuMs } | ConvertTo-Json }`;
      const output = await new Promise((resolve, reject) => {
        execFile('powershell', ['-NoProfile', '-Command', cmd], { timeout: 3000 }, (error, stdout) => {
          if (error) return reject(error);
          resolve(stdout);
        });
      });

      if (output && output.trim()) {
        const processInfo = JSON.parse(output);

        if (processInfo) {
          ramMB = Math.round((processInfo.WorkingSet || 0) / (1024 * 1024));

          const currentCpuTime = processInfo.ProcessorTime || 0;
          const tracking = cpuUsageTracking.get(serverName);

          if (tracking && tracking.lastCheckTime) {
            const timeDiff = (now - tracking.lastCheckTime) / 1000;
            const cpuTimeDiff = (currentCpuTime - tracking.lastCpuTime) / 1000;

            if (timeDiff > 0) {
              const cpuCores = os.cpus().length;
              cpuPercent = Math.min(100, (cpuTimeDiff / timeDiff / cpuCores) * 100);
              cpuPercent = Math.max(0, cpuPercent);
            }
          }

          cpuUsageTracking.set(serverName, {
            lastCpuTime: currentCpuTime,
            lastCheckTime: now
          });
        }
      }
    } catch (error) {
      try {
        const wmicOutput = await new Promise((resolve, reject) => {
          execFile('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'WorkingSetSize', '/format:csv'], { timeout: 3000 }, (wmicError, stdout) => {
            if (wmicError) return reject(wmicError);
            resolve(stdout);
          });
        });
        const lines = wmicOutput.split('\n').filter(l => l.trim() && !l.startsWith('Node'));
        if (lines.length > 0) {
          const values = lines[0].split(',');
          if (values.length >= 3) {
            ramMB = Math.round(parseInt(values[2] || 0) / (1024 * 1024));
          }
        }
      } catch (wmicError) {
        ramMB = configuredRAM * 1024;
      }
    }
  } else {
    try {
      const psOutput = await new Promise((resolve, reject) => {
        execFile('ps', ['-p', `${pid}`, '-o', '%cpu,rss', '--no-headers'], { timeout: 3000 }, (error, stdout) => {
          if (error) return reject(error);
          resolve(stdout);
        });
      });
      const parts = psOutput.trim().split(/\s+/);
      if (parts.length >= 2) {
        cpuPercent = parseFloat(parts[0]) || 0;
        ramMB = Math.round(parseInt(parts[1]) / 1024);
      }
    } catch (error) {
      ramMB = configuredRAM * 1024;
    }
  }

  return { success: true, cpu: cpuPercent, ram: ramMB / 1024, ramMB, configuredRAM };
}

async function refreshUsageCache() {
  const configs = await loadServerConfigs();
  const serverNames = new Set([
    ...serverProcesses.keys(),
    ...Object.keys(configs).filter(name => configs[name]?.pid && isPidAlive(configs[name].pid))
  ]);

  if (serverNames.size === 0) {
    aggregateUsageCache = {
      totalCPU: 0,
      totalRAM: 0,
      totalRAMMB: 0,
      serverUsages: {},
      timestamp: Date.now()
    };
    return;
  }

  let totalCPU = 0;
  let totalRAM = 0;
  let totalRAMMB = 0;
  const serverUsages = {};

  const usageResults = await Promise.all(
    Array.from(serverNames).map(async (serverName) => {
      const config = configs[serverName];
      const configuredRAM = config?.ramGB || 4;
      const pid = serverProcesses.get(serverName)?.pid || config?.pid;
      if (!pid || !isPidAlive(pid)) {
        return null;
      }
      const usage = await computeServerUsage(serverName, pid, configuredRAM);
      return { serverName, usage };
    })
  );

  const now = Date.now();
  for (const result of usageResults) {
    if (!result) continue;
    serverUsageCache.set(result.serverName, { usage: result.usage, timestamp: now });
    serverUsages[result.serverName] = result.usage;
    totalCPU += result.usage.cpu || 0;
    totalRAM += result.usage.ram || 0;
    totalRAMMB += result.usage.ramMB || 0;
  }

  aggregateUsageCache = {
    totalCPU,
    totalRAM,
    totalRAMMB,
    serverUsages,
    timestamp: Date.now()
  };
}

async function getServerUsage(serverName) {
  try {
    // Get configured RAM from server config (stored when server was created/started)
    const config = await getServerConfig(serverName);
    const configuredRAM = config?.ramGB || 4;
    const configuredRAMMB = configuredRAM * 1024;

    let pid = null;
    const process = serverProcesses.get(serverName);
    if (process?.pid) {
      pid = process.pid;
    } else if (config?.pid && isPidAlive(config.pid)) {
      pid = config.pid;
    }

    if (!pid) {
      // Clear tracking if process doesn't exist
      cpuUsageTracking.delete(serverName);
      serverUsageCache.delete(serverName);
      // Return configured RAM even when stopped
      return { success: true, cpu: 0, ram: configuredRAM, ramMB: configuredRAMMB, configuredRAM };
    }

    // Prefer cached results to avoid heavy polling on the IPC thread
    const cached = serverUsageCache.get(serverName);
    if (cached) {
      return { ...cached.usage, configuredRAM };
    }
    const result = await computeServerUsage(serverName, pid, configuredRAM);
    
    // Cache the result
    serverUsageCache.set(serverName, {
      usage: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    // On error, return configured RAM from config
    const config = await getServerConfig(serverName);
    const configuredRAM = config?.ramGB || 4;
    return { success: true, cpu: 0, ram: configuredRAM, ramMB: configuredRAM * 1024, configuredRAM };
  }
}

// Get aggregate usage for all servers
async function getAllServersUsage() {
  try {
    if (Date.now() - aggregateUsageCache.timestamp < 1000) {
      return { success: true, ...aggregateUsageCache };
    }
    // Return cached snapshot even if slightly stale to keep UI smooth
    return { success: true, ...aggregateUsageCache };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get disk usage for all servers
async function getServersDiskUsage() {
  try {
    if (diskUsageCache.payload && Date.now() - diskUsageCache.timestamp < 15000) {
      return diskUsageCache.payload;
    }
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const servers = await listServers();
    let totalSize = 0;

    // Helper function to get directory size
    const getDirectorySize = async (dirPath) => {
      let size = 0;
      try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
          const filePath = path.join(dirPath, file.name);
          if (file.isDirectory()) {
            size += await getDirectorySize(filePath);
          } else {
            const stats = await fs.stat(filePath);
            size += stats.size;
          }
        }
      } catch (error) {
        // Ignore errors
      }
      return size;
    };

    const serverSizes = {};
    for (const server of servers) {
      const serverPath = path.join(serversDir, server.name);
      try {
        const size = await getDirectorySize(serverPath);
        serverSizes[server.name] = size;
        totalSize += size;
      } catch (error) {
        serverSizes[server.name] = 0;
      }
    }

    const payload = {
      success: true,
      totalSize,
      totalSizeGB: totalSize / (1024 * 1024 * 1024),
      serverSizes
    };
    diskUsageCache = { timestamp: Date.now(), payload };
    return payload;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Restart server
async function restartServer(serverName, ramGB = null) {
  try {
    // Stop the server first
    const stopResult = await stopServer(serverName);
    if (!stopResult.success) {
      return { success: false, error: `Failed to stop server: ${stopResult.error}` };
    }

    // Small delay to ensure file locks are released
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start the server
    const startResult = await startServer(serverName, ramGB);
    return startResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Kill server (force kill immediately)
async function killServer(serverName) {
  try {
    const process = serverProcesses.get(serverName);
    if (!process) {
      const config = await getServerConfig(serverName);
      if (config?.pid && isPidAlive(config.pid)) {
        killProcessTree(config.pid);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (config && config.status !== 'STOPPED') {
        await saveServerConfig(serverName, {
          ...config,
          status: 'STOPPED',
          pid: undefined
        });
      }
      return { success: true };
    }

    // Force kill immediately
    killProcessTree(process.pid);
    await waitForProcessExit(process, 5000);
    serverProcesses.delete(serverName);
    cpuUsageTracking.delete(serverName); // Clean up CPU tracking

    // Update status
    const config = await getServerConfig(serverName);
    if (config) {
      await saveServerConfig(serverName, {
        ...config,
        status: 'STOPPED',
        pid: undefined
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get server logs from log file
async function getServerLogs(serverName, maxLines = 1000) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    const logPath = path.join(serverPath, 'logs', 'latest.log');

    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      const allLines = logContent.split('\n').filter(line => line.trim());
      // Return the last maxLines
      const lines = allLines.slice(-maxLines);
      return { success: true, lines };
    } catch (err) {
      // Log file might not exist yet
      return { success: true, lines: [] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get player count from server logs (simple parsing)
async function getPlayerCount(serverName) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    const logPath = path.join(serverPath, 'logs', 'latest.log');

    // Check if server is running
    if (!serverProcesses.has(serverName)) {
      return { success: true, online: 0, max: 0 };
    }

    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.split('\n').reverse().slice(0, 100); // Check last 100 lines
      
      // Look for player count in logs (format: "There are X of a max of Y players online")
      for (const line of lines) {
        const match = line.match(/There are (\d+) of a max of (\d+) players online/i);
        if (match) {
          return { success: true, online: parseInt(match[1]), max: parseInt(match[2]) };
        }
        // Also check for "players online:" format
        const match2 = line.match(/(\d+) players? online/i);
        if (match2) {
          // Try to find max players from server.properties
          let maxPlayers = 20;
          try {
            const propsPath = path.join(serverPath, 'server.properties');
            const propsContent = await fs.readFile(propsPath, 'utf8');
            const maxMatch = propsContent.match(/max-players=(\d+)/i);
            if (maxMatch) {
              maxPlayers = parseInt(maxMatch[1]);
            }
          } catch {}
          return { success: true, online: parseInt(match2[1]), max: maxPlayers };
        }
      }
    } catch (err) {
      // Log file might not exist yet
    }

    return { success: true, online: 0, max: 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// List servers
async function listServers() {
  try {
    await ensureDirectories();
    const configs = await loadServerConfigs();
    const serverList = [];
    // Get custom servers directory from settings, or use default
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverDirs = await fs.readdir(serversDir);

    for (const serverName of serverDirs) {
      const serverPath = path.join(serversDir, serverName);
      const stat = await fs.stat(serverPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(serverPath);
        const jarFile = files.find(f => f.endsWith('.jar'));
        
        if (jarFile) {
          const config = configs[serverName];
          let isRunning = serverProcesses.has(serverName);
          if (!isRunning && config?.pid && isPidAlive(config.pid)) {
            isRunning = true;
          }
          
          // Determine status: check process first, then config
          let status = 'STOPPED';
          if (isRunning) {
            const process = serverProcesses.get(serverName);
            if (process && isProcessAlive(process)) {
              status = 'RUNNING';
            } else {
              // Process is dead, remove it and update config
              serverProcesses.delete(serverName);
              cpuUsageTracking.delete(serverName);
              status = 'STOPPED';
              // Update config to reflect actual status
              if (config) {
                await saveServerConfig(serverName, {
                  ...config,
                  status: 'STOPPED',
                  pid: undefined
                });
              }
            }
          } else if (config?.pid && !isPidAlive(config.pid)) {
            await saveServerConfig(serverName, {
              ...config,
              status: 'STOPPED',
              pid: undefined
            });
          } else if (config && config.status === 'STARTING') {
            status = 'STARTING';
          } else if (config) {
            status = config.status || 'STOPPED';
          }
          
          // If config says RUNNING but process doesn't exist, fix it
          if (config && config.status === 'RUNNING' && !isRunning) {
            status = 'STOPPED';
            await saveServerConfig(serverName, {
              ...config,
              status: 'STOPPED',
              pid: undefined
            });
          }
          
          // Extract version from jar filename if not in config
          let version = 'unknown';
          if (config && config.version) {
            version = config.version;
          } else {
            // Try to extract version from various jar filename patterns
            const versionMatch = jarFile.match(/(?:paper|spigot|velocity|waterfall|bungeecord|server|fabric|forge)-?(\d+\.\d+(?:\.\d+)?)/i);
            if (versionMatch) {
              version = versionMatch[1];
            } else if (jarFile.includes('manual') || jarFile.includes('custom')) {
              version = 'manual';
            }
          }
          
          // Create config for existing servers without config (backward compatibility)
          if (!config) {
            // Save actual status (convert RUNNING to STOPPED for config since process map is source of truth)
            const configStatus = status === 'RUNNING' ? 'STOPPED' : status;
            await saveServerConfig(serverName, {
              version,
              ramGB: 4,
              status: configStatus,
              port: 25565
            });
          } else if (status === 'RUNNING' && config.status !== 'RUNNING') {
            // Update config if process is running but config says otherwise
            await saveServerConfig(serverName, {
              ...config,
              status: 'RUNNING'
            });
          }
          
          serverList.push({
            id: serverName,
            name: serverName,
            version,
            status: status, // Keep status as RUNNING, STOPPED, or STARTING
            port: config?.port || 25565,
            ramGB: config?.ramGB || 4,
          });
        }
      }
    }

    return serverList;
  } catch (error) {
    return [];
  }
}

// Update server RAM
async function updateServerRAM(serverName, ramGB) {
  try {
    const config = await getServerConfig(serverName);
    if (!config) {
      return { success: false, error: 'Server not found' };
    }
    await saveServerConfig(serverName, {
      ...config,
      ramGB
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get server files list
async function getServerFiles(serverName, filePath = '') {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName, filePath);
    
    const items = [];
    const entries = await fs.readdir(serverPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(serverPath, entry.name);
      const stat = await fs.stat(fullPath);
      
      items.push({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        modified: stat.mtime.toISOString(),
        path: path.join(filePath, entry.name).replace(/\\/g, '/')
      });
    }
    
    // Sort: directories first, then files (both alphabetically)
    items.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
    
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Read server file
async function readServerFile(serverName, filePath) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const fullPath = path.join(serversDir, serverName, filePath);
    
    // Security check - prevent path traversal
    const normalizedPath = path.normalize(fullPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid file path' };
    }
    
    const content = await fs.readFile(fullPath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Write server file
async function writeServerFile(serverName, filePath, content) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const fullPath = path.join(serversDir, serverName, filePath);
    
    // Security check - prevent path traversal
    const normalizedPath = path.normalize(fullPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid file path' };
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Check if a jar file supports plugins by checking server type and jar filename
// Plugin-supporting servers: Paper, Spigot, Purpur, Velocity, Waterfall, BungeeCord
// Mod-supporting servers (NOT plugins): Fabric, Forge
// No support: Vanilla, Manual
async function checkJarSupportsPlugins(serverName) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    
    // Check server type from config first (fastest and most reliable)
    const config = await getServerConfig(serverName);
    if (config && config.serverType) {
      const serverType = config.serverType.toLowerCase();
      // Plugin-supporting server types
      const pluginServers = ['paper', 'spigot', 'purpur', 'velocity', 'waterfall', 'bungeecord'];
      // Mod-supporting server types (NOT plugins)
      const modServers = ['fabric', 'forge'];
      // No support
      const noSupportServers = ['vanilla', 'manual'];
      
      if (pluginServers.includes(serverType)) {
        return true;
      }
      if (modServers.includes(serverType) || noSupportServers.includes(serverType)) {
        return false;
      }
    }
    
    // Fallback: Check jar filename patterns
    try {
      const files = await fs.readdir(serverPath);
      const jarFile = files.find(f => f.endsWith('.jar'));
      if (!jarFile) {
        return false;
      }
      
      const jarName = jarFile.toLowerCase();
      
      // Plugin-supporting patterns
      const pluginPatterns = ['paper', 'spigot', 'purpur', 'velocity', 'waterfall', 'bungeecord'];
      if (pluginPatterns.some(pattern => jarName.includes(pattern))) {
        return true;
      }
      
      // Mod-supporting patterns (NOT plugins)
      if (jarName.includes('forge') || jarName.includes('fabric')) {
        return false;
      }
      
      // Vanilla server pattern (no support)
      if (jarName.includes('server') && !jarName.includes('paper') && !jarName.includes('spigot') && !jarName.includes('purpur')) {
        return false;
      }
      
      // Manual/custom jars - no support by default
      if (jarName.includes('manual') || jarName.includes('custom')) {
        return false;
      }
    } catch (error) {
      // Can't read directory
      return false;
    }
    
    // Default: don't assume plugin support if we can't determine
    return false;
  } catch (error) {
    return false;
  }
}

// Get plugins from Modrinth API with pagination to get all results
async function getModrinthPlugins(minecraftVersion = null, limit = 200) {
  return new Promise(async (resolve, reject) => {
    try {
      // Build facets array properly
      const facets = [['project_type:plugin']];
      if (minecraftVersion) {
        facets.push(['versions:' + minecraftVersion]);
      }
      
      // Encode facets as JSON
      const facetsJson = encodeURIComponent(JSON.stringify(facets));
      
      let allPlugins = [];
      let offset = 0;
      const pageSize = 100; // Modrinth API max is 100 per request
      let hasMore = true;
      
      // Fetch all pages
      while (hasMore) {
        const url = `https://api.modrinth.com/v2/search?facets=${facetsJson}&limit=${pageSize}&offset=${offset}`;
        
        const pageResults = await new Promise((pageResolve, pageReject) => {
          https.get(url, {
            headers: {
              'User-Agent': 'HexNode/1.0.0'
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                pageResolve({
                  hits: json.hits || [],
                  total: json.total_hits || 0
                });
              } catch (e) {
                pageReject(e);
              }
            });
          }).on('error', pageReject);
        });
        
        allPlugins = allPlugins.concat(pageResults.hits);
        if (limit && allPlugins.length >= limit) {
          allPlugins = allPlugins.slice(0, limit);
          hasMore = false;
          break;
        }
        
        // Check if there are more results
        if (pageResults.hits.length < pageSize || allPlugins.length >= pageResults.total) {
          hasMore = false;
        } else {
          offset += pageSize;
          // Continue fetching until we have all plugins (no artificial limit)
        }
      }
      
      resolve(allPlugins);
    } catch (error) {
      reject(error);
    }
  });
}

// Get latest version of a Modrinth plugin for a specific Minecraft version
async function getModrinthPluginVersion(projectId, minecraftVersion) {
  return new Promise((resolve, reject) => {
    // Modrinth API expects URL-encoded arrays
    const gameVersions = encodeURIComponent(JSON.stringify([minecraftVersion]));
    const loaders = encodeURIComponent(JSON.stringify(['bukkit', 'spigot', 'paper', 'purpur']));
    const url = `https://api.modrinth.com/v2/project/${projectId}/version?game_versions=${gameVersions}&loaders=${loaders}`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'HexNode/1.0.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Return the first (latest) version that matches
          if (json && json.length > 0) {
            resolve(json[0]);
          } else {
            reject(new Error('No compatible version found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Install plugin from Modrinth
async function installModrinthPlugin(serverName, projectId, minecraftVersion) {
  try {
    // Check if server supports plugins
    const supportsPlugins = await checkJarSupportsPlugins(serverName);
    if (!supportsPlugins) {
      return { success: false, error: 'This server type does not support plugins' };
    }

    // Get settings and paths
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const pluginsPath = path.join(serversDir, serverName, 'plugins');
    
    // Ensure plugins directory exists
    await fs.mkdir(pluginsPath, { recursive: true });

    // Get the latest compatible version
    const version = await getModrinthPluginVersion(projectId, minecraftVersion);
    
    if (!version || !version.files || version.files.length === 0) {
      return { success: false, error: 'No download file found for this plugin version' };
    }

    // Find the primary jar file (usually the first one, or one marked as primary)
    const jarFile = version.files.find(f => f.primary) || version.files.find(f => f.filename.endsWith('.jar')) || version.files[0];
    
    if (!jarFile) {
      return { success: false, error: 'No jar file found in plugin version' };
    }

    // Download the plugin
    const pluginPath = path.join(pluginsPath, jarFile.filename);
    const downloadUrl = jarFile.url || `https://cdn.modrinth.com/data/${projectId}/versions/${version.id}/${jarFile.filename}`;
    
    await downloadFile(downloadUrl, pluginPath);

    return { success: true, filename: jarFile.filename, path: pluginPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// List plugins
async function listPlugins(serverName) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const pluginsPath = path.join(serversDir, serverName, 'plugins');
    
    // Check if server supports plugins
    const supportsPlugins = await checkJarSupportsPlugins(serverName);
    if (!supportsPlugins) {
      return { success: true, plugins: [], supportsPlugins: false };
    }
    
    try {
      await fs.access(pluginsPath);
    } catch {
      return { success: true, plugins: [], supportsPlugins: true };
    }
    
    const files = await fs.readdir(pluginsPath);
    const plugins = [];
    
    for (const file of files) {
      if (file.endsWith('.jar')) {
        const filePath = path.join(pluginsPath, file);
        const stat = await fs.stat(filePath);
        plugins.push({
          name: file,
          size: stat.size,
          modified: stat.mtime.toISOString()
        });
      }
    }
    
    return { success: true, plugins, supportsPlugins: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete plugin
async function deletePlugin(serverName, pluginName) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const pluginPath = path.join(serversDir, serverName, 'plugins', pluginName);
    
    // Security check
    const normalizedPath = path.normalize(pluginPath);
    const normalizedPluginsDir = path.normalize(path.join(serversDir, serverName, 'plugins'));
    if (!normalizedPath.startsWith(normalizedPluginsDir)) {
      return { success: false, error: 'Invalid plugin path' };
    }
    
    await fs.unlink(pluginPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// List worlds
async function listWorlds(serverName) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    
    const files = await fs.readdir(serverPath, { withFileTypes: true });
    const worlds = [];
    
    for (const entry of files) {
      if (entry.isDirectory()) {
        // Check if it's a world directory (has level.dat)
        const levelDatPath = path.join(serverPath, entry.name, 'level.dat');
        try {
          await fs.access(levelDatPath);
          const stat = await fs.stat(path.join(serverPath, entry.name));
          worlds.push({
            name: entry.name,
            size: await getDirectorySize(path.join(serverPath, entry.name)),
            modified: stat.mtime.toISOString()
          });
        } catch {
          // Not a world directory
        }
      }
    }
    
    return { success: true, worlds };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper to get directory size
async function getDirectorySize(dirPath) {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await getDirectorySize(filePath);
      } else {
        const stat = await fs.stat(filePath);
        size += stat.size;
      }
    }
  } catch {
    // Ignore errors
  }
  return size;
}

// Get server properties
async function getServerProperties(serverName) {
  try {
    const result = await readServerFile(serverName, 'server.properties');
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const properties = {};
    const lines = result.content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          properties[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return { success: true, properties };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update server properties
async function updateServerProperties(serverName, properties) {
  try {
    const result = await readServerFile(serverName, 'server.properties');
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const lines = result.content.split('\n');
    const newLines = [];
    const updatedKeys = new Set(Object.keys(properties));
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=');
        if (key && updatedKeys.has(key.trim())) {
          newLines.push(`${key.trim()}=${properties[key.trim()]}`);
          updatedKeys.delete(key.trim());
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }
    
    // Add any new properties
    for (const key of updatedKeys) {
      newLines.push(`${key}=${properties[key]}`);
    }
    
    const newContent = newLines.join('\n');
    return await writeServerFile(serverName, 'server.properties', newContent);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get HexNode directory
function getHexnodeDir() {
  return HEXNODE_DIR;
}

// Show folder dialog (placeholder - actual implementation is in main.js via IPC)
async function showFolderDialog(options) {
  // This function is not used directly - it's called via IPC from main.js
  // But we need it exported for consistency
  throw new Error('showFolderDialog should be called via IPC, not directly');
}

module.exports = {
  checkJava,
  getPaperVersions,
  getLatestPaperVersion,
  getSpigotVersions,
  getVanillaVersions,
  getFabricVersions,
  getForgeVersions,
  getVelocityVersions,
  getVelocityVersionForMC,
  getWaterfallVersions,
  getBungeeCordVersions,
  getPurpurVersions,
  createServer,
  startServer,
  stopServer,
  restartServer,
  killServer,
  getServerProcess,
  listServers,
  updateServerRAM,
  getServerLogs,
  getPlayerCount,
  getServerFiles,
  readServerFile,
  writeServerFile,
  listPlugins,
  deletePlugin,
  checkJarSupportsPlugins,
  getModrinthPlugins,
  installModrinthPlugin,
  listWorlds,
  getServerProperties,
  updateServerProperties,
  deleteServer,
  getServerUsage,
  getAllServersUsage,
  getServersDiskUsage,
  getSystemInfo,
  isSetupComplete,
  getAppSettings,
  saveAppSettings,
  completeSetup,
  resetSetup,
  ensureDirectories,
  isPortAvailable,
  findAvailablePort,
  showFolderDialog,
  getHexnodeDir
};

// Start background usage polling
startUsageRefreshLoop();
startAutoBackupLoop();