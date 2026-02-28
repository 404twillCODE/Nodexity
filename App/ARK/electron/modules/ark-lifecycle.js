/**
 * ARK server lifecycle: create instance, start/stop ShooterGameServer, list, logs, import.
 */
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const net = require('net');

const config = require('./config');

const serverProcesses = new Map();
const serverOutputBuffer = new Map();
const pidAliveCache = new Map();
const PID_ALIVE_CACHE_TTL_MS = 1600;

const ARK_MAPS = ['TheIsland', 'TheCenter', 'Ragnarok', 'ScorchedEarth_P', 'Valguero', 'CrystalIsles', 'LostIsland', 'Fjordur', 'Gen2'];

function getArkExePath(arkInstallPath) {
  if (!arkInstallPath || !arkInstallPath.trim()) return null;
  const exe = path.join(arkInstallPath.trim(), 'ShooterGame', 'Binaries', 'Win64', 'ShooterGameServer.exe');
  return exe;
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      resolve(false);
      return;
    }
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => { tester.close(() => resolve(true)); })
      .listen(port, '0.0.0.0');
    tester.unref();
  });
}

async function findAvailablePort(startPort, maxAttempts = 50) {
  let port = Number(startPort);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) port = 7777;
  const configs = await config.loadServerConfigs();
  const usedPorts = new Set(
    Object.values(configs).filter(c => c && !String(c).startsWith('_')).map((c) => Number(c?.port)).filter((v) => Number.isInteger(v))
  );
  for (let i = 0; i < maxAttempts; i += 1) {
    const currentPort = port + i;
    if (currentPort > 65535) break;
    const available = await isPortAvailable(currentPort);
    if (available && !usedPorts.has(currentPort)) return currentPort;
  }
  return null;
}

async function isPidAliveAsync(pid) {
  if (!pid) return false;
  const now = Date.now();
  const cached = pidAliveCache.get(pid);
  if (cached && now - cached.ts < PID_ALIVE_CACHE_TTL_MS) return cached.alive;
  let alive = false;
  try {
    if (os.platform() === 'win32') {
      alive = await new Promise((resolve) => {
        const child = spawn('cmd', ['/c', 'tasklist', '/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true
        });
        let out = '';
        child.stdout.on('data', (chunk) => { out += chunk.toString(); });
        child.on('error', () => resolve(false));
        child.on('close', (code) => { resolve(code === 0 && out.trim().includes(pid.toString())); });
        setTimeout(() => { if (!child.killed) child.kill(); resolve(false); }, 2500);
      });
    } else {
      try {
        process.kill(pid, 0);
        alive = true;
      } catch (err) {
        alive = false;
      }
    }
  } catch (error) {
    alive = false;
  }
  pidAliveCache.set(pid, { alive, ts: now });
  return alive;
}

function killProcessTree(pid) {
  try {
    if (os.platform() === 'win32') {
      const { execSync } = require('child_process');
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: ['ignore', 'pipe', 'ignore'] });
      return;
    }
  } catch (error) {
    // fall through
  }
  try {
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    // ignore
  }
}

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

// ARK: no Java; return a stub so UI doesn't break
async function checkJava() {
  return { installed: true, version: 'N/A (ARK)' };
}

