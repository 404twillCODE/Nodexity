/**
 * System information, resource usage monitoring, and auto-backup.
 */
const { execFile } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const config = require('./config');

// Lazy-loaded to avoid circular dependency with server-lifecycle
let _lifecycle = null;
function lifecycle() {
  if (!_lifecycle) _lifecycle = require('./server-lifecycle');
  return _lifecycle;
}

// ── System Information ──────────────────────────────────────────────────────

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

    let cpuTempCelsius = null;
    if (os.platform() === 'win32') {
      const tryTemp = async (script) => {
        try {
          const out = await execFilePromise('powershell', ['-NoProfile', '-Command', script], { timeout: 4000, windowsHide: true });
          const v = parseFloat(out?.trim());
          if (Number.isFinite(v) && v > -100 && v < 200) return v;
        } catch (e) {}
        return null;
      };
      cpuTempCelsius = await tryTemp(
        "try { $z = Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -EA SilentlyContinue | Select-Object -First 1; if ($z) { [math]::Round(($z.CurrentTemperature/10.0)-273.15, 1) } } catch {}"
      );
      if (cpuTempCelsius == null) {
        cpuTempCelsius = await tryTemp(
          "try { $z = Get-WmiObject -Namespace root/wmi -Class MSAcpi_ThermalZoneTemperature -EA SilentlyContinue | Select-Object -First 1; if ($z) { [math]::Round(($z.CurrentTemperature/10.0)-273.15, 1) } } catch {}"
        );
      }
    } else if (os.platform() === 'linux') {
      try {
        const thermalPaths = ['/sys/class/thermal/thermal_zone0/temp', '/sys/class/hwmon/hwmon0/temp1_input', '/sys/class/hwmon/hwmon1/temp1_input'];
        for (const p of thermalPaths) {
          try {
            const buf = await fs.readFile(p, 'utf8');
            const millideg = parseInt(buf.trim(), 10);
            if (Number.isFinite(millideg)) {
              const c = millideg / 1000;
              if (c > -100 && c < 200) {
                cpuTempCelsius = Math.round(c * 10) / 10;
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
      } catch (err) {}
    }

    let localAddress = null;
    try {
      const ifaces = os.networkInterfaces();
      for (const name of Object.keys(ifaces || {})) {
        for (const iface of ifaces[name] || []) {
          if (iface.family === 'IPv4' && !iface.internal && iface.address) {
            localAddress = iface.address;
            break;
          }
        }
        if (localAddress) break;
      }
    } catch (e) { /* ignore */ }

    const payload = {
      cpu: {
        model: cpuModel,
        cores: cpuCores,
        threads: cpuCores,
        tempCelsius: cpuTempCelsius
      },
      memory: {
        totalGB: totalMemoryGB,
        freeGB: freeMemoryGB,
        usedGB: totalMemoryGB - freeMemoryGB
      },
      drives: drives,
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      localAddress: localAddress || null
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
      hostname: os.hostname(),
      localAddress: null
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

// ── Usage Monitoring ────────────────────────────────────────────────────────

// Cache for server usage to reduce stuttering
const serverUsageCache = new Map(); // Map<serverName, { usage, timestamp }>
const USAGE_REFRESH_INTERVAL = 3000; // 3s to reduce CPU when multiple servers run
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
          const tracking = lifecycle().cpuUsageTracking.get(serverName);

          if (tracking && tracking.lastCheckTime) {
            const timeDiff = (now - tracking.lastCheckTime) / 1000;
            const cpuTimeDiff = (currentCpuTime - tracking.lastCpuTime) / 1000;

            if (timeDiff > 0) {
              const cpuCores = os.cpus().length;
              cpuPercent = Math.min(100, (cpuTimeDiff / timeDiff / cpuCores) * 100);
              cpuPercent = Math.max(0, cpuPercent);
            }
          }

          lifecycle().cpuUsageTracking.set(serverName, {
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
  const configs = await config.loadServerConfigs();
  const serverNames = new Set([
    ...lifecycle().serverProcesses.keys(),
    ...Object.keys(configs).filter(name => configs[name]?.pid && lifecycle().isPidAlive(configs[name].pid))
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
      const cfg = configs[serverName];
      const configuredRAM = cfg?.ramGB || 4;
      const pid = lifecycle().serverProcesses.get(serverName)?.pid || cfg?.pid;
      if (!pid || !lifecycle().isPidAlive(pid)) {
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
    const cfg = await config.getServerConfig(serverName);
    const configuredRAM = cfg?.ramGB || 4;
    const configuredRAMMB = configuredRAM * 1024;

    let pid = null;
    const proc = lifecycle().serverProcesses.get(serverName);
    if (proc?.pid) {
      pid = proc.pid;
    } else if (cfg?.pid && lifecycle().isPidAlive(cfg.pid)) {
      pid = cfg.pid;
    }

    if (!pid) {
      // Clear tracking if process doesn't exist
      lifecycle().cpuUsageTracking.delete(serverName);
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
    const cfg = await config.getServerConfig(serverName);
    const configuredRAM = cfg?.ramGB || 4;
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
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const servers = await lifecycle().listServers();
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

// ── Backup System ───────────────────────────────────────────────────────────

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
    const settings = await config.getAppSettings();
    if (!settings.autoBackup) return;

    const backupsDir = settings.backupsDirectory || config.BACKUPS_DIR;
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const intervalHours = Math.max(1, Number(settings.backupInterval || 24));
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const maxBackups = Math.max(1, Number(settings.maxBackups || 10));

    await fs.mkdir(backupsDir, { recursive: true });

    const servers = await lifecycle().listServers();
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

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  getSystemInfo,
  getServerUsage,
  getAllServersUsage,
  getServersDiskUsage,
  startUsageRefreshLoop,
  formatBackupTimestamp,
  startAutoBackupLoop,
};
