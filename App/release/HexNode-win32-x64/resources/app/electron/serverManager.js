const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

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

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(HEXNODE_DIR, { recursive: true });
  await fs.mkdir(SERVERS_DIR, { recursive: true });
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
}

// Get system information
async function getSystemInfo() {
  try {
    const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    const freeMemoryGB = Math.round(os.freemem() / (1024 * 1024 * 1024));
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuCores = cpus.length;
    
    // Get disk space from all drives - return as array
    const drives = [];
    
    try {
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        // Use PowerShell as primary method (wmic is deprecated in Windows 11)
        try {
          const result = execSync(`powershell -NoProfile -Command "Get-WmiObject -Class Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,Size,FreeSpace | ConvertTo-Json"`, {
            encoding: 'utf8',
            timeout: 10000,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'ignore'] // Suppress stderr to prevent spam
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
          // Silently fail - don't spam console with errors
          // Try fallback with Get-CimInstance (newer PowerShell cmdlet)
          try {
            const result = execSync(`powershell -NoProfile -Command "Get-CimInstance -ClassName Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,Size,FreeSpace | ConvertTo-Json"`, {
              encoding: 'utf8',
              timeout: 10000,
              windowsHide: true,
              stdio: ['ignore', 'pipe', 'ignore']
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
      } else {
        // Linux/Mac - try to get disk info
        try {
          const { execSync } = require('child_process');
          if (process.platform === 'darwin') {
            // macOS - get all mounted volumes
            const result = execSync(`df -g | awk 'NR>1 {print $1 " " $2 " " $4}'`, { encoding: 'utf8' });
            const lines = result.trim().split('\n');
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
          } else {
            // Linux - get all mounted filesystems
            const result = execSync(`df -BG | awk 'NR>1 {print $1 " " $2 " " $4}'`, { encoding: 'utf8' });
            const lines = result.trim().split('\n');
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
          }
        } catch (err) {
          // Silently fail - no drives will be shown
        }
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }

    return {
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
  } catch (error) {
    return {
      cpu: { model: 'Unknown', cores: 0, threads: 0 },
      memory: { totalGB: 0, freeGB: 0, usedGB: 0 },
      storage: { totalGB: 0, freeGB: 0, usedGB: 0 },
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname()
    };
  }
}

// Check if setup is complete
async function isSetupComplete() {
  try {
    const configs = await loadServerConfigs();
    return configs._setupComplete === true;
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
          resolve(json.versions || []);
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
  return versions[versions.length - 1];
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
    '1.21.1', '1.21', '1.20.6', '1.20.5', '1.20.4', '1.20.2', '1.20.1', 
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.18',
    '1.17.1', '1.17',
    '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16'
  ];
}

// Download Spigot (using GetBukkit)
async function downloadSpigot(serverPath, version) {
  const filename = `spigot-${version}.jar`;
  const filepath = path.join(serverPath, filename);
  // GetBukkit CDN
  const url = `https://download.getbukkit.org/spigot/spigot-${version}.jar`;
  return await downloadFile(url, filepath);
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
            .map(v => v.id)
            .reverse();
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
            .map(v => v.version)
            .reverse();
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
  // Forge requires installer, simplified for now
  const filename = `forge-${version}.jar`;
  const filepath = path.join(serverPath, filename);
  // This is a simplified approach - Forge actually needs an installer
  throw new Error('Forge installation requires manual setup. Please use the Forge installer.');
}

// Get Velocity versions (proxy)
async function getVelocityVersions() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.papermc.io/v2/projects/velocity';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.versions || []);
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
          resolve(json.versions || []);
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
async function getBungeeCordVersions() {
  // BungeeCord uses GitHub releases or build numbers
  return new Promise((resolve, reject) => {
    // Try GitHub API first
    const url = 'https://api.github.com/repos/SpigotMC/BungeeCord/releases';
    https.get(url, {
      headers: { 'User-Agent': 'HexNode' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json) && json.length > 0) {
            const versions = json.map(r => {
              // Extract version from tag_name (e.g., "BungeeCord-1.20" or just "1.20")
              const tag = r.tag_name.replace(/^[Bb]ungee[Cc]ord-?/, '');
              return tag;
            }).filter(v => v && v.length > 0);
            // Sort versions (newest first) - simple numeric sort
            versions.sort((a, b) => {
              const aNum = parseFloat(a) || 0;
              const bNum = parseFloat(b) || 0;
              return bNum - aNum;
            });
            resolve(versions);
          } else {
            // Fallback to common build numbers
            resolve(['1770', '1760', '1750', '1740', '1730', '1720', '1710', '1700']);
          }
        } catch (e) {
          // Fallback to common build numbers
          resolve(['1770', '1760', '1750', '1740', '1730', '1720', '1710', '1700']);
        }
      });
    }).on('error', () => {
      // Fallback to common build numbers if API fails
      resolve(['1770', '1760', '1750', '1740', '1730', '1720', '1710', '1700']);
    });
  });
}

// Download BungeeCord
async function downloadBungeeCord(serverPath, version) {
  const filename = `BungeeCord-${version}.jar`;
  const filepath = path.join(serverPath, filename);
  const url = `https://ci.md-5.net/job/BungeeCord/${version}/artifact/bootstrap/target/${filename}`;
  return await downloadFile(url, filepath);
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
    name: serverName,
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
async function createServer(serverName = 'default', serverType = 'paper', version = null, ramGB = null, manualJarPath = null) {
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
          selectedVersion = version || velocityVersions[velocityVersions.length - 1];
          build = await getVelocityBuild(selectedVersion);
          jarPath = await downloadVelocity(serverPath, selectedVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        case 'waterfall':
          const waterfallVersions = await getWaterfallVersions();
          selectedVersion = version || waterfallVersions[waterfallVersions.length - 1];
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
        
        default:
          throw new Error(`Unsupported server type: ${serverType}`);
      }
    }

    const serverRAM = ramGB !== null ? ramGB : (settings.defaultRAM || 4);
    const serverPort = settings.defaultPort || 25565;

    // Create eula.txt (not needed for proxy servers)
    if (!['velocity', 'waterfall', 'bungeecord'].includes(serverType)) {
      const eulaPath = path.join(serverPath, 'eula.txt');
      await fs.writeFile(eulaPath, 'eula=true\n', 'utf8');
    }

    // Save server config
    await saveServerConfig(serverName, {
      serverType: serverType,
      version: selectedVersion,
      ramGB: serverRAM,
      status: 'STOPPED',
      port: serverPort
    });

    return { success: true, path: serverPath, jarFile, version: selectedVersion, build };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Server process management
const serverProcesses = new Map();

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
    const config = await getServerConfig(serverName);
    const serverRAM = ramGB !== null ? ramGB : (config?.ramGB || 4);
    
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
      const currentConfig = await getServerConfig(serverName);
      if (currentConfig) {
        await saveServerConfig(serverName, {
          ...currentConfig,
          status: 'STOPPED'
        });
      }
    });

    javaProcess.on('error', async (error) => {
      serverProcesses.delete(serverName);
      const currentConfig = await getServerConfig(serverName);
      if (currentConfig) {
        await saveServerConfig(serverName, {
          ...currentConfig,
          status: 'STOPPED'
        });
      }
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
      return { success: false, error: 'Server is not running' };
    }

    // Update status
    const config = await getServerConfig(serverName);
    if (config) {
      await saveServerConfig(serverName, {
        ...config,
        status: 'STOPPED'
      });
    }

    // Send stop command to server
    process.stdin.write('stop\n');
    
    // Force kill after 10 seconds if still running
    setTimeout(async () => {
      if (serverProcesses.has(serverName)) {
        process.kill();
        serverProcesses.delete(serverName);
        const currentConfig = await getServerConfig(serverName);
        if (currentConfig) {
          await saveServerConfig(serverName, {
            ...currentConfig,
            status: 'STOPPED'
          });
        }
      }
    }, 10000);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get server process for log streaming
function getServerProcess(serverName) {
  return serverProcesses.get(serverName);
}

// Restart server
async function restartServer(serverName, ramGB = null) {
  try {
    // Stop the server first
    const stopResult = await stopServer(serverName);
    if (!stopResult.success) {
      return { success: false, error: `Failed to stop server: ${stopResult.error}` };
    }

    // Wait a moment for clean shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));

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
      return { success: false, error: 'Server is not running' };
    }

    // Force kill immediately
    process.kill('SIGKILL');
    serverProcesses.delete(serverName);

    // Update status
    const config = await getServerConfig(serverName);
    if (config) {
      await saveServerConfig(serverName, {
        ...config,
        status: 'STOPPED'
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
          const isRunning = serverProcesses.has(serverName);
          
          // Determine status: check process first, then config
          let status = 'STOPPED';
          if (isRunning) {
            const process = serverProcesses.get(serverName);
            if (process && !process.killed && process.pid) {
              status = 'RUNNING';
            } else {
              status = 'STOPPED';
            }
          } else if (config && config.status === 'STARTING') {
            status = 'STARTING';
          } else if (config) {
            status = config.status || 'STOPPED';
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

// List plugins
async function listPlugins(serverName) {
  try {
    const settings = await getAppSettings();
    const serversDir = settings.serversDirectory || SERVERS_DIR;
    const pluginsPath = path.join(serversDir, serverName, 'plugins');
    
    try {
      await fs.access(pluginsPath);
    } catch {
      return { success: true, plugins: [] };
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
    
    return { success: true, plugins };
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
  getWaterfallVersions,
  getBungeeCordVersions,
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
  listWorlds,
  getServerProperties,
  updateServerProperties,
  getSystemInfo,
  isSetupComplete,
  getAppSettings,
  saveAppSettings,
  completeSetup,
  resetSetup,
  ensureDirectories,
  showFolderDialog,
  getHexnodeDir
};