// Create ARK server instance folder with Saved/Config/WindowsServer/ INI files.
// serverType = map name, displayName = session name, port = game port.
async function createServer(serverName = 'default', serverType = 'TheIsland', version = null, ramGB = null, port = null, _manualJarPath = null, displayName = null) {
  try {
    await config.ensureDirectories();
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);

    const existing = await config.getServerConfig(serverName);
    if (existing) {
      try {
        await fs.access(serverPath);
        return { success: true, path: serverPath, message: 'Server already exists' };
      } catch {
        // config exists but folder missing, recreate
      }
    }

    const map = ARK_MAPS.includes(serverType) ? serverType : 'TheIsland';
    const sessionName = (displayName || serverName).replace(/[?\\/:*"<>|]/g, '_').trim() || serverName;
    const gamePort = Number(port) || settings.defaultPort || 7777;
    const queryPort = Number(settings.defaultQueryPort) || 27015;

    await fs.mkdir(serverPath, { recursive: true });
    const configDir = path.join(serverPath, 'Saved', 'Config', 'WindowsServer');
    await fs.mkdir(configDir, { recursive: true });

    const gameUserSettings = `[ServerSettings]
SessionName=${sessionName}
Port=${gamePort}
QueryPort=${queryPort}
MaxPlayers=70
ServerAdminPassword=
ServerPassword=
`;
    const gameIni = `[/Script/ShooterGame.ShooterGameMode]
`;
    await fs.writeFile(path.join(configDir, 'GameUserSettings.ini'), gameUserSettings, 'utf8');
    await fs.writeFile(path.join(configDir, 'Game.ini'), gameIni, 'utf8');

    await config.saveServerConfig(serverName, {
      serverType: map,
      map,
      sessionName,
      version: 'ARK',
      ramGB: config.normalizeRamGB(ramGB, 4),
      status: 'STOPPED',
      port: gamePort,
      queryPort,
      displayName: sessionName,
      path: serverPath
    });

    return { success: true, path: serverPath, version: 'ARK' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function startServer(serverName, _ramGB = null) {
  try {
    const settings = await config.getAppSettings();
    const arkInstallPath = settings.arkInstallPath || '';
    const exePath = getArkExePath(arkInstallPath);
    if (!exePath) {
      return { success: false, error: 'ARK install path not set. Set it in Settings.' };
    }
    try {
      await fs.access(exePath);
    } catch {
      return { success: false, error: `ShooterGameServer.exe not found at ${exePath}. Install ARK Dedicated Server or set the correct path in Settings.` };
    }

    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    try {
      await fs.access(serverPath);
    } catch {
      return { success: false, error: 'Server directory not found. Create the server first.' };
    }

    const serverConfig = await config.getServerConfig(serverName);
    if (serverProcesses.has(serverName)) {
      const proc = serverProcesses.get(serverName);
      if (proc && !proc.killed && proc.pid) return { success: false, error: 'Server is already running' };
      serverProcesses.delete(serverName);
    }
    if (serverConfig?.pid && await isPidAliveAsync(serverConfig.pid)) {
      return { success: false, error: 'Server is already running' };
    }

    const map = serverConfig?.map || 'TheIsland';
    const sessionName = (serverConfig?.sessionName || serverName).replace(/[?\\/:*"<>|]/g, '_');
    const port = serverConfig?.port ?? 7777;
    const queryPort = serverConfig?.queryPort ?? 27015;
    const configPath = path.resolve(serverPath);

    await config.saveServerConfig(serverName, { ...serverConfig, status: 'STARTING' });

    const args = [
      `${map}?listen?SessionName=${sessionName}?Port=${port}?QueryPort=${queryPort}`,
      `-configpath=${configPath}`
    ];
    const proc = spawn(exePath, args, {
      cwd: path.dirname(exePath),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverProcesses.set(serverName, proc);
    proc.on('exit', async (code) => {
      serverProcesses.delete(serverName);
      serverOutputBuffer.delete(serverName);
      const cfg = await config.getServerConfig(serverName);
      if (cfg) await config.saveServerConfig(serverName, { ...cfg, status: 'STOPPED', pid: undefined });
    });
    proc.on('error', async (err) => {
      serverProcesses.delete(serverName);
      serverOutputBuffer.delete(serverName);
      const cfg = await config.getServerConfig(serverName);
      if (cfg) await config.saveServerConfig(serverName, { ...cfg, status: 'STOPPED', pid: undefined });
    });

    await config.saveServerConfig(serverName, { ...serverConfig, status: 'RUNNING', pid: proc.pid });
    return { success: true, pid: proc.pid };
  } catch (error) {
    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig) await config.saveServerConfig(serverName, { ...serverConfig, status: 'STOPPED' });
    return { success: false, error: error.message };
  }
}

async function stopServer(serverName) {
  try {
    const process = serverProcesses.get(serverName);
    if (!process) {
      const serverConfig = await config.getServerConfig(serverName);
      if (serverConfig?.pid && await isPidAliveAsync(serverConfig.pid)) {
        killProcessTree(serverConfig.pid);
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (serverConfig && serverConfig.status !== 'STOPPED') {
        await config.saveServerConfig(serverName, { ...serverConfig, status: 'STOPPED', pid: undefined });
      }
      return { success: true };
    }
    try {
      if (process.stdin && process.stdin.writable) process.stdin.write('quit\n');
    } catch (err) {
      // ignore
    }
    const exited = await waitForProcessExit(process, 15000);
    if (!exited) killProcessTree(process.pid);
    serverProcesses.delete(serverName);
    serverOutputBuffer.delete(serverName);
    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig) await config.saveServerConfig(serverName, { ...serverConfig, status: 'STOPPED', pid: undefined });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getServerProcess(serverName) {
  return serverProcesses.get(serverName);
}

async function killServer(serverName) {
  try {
    const process = serverProcesses.get(serverName);
    if (!process) {
      const serverConfig = await config.getServerConfig(serverName);
      if (serverConfig?.pid) killProcessTree(serverConfig.pid);
      if (serverConfig) await config.saveServerConfig(serverName, { ...serverConfig, status: 'STOPPED', pid: undefined });
      return { success: true };
    }
    killProcessTree(process.pid);
    await waitForProcessExit(process, 5000);
    serverProcesses.delete(serverName);
    serverOutputBuffer.delete(serverName);
    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig) await config.saveServerConfig(serverName, { ...serverConfig, status: 'STOPPED', pid: undefined });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function restartServer(serverName, ramGB = null) {
  const stopResult = await stopServer(serverName);
  if (!stopResult.success) return { success: false, error: stopResult.error };
  await new Promise((r) => setTimeout(r, 2000));
  return startServer(serverName, ramGB);
}

async function deleteServer(serverName) {
  try {
    if (serverProcesses.has(serverName)) {
      const process = serverProcesses.get(serverName);
      if (process && !process.killed) killProcessTree(process.pid);
      serverProcesses.delete(serverName);
      serverOutputBuffer.delete(serverName);
    }
    const settings = await config.getAppSettings();
    const serverPath = path.join(settings.serversDirectory || config.SERVERS_DIR, serverName);
    try {
      await fs.rm(serverPath, { recursive: true, force: true });
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    const configs = await config.loadServerConfigs();
    delete configs[serverName];
    await config.saveServerConfigs(configs);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function feedServerOutput(serverName, data) {
  if (!serverName || typeof data !== 'string') return;
  let buf = serverOutputBuffer.get(serverName) || '';
  buf += data;
  const lines = buf.split(/\r?\n/);
  serverOutputBuffer.set(serverName, lines.pop() ?? '');
}

async function getServerLogs(serverName, maxLines = 1000) {
  try {
    let lines = [];
    const buf = serverOutputBuffer.get(serverName);
    if (buf) lines = buf.split(/\r?\n/).filter((l) => l.trim());
    const settings = await config.getAppSettings();
    const serverPath = path.join(settings.serversDirectory || config.SERVERS_DIR, serverName);
    const logPath = path.join(serverPath, 'Saved', 'Logs', 'ShooterGame.log');
    try {
      const content = await fs.readFile(logPath, 'utf8');
      const fileLines = content.split(/\r?\n/).filter((l) => l.trim());
      lines = fileLines.slice(-maxLines);
    } catch (err) {
      if (lines.length === 0) return { success: true, lines: [] };
    }
    return { success: true, lines: lines.slice(-maxLines) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getPlayerCount(serverName) {
  return { success: true, online: 0, max: 70 };
}

async function listServers() {
  try {
    await config.ensureDirectories();
    const configs = await config.loadServerConfigs();
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    let serverDirs = [];
    try {
      serverDirs = await fs.readdir(serversDir);
    } catch (err) {
      return [];
    }

    const entries = [];
    const pidsToCheck = new Set();
    for (const serverName of serverDirs) {
      if (serverName.startsWith('.')) continue;
      const serverPath = path.join(serversDir, serverName);
      let stat;
      try {
        stat = await fs.stat(serverPath);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;
      const serverConfig = configs[serverName];
      if (serverConfig?.pid) pidsToCheck.add(serverConfig.pid);
      entries.push({ serverName, serverPath, serverConfig });
    }

    const pidAliveMap = new Map();
    await Promise.all(Array.from(pidsToCheck).map(async (pid) => {
      pidAliveMap.set(pid, await isPidAliveAsync(pid));
    }));

    const serverList = [];
    for (const { serverName, serverPath, serverConfig } of entries) {
      let isRunning = serverProcesses.has(serverName);
      if (!isRunning && serverConfig?.pid && pidAliveMap.get(serverConfig.pid)) isRunning = true;

      let status = 'STOPPED';
      if (isRunning) {
        const proc = serverProcesses.get(serverName);
        if (proc && !proc.killed && proc.pid) status = 'RUNNING';
        else {
          serverProcesses.delete(serverName);
          serverOutputBuffer.delete(serverName);
          status = 'STOPPED';
          if (serverConfig) await config.saveServerConfig(serverName, { ...serverConfig, status: 'STOPPED', pid: undefined });
        }
      } else if (serverConfig?.pid && !pidAliveMap.get(serverConfig.pid)) {
        if (serverConfig) await config.saveServerConfig(serverName, { ...serverConfig, status: 'STOPPED', pid: undefined });
      } else if (serverConfig?.status === 'STARTING') {
        status = 'STARTING';
      } else if (serverConfig) {
        status = serverConfig.status || 'STOPPED';
      }

      if (!serverConfig) {
        await config.saveServerConfig(serverName, {
          version: 'ARK',
          ramGB: 4,
          status: status,
          port: settings.defaultPort || 7777,
          queryPort: settings.defaultQueryPort || 27015,
          map: 'TheIsland',
          sessionName: serverName
        });
      }

      serverList.push({
        id: serverName,
        name: serverConfig?.sessionName || serverConfig?.displayName || serverConfig?.name || serverName,
        version: serverConfig?.version || 'ARK',
        status,
        port: serverConfig?.port || 7777,
        ramGB: serverConfig?.ramGB || 4,
        serverType: serverConfig?.map || serverConfig?.serverType || 'TheIsland'
      });
    }
    return serverList;
  } catch (error) {
    return [];
  }
}

async function updateServerRAM(serverName, ramGB) {
  try {
    const serverConfig = await config.getServerConfig(serverName);
    if (!serverConfig) return { success: false, error: 'Server not found' };
    await config.saveServerConfig(serverName, { ...serverConfig, ramGB });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function importServer(sourceFolderPath, serverName) {
  try {
    await config.ensureDirectories();
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const targetPath = path.join(serversDir, serverName);
    try {
      await fs.access(targetPath);
      return { success: false, error: `A server named "${serverName}" already exists.` };
    } catch {
      // ok
    }
    try {
      await fs.access(sourceFolderPath);
    } catch {
      return { success: false, error: 'Source folder does not exist.' };
    }
    await fs.cp(sourceFolderPath, targetPath, { recursive: true });
    let port = settings.defaultPort || 7777;
    let queryPort = settings.defaultQueryPort || 27015;
    const iniPath = path.join(targetPath, 'Saved', 'Config', 'WindowsServer', 'GameUserSettings.ini');
    try {
      const content = await fs.readFile(iniPath, 'utf8');
      const portM = content.match(/Port=(\d+)/);
      const qM = content.match(/QueryPort=(\d+)/);
      if (portM) port = parseInt(portM[1], 10);
      if (qM) queryPort = parseInt(qM[1], 10);
    } catch (err) {
      // use defaults
    }
    await config.saveServerConfig(serverName, {
      version: 'ARK',
      ramGB: 4,
      status: 'STOPPED',
      port,
      queryPort,
      map: 'TheIsland',
      sessionName: serverName,
      displayName: serverName,
      path: targetPath
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  serverProcesses,
  isPortAvailable,
  findAvailablePort,
  checkJava,
  waitForProcessExit,
  killProcessTree,
  createServer,
  startServer,
  stopServer,
  restartServer,
  killServer,
  getServerProcess,
  deleteServer,
  listServers,
  updateServerRAM,
  getServerLogs,
  getPlayerCount,
  feedServerOutput,
  importServer,
  ARK_MAPS,
};
