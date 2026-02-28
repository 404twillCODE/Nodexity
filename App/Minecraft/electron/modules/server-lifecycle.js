/**
 * Server lifecycle: process management, create, start, stop, delete, list, import.
 */
const { spawn, execSync, execFile } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const net = require('net');

const config = require('./config');
const downloads = require('./downloads');

const serverProcesses = new Map();
const cpuUsageTracking = new Map();
const playerCountFromStream = new Map();
const serverOutputBuffer = new Map();

// Cache for PID liveness to avoid blocking tasklist/ps calls when multiple servers are polled
const pidAliveCache = new Map(); // pid -> { alive: boolean, ts: number }
const PID_ALIVE_CACHE_TTL_MS = 1600;

function checkPidAliveWindows(pid) {
  try {
    const result = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000
    });
    return result.trim().includes(pid.toString());
  } catch (error) {
    return false;
  }
}

// Async PID check (non-blocking) for use in listServers and usage refresh; uses cache to avoid repeated tasklist/ps
async function isPidAliveAsync(pid) {
  if (!pid) return false;
  const now = Date.now();
  const cached = pidAliveCache.get(pid);
  if (cached && now - cached.ts < PID_ALIVE_CACHE_TTL_MS) {
    return cached.alive;
  }
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
        child.on('close', (code) => {
          resolve(code === 0 && out.trim().includes(pid.toString()));
        });
        setTimeout(() => {
          if (!child.killed) {
            child.kill();
            resolve(false);
          }
        }, 2500);
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
  const configs = await config.loadServerConfigs();
  const usedPorts = new Set(
    Object.values(configs)
      .map((c) => Number(c?.port))
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

// Sync PID check; uses cache when available to avoid blocking, otherwise falls back to tasklist (Windows)
function isPidAlive(pid) {
  if (!pid) return false;
  const now = Date.now();
  const cached = pidAliveCache.get(pid);
  if (cached && now - cached.ts < PID_ALIVE_CACHE_TTL_MS) {
    return cached.alive;
  }
  try {
    if (os.platform() === 'win32') {
      const alive = checkPidAliveWindows(pid);
      pidAliveCache.set(pid, { alive, ts: now });
      return alive;
    }
    try {
      process.kill(pid, 0);
      pidAliveCache.set(pid, { alive: true, ts: now });
      return true;
    } catch (error) {
      pidAliveCache.set(pid, { alive: false, ts: now });
      return false;
    }
  } catch (error) {
    pidAliveCache.set(pid, { alive: false, ts: now });
    return false;
  }
}

// Create server
async function createServer(serverName = 'default', serverType = 'paper', version = null, ramGB = null, port = null, manualJarPath = null, displayName = null) {
  try {
    await config.ensureDirectories();
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    await fs.mkdir(serverPath, { recursive: true });

    // Check if server already exists
    const existingConfig = await config.getServerConfig(serverName);
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
          selectedVersion = version || await downloads.getLatestPaperVersion();
          build = await downloads.getLatestPaperBuild(selectedVersion);
          jarPath = await downloads.downloadPaper(serverPath, selectedVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        case 'spigot':
          selectedVersion = version || '1.20.4';
          jarPath = await downloads.downloadSpigot(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'vanilla':
          selectedVersion = version || (await downloads.getVanillaVersions())[0];
          jarPath = await downloads.downloadVanilla(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'fabric':
          selectedVersion = version || (await downloads.getFabricVersions())[0];
          jarPath = await downloads.downloadFabric(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'forge':
          selectedVersion = version || (await downloads.getForgeVersions())[0];
          jarPath = await downloads.downloadForge(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'velocity':
          const velocityVersions = await downloads.getVelocityVersions();
          const mcVersion = version || velocityVersions[0];
          // Convert Minecraft version to Velocity version number
          const velocityVersion = await downloads.getVelocityVersionForMC(mcVersion);
          selectedVersion = mcVersion; // Store MC version for display
          build = await downloads.getVelocityBuild(velocityVersion);
          jarPath = await downloads.downloadVelocity(serverPath, velocityVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        case 'waterfall':
          const waterfallVersions = await downloads.getWaterfallVersions();
          selectedVersion = version || waterfallVersions[0];
          build = await downloads.getWaterfallBuild(selectedVersion);
          jarPath = await downloads.downloadWaterfall(serverPath, selectedVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        case 'bungeecord':
          const bungeeVersions = await downloads.getBungeeCordVersions();
          selectedVersion = version || bungeeVersions[0];
          jarPath = await downloads.downloadBungeeCord(serverPath, selectedVersion);
          jarFile = path.basename(jarPath);
          break;
        
        case 'purpur':
          const purpurVersions = await downloads.getPurpurVersions();
          selectedVersion = version || purpurVersions[0];
          build = await downloads.getPurpurBuild(selectedVersion);
          jarPath = await downloads.downloadPurpur(serverPath, selectedVersion, build);
          jarFile = path.basename(jarPath);
          break;
        
        default:
          throw new Error(`Unsupported server type: ${serverType}`);
      }
    }

    const serverRAM = config.normalizeRamGB(ramGB, settings.defaultRAM || 4);
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
    await config.saveServerConfig(serverName, {
      serverType: serverType,
      version: selectedVersion,
      ramGB: serverRAM,
      status: 'STOPPED',
      port: serverPort,
      displayName: displayName || serverName, // Store display name if provided
      jarFile // Store jar path for Fabric (may be in .fabric/server/)
    });

    return { success: true, path: serverPath, jarFile, version: selectedVersion, build };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Start server
async function startServer(serverName, ramGB = null) {
  try {
    // Get custom servers directory from settings, or use default
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    
    // Check if server directory exists
    try {
      await fs.access(serverPath);
    } catch {
      return { success: false, error: 'Server directory not found. Please create the server first.' };
    }
    
    // Find server jar - use config jarFile (Fabric may be in .fabric/server/), else scan root
    const serverConfig = await config.getServerConfig(serverName);
    let jarFile = serverConfig?.jarFile;
    if (!jarFile) {
      const files = await fs.readdir(serverPath);
      jarFile = files.find(f => f.endsWith('.jar') && !f.toLowerCase().includes('fabric-installer'));
    }
    const jarPath = path.isAbsolute(jarFile) ? jarFile : path.join(serverPath, jarFile);
    try {
      await fs.access(jarPath);
    } catch {
      return { success: false, error: 'Server jar not found. Please create the server first.' };
    }

    // Check if already running
    if (serverConfig?.pid && isPidAlive(serverConfig.pid)) {
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
        clearPlayerCountStream(serverName);
      }
    }

    // Get RAM from config or use provided/default
    if (serverConfig?.pid && !isPidAlive(serverConfig.pid)) {
      await config.saveServerConfig(serverName, { ...serverConfig, pid: undefined, status: 'STOPPED' });
    }
    const serverRAM = config.normalizeRamGB(ramGB, serverConfig?.ramGB || 4);
    
    // Update status to STARTING
    await config.saveServerConfig(serverName, {
      ...serverConfig,
      status: 'STARTING',
      ramGB: serverRAM
    });

    const ramMB = serverRAM * 1024;
    // Fabric jar in .fabric/server/ must run with cwd = that directory for classpath
    const runCwd = path.dirname(jarPath);
    
    const javaProcess = spawn('java', [
      `-Xms${ramMB}M`,
      `-Xmx${ramMB}M`,
      '-jar',
      jarPath,
      'nogui'
    ], {
      cwd: runCwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverProcesses.set(serverName, javaProcess);

    // Handle process events
    javaProcess.on('exit', async (code) => {
      serverProcesses.delete(serverName);
      cpuUsageTracking.delete(serverName);
      clearPlayerCountStream(serverName);
      const currentConfig = await config.getServerConfig(serverName);
      if (currentConfig) {
        await config.saveServerConfig(serverName, {
          ...currentConfig,
          status: 'STOPPED',
          pid: undefined
        });
      }
    });

    javaProcess.on('error', async (error) => {
      serverProcesses.delete(serverName);
      cpuUsageTracking.delete(serverName);
      clearPlayerCountStream(serverName);
      const currentConfig = await config.getServerConfig(serverName);
      if (currentConfig) {
        await config.saveServerConfig(serverName, {
          ...currentConfig,
          status: 'STOPPED',
          pid: undefined
        });
      }
    });

    await config.saveServerConfig(serverName, {
      ...serverConfig,
      status: 'STARTING',
      ramGB: serverRAM,
      pid: javaProcess.pid
    });

    // Update status to RUNNING after a short delay (server is starting)
    setTimeout(async () => {
      if (serverProcesses.has(serverName)) {
        const currentConfig = await config.getServerConfig(serverName);
        if (currentConfig) {
          await config.saveServerConfig(serverName, {
            ...currentConfig,
            status: 'RUNNING'
          });
        }
      }
    }, 2000);

    return { success: true, pid: javaProcess.pid };
  } catch (error) {
    // Update status to STOPPED on error
    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig) {
      await config.saveServerConfig(serverName, {
        ...serverConfig,
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
      const serverConfig = await config.getServerConfig(serverName);
      if (serverConfig?.pid && isPidAlive(serverConfig.pid)) {
        killProcessTree(serverConfig.pid);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      if (serverConfig && serverConfig.status !== 'STOPPED') {
        await config.saveServerConfig(serverName, {
          ...serverConfig,
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
    clearPlayerCountStream(serverName);

    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig) {
      await config.saveServerConfig(serverName, {
        ...serverConfig,
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
      clearPlayerCountStream(serverName);
    }

    // Get server directory
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);

    // Check if directory exists
    try {
      await fs.access(serverPath);
    } catch {
      // Directory doesn't exist, just remove from config
      const configs = await config.loadServerConfigs();
      delete configs[serverName];
      await config.saveServerConfigs(configs);
      return { success: true };
    }

    // Delete server directory and all contents
    await fs.rm(serverPath, { recursive: true, force: true });

    // Remove from config
    const configs = await config.loadServerConfigs();
    delete configs[serverName];
    await config.saveServerConfigs(configs);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

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
      const serverConfig = await config.getServerConfig(serverName);
      if (serverConfig?.pid && isPidAlive(serverConfig.pid)) {
        killProcessTree(serverConfig.pid);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (serverConfig && serverConfig.status !== 'STOPPED') {
        await config.saveServerConfig(serverName, {
          ...serverConfig,
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
    cpuUsageTracking.delete(serverName);
    clearPlayerCountStream(serverName);

    // Update status
    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig) {
      await config.saveServerConfig(serverName, {
        ...serverConfig,
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
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
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

// Read max-players from server.properties
async function getMaxPlayersFromProps(serverPath) {
  try {
    const propsPath = path.join(serverPath, 'server.properties');
    const propsContent = await fs.readFile(propsPath, 'utf8');
    const maxMatch = propsContent.match(/max-players=(\d+)/i);
    return maxMatch ? parseInt(maxMatch[1]) : 20;
  } catch {
    return 20;
  }
}

// Strip ANSI escape codes and Minecraft § formatting so regex can match
function stripFormatting(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/§./g, '')
    .trim();
}

// Parse a line of server output for "There are X of a max of Y players online"
function parsePlayerCountLine(line) {
  const raw = stripFormatting(line);
  const m1 = raw.match(/There are (\d+) of a max of (\d+) players? online/i);
  if (m1) return { online: parseInt(m1[1]), max: parseInt(m1[2]) };
  const m2 = raw.match(/(\d+) of a max of (\d+) players? online/i);
  if (m2) return { online: parseInt(m2[1]), max: parseInt(m2[2]) };
  const m3 = raw.match(/(\d+)\s*\/\s*(\d+)\s*players? online/i);
  if (m3) return { online: parseInt(m3[1]), max: parseInt(m3[2]) };
  const m4 = raw.match(/players? online[:\s]*(\d+)\s*\/\s*(\d+)/i);
  if (m4) return { online: parseInt(m4[1]), max: parseInt(m4[2]) };
  return null;
}

// Feed server stdout/stderr (same stream as console). Updates player count when we see the list response.
function feedServerOutput(serverName, data) {
  if (!serverName || typeof data !== 'string') return;
  let buf = serverOutputBuffer.get(serverName) || '';
  buf += data;
  const lines = buf.split(/\r?\n/);
  serverOutputBuffer.set(serverName, lines.pop() ?? '');
  for (const line of lines) {
    const parsed = parsePlayerCountLine(line);
    if (parsed) {
      playerCountFromStream.set(serverName, { online: parsed.online, max: parsed.max });
    }
  }
}

function clearPlayerCountStream(serverName) {
  playerCountFromStream.delete(serverName);
  serverOutputBuffer.delete(serverName);
}

// Get player count: send "list", then read from stream cache or fallback to latest.log (server often writes list output to log only).
async function getPlayerCount(serverName) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    const logPath = path.join(serverPath, 'logs', 'latest.log');

    const maxFromProps = await getMaxPlayersFromProps(serverPath);

    if (!serverProcesses.has(serverName)) {
      return { success: true, online: 0, max: maxFromProps };
    }

    const process = serverProcesses.get(serverName);
    if (process && process.stdin && process.stdin.writable) {
      process.stdin.write('list\n');
      await new Promise((r) => setTimeout(r, 1200));
    }

    const cached = playerCountFromStream.get(serverName);
    if (cached) {
      return { success: true, online: cached.online, max: cached.max };
    }

    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.split(/\r?\n/).filter((l) => l.trim());
      const start = Math.max(0, lines.length - 30);
      for (let i = lines.length - 1; i >= start; i--) {
        const parsed = parsePlayerCountLine(lines[i]);
        if (parsed) {
          return { success: true, online: parsed.online, max: parsed.max };
        }
      }
    } catch (err) {
      // Log file missing or unreadable
    }

    return { success: true, online: 0, max: maxFromProps };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// List servers (batches PID liveness checks to avoid blocking when many servers exist)
async function listServers() {
  try {
    await config.ensureDirectories();
    const configs = await config.loadServerConfigs();
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverDirs = await fs.readdir(serversDir);

    // Build list of server entries and collect PIDs to check in one batch (non-blocking)
    const entries = [];
    const pidsToCheck = new Set();
    for (const serverName of serverDirs) {
      const serverPath = path.join(serversDir, serverName);
      let stat;
      try {
        stat = await fs.stat(serverPath);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;
      let files;
      try {
        files = await fs.readdir(serverPath);
      } catch {
        continue;
      }
      const jarFile = files.find(f => f.endsWith('.jar'));
      if (!jarFile) continue;
      const serverConfig = configs[serverName];
      if (serverConfig?.pid) pidsToCheck.add(serverConfig.pid);
      entries.push({ serverName, serverPath, files, jarFile, serverConfig });
    }

    const pidAliveMap = new Map();
    await Promise.all(
      Array.from(pidsToCheck).map(async (pid) => {
        const alive = await isPidAliveAsync(pid);
        pidAliveMap.set(pid, alive);
      })
    );

    const serverList = [];
    for (const { serverName, serverPath, jarFile, serverConfig } of entries) {
      let isRunning = serverProcesses.has(serverName);
      if (!isRunning && serverConfig?.pid && pidAliveMap.get(serverConfig.pid)) {
        isRunning = true;
      }

      let status = 'STOPPED';
      if (isRunning) {
        const proc = serverProcesses.get(serverName);
        if (proc && isProcessAlive(proc)) {
          status = 'RUNNING';
        } else {
          serverProcesses.delete(serverName);
          cpuUsageTracking.delete(serverName);
          clearPlayerCountStream(serverName);
          status = 'STOPPED';
          if (serverConfig) {
            await config.saveServerConfig(serverName, {
              ...serverConfig,
              status: 'STOPPED',
              pid: undefined
            });
          }
        }
      } else if (serverConfig?.pid && !pidAliveMap.get(serverConfig.pid)) {
        await config.saveServerConfig(serverName, {
          ...serverConfig,
          status: 'STOPPED',
          pid: undefined
        });
      } else if (serverConfig?.status === 'STARTING') {
        status = 'STARTING';
      } else if (serverConfig) {
        status = serverConfig.status || 'STOPPED';
      }

      if (serverConfig?.status === 'RUNNING' && !isRunning) {
        status = 'STOPPED';
        await config.saveServerConfig(serverName, {
          ...serverConfig,
          status: 'STOPPED',
          pid: undefined
        });
      }

      let version = 'unknown';
      if (serverConfig?.version) {
        version = serverConfig.version;
      } else {
        const versionMatch = jarFile.match(/(?:paper|spigot|velocity|waterfall|bungeecord|server|fabric|forge)-?(\d+\.\d+(?:\.\d+)?)/i);
        if (versionMatch) {
          version = versionMatch[1];
        } else if (jarFile.includes('manual') || jarFile.includes('custom')) {
          version = 'manual';
        }
      }

      if (!serverConfig) {
        const configStatus = status === 'RUNNING' ? 'STOPPED' : status;
        await config.saveServerConfig(serverName, {
          version,
          ramGB: 4,
          status: configStatus,
          port: 25565
        });
      } else if (status === 'RUNNING' && serverConfig.status !== 'RUNNING') {
        await config.saveServerConfig(serverName, {
          ...serverConfig,
          status: 'RUNNING'
        });
      }

      serverList.push({
        id: serverName,
        name: serverConfig?.name || serverConfig?.displayName || serverName,
        version,
        status,
        port: serverConfig?.port || 25565,
        ramGB: serverConfig?.ramGB || 4,
        serverType: serverConfig?.serverType || 'paper',
      });
    }

    return serverList;
  } catch (error) {
    return [];
  }
}

// Update server RAM
async function updateServerRAM(serverName, ramGB) {
  try {
    const serverConfig = await config.getServerConfig(serverName);
    if (!serverConfig) {
      return { success: false, error: 'Server not found' };
    }
    await config.saveServerConfig(serverName, {
      ...serverConfig,
      ramGB
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Import an existing server folder into the managed servers directory
async function importServer(sourceFolderPath, serverName) {
  try {
    await config.ensureDirectories();
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const targetPath = path.join(serversDir, serverName);

    // Check if a server with this name already exists
    try {
      await fs.access(targetPath);
      return { success: false, error: `A server named "${serverName}" already exists.` };
    } catch {
      // Target doesn't exist, good to proceed
    }

    // Verify source folder exists
    try {
      await fs.access(sourceFolderPath);
    } catch {
      return { success: false, error: 'Source folder does not exist.' };
    }

    // Copy the source folder to the servers directory
    await fs.cp(sourceFolderPath, targetPath, { recursive: true });

    // Detect server type and version from jar files
    const files = await fs.readdir(targetPath);
    const jarFile = files.find(f => f.endsWith('.jar'));
    let serverType = 'manual';
    let version = 'unknown';

    if (jarFile) {
      const jarName = jarFile.toLowerCase();
      const typePatterns = [
        ['paper', 'paper'], ['spigot', 'spigot'], ['purpur', 'purpur'],
        ['velocity', 'velocity'], ['waterfall', 'waterfall'], ['bungeecord', 'bungeecord'],
        ['fabric', 'fabric'], ['forge', 'forge']
      ];
      for (const [pattern, type] of typePatterns) {
        if (jarName.includes(pattern)) {
          serverType = type;
          break;
        }
      }
      const versionMatch = jarFile.match(/(\d+\.\d+(?:\.\d+)?)/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    }

    // Read port from server.properties if it exists
    let port = settings.defaultPort || 25565;
    try {
      const propsContent = await fs.readFile(path.join(targetPath, 'server.properties'), 'utf8');
      const portMatch = propsContent.match(/^server-port=(\d+)/m);
      if (portMatch) {
        port = parseInt(portMatch[1], 10);
      }
    } catch {
      // No server.properties, use default
    }

    // Save server config
    await config.saveServerConfig(serverName, {
      serverType,
      version,
      ramGB: settings.defaultRAM || 4,
      status: 'STOPPED',
      port,
      displayName: serverName
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  serverProcesses,
  cpuUsageTracking,
  isPortAvailable,
  findAvailablePort,
  checkJava,
  waitForProcessExit,
  killProcessTree,
  isProcessAlive,
  isPidAlive,
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
};
