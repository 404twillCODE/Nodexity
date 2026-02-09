/**
 * playitManager.js – Manages playit.gg agent per server (one agent process per server).
 * Runs the official playit-agent binary as a hidden subprocess; secret via env (never CLI).
 * Cross-platform: Windows (hidden console), macOS, Linux.
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const https = require('https');
const crypto = require('crypto');

// Lazy load serverManager to avoid circular dependency; use getServerConfig when needed
let _getServerConfig = null;
function getServerConfig(serverName) {
  if (!_getServerConfig) {
    const sm = require('./serverManager');
    _getServerConfig = sm.getServerConfig;
  }
  return _getServerConfig(serverName);
}

function getAppDataPath() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', '.hexnode');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', '.hexnode');
  }
  return path.join(os.homedir(), '.hexnode');
}

const APP_DATA = getAppDataPath();
const PLAYIT_ROOT = path.join(APP_DATA, 'playit');
const PLAYIT_BIN_DIR = path.join(PLAYIT_ROOT, 'bin');
const PLAYIT_SECRETS_FILE = path.join(PLAYIT_ROOT, 'secrets.enc');

// In-memory state per server: { process, logCallbacks, status }
const agents = new Map();

// Encryption for fallback secret storage (best-effort; keytar preferred when available)
const ENCRYPT_ALGO = 'aes-256-gcm';
const SALT_LEN = 16;
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

function deriveKey(salt) {
  const base = process.env.NODEXITY_PLAYIT_KEY || os.hostname() + os.userInfo().username + 'nodexity-playit';
  return crypto.pbkdf2Sync(base, salt, 100000, KEY_LEN, 'sha256');
}

async function loadEncryptedSecrets() {
  try {
    const raw = await fs.readFile(PLAYIT_SECRETS_FILE);
    const salt = raw.slice(0, SALT_LEN);
    const iv = raw.slice(SALT_LEN, SALT_LEN + IV_LEN);
    const tag = raw.slice(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
    const cipher = raw.slice(SALT_LEN + IV_LEN + TAG_LEN);
    const key = deriveKey(salt);
    const decipher = crypto.createDecipheriv(ENCRYPT_ALGO, key, iv);
    decipher.setAuthTag(tag);
    const str = Buffer.concat([decipher.update(cipher), decipher.final()]).toString('utf8');
    return JSON.parse(str);
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

async function saveEncryptedSecrets(obj) {
  await fs.mkdir(path.dirname(PLAYIT_SECRETS_FILE), { recursive: true });
  const salt = crypto.randomBytes(SALT_LEN);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ENCRYPT_ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  await fs.writeFile(PLAYIT_SECRETS_FILE, Buffer.concat([salt, iv, tag, enc]));
}

let keytar = null;
try {
  keytar = require('keytar');
} catch (e) {
  // keytar not installed or native module failed
}

const KEYTAR_SERVICE = 'Nodexity';
function keytarAccount(serverName) {
  return `playit-${serverName}`;
}

async function getStoredSecret(serverName) {
  if (keytar && typeof keytar.getPassword === 'function') {
    const secret = await keytar.getPassword(KEYTAR_SERVICE, keytarAccount(serverName));
    if (secret) return secret;
  }
  const secrets = await loadEncryptedSecrets();
  return secrets[serverName] || null;
}

async function setStoredSecret(serverName, secret) {
  if (keytar && typeof keytar.setPassword === 'function') {
    await keytar.setPassword(KEYTAR_SERVICE, keytarAccount(serverName), secret || '');
  }
  const secrets = await loadEncryptedSecrets();
  if (secret) secrets[serverName] = secret; else delete secrets[serverName];
  await saveEncryptedSecrets(secrets);
}

/** Check if playit secret is set (without returning it). */
async function hasPlayitSecret(serverName) {
  const s = await getStoredSecret(serverName);
  return !!s && s.length > 0;
}

/** Get download URL and binary name for current platform. */
function getPlayitAsset() {
  const platform = process.platform;
  const arch = process.arch;
  // GitHub release asset names: playit-linux-amd64, playit-linux-aarch64, playit-windows-x86_64.exe, etc.
  let name = null;
  if (platform === 'win32') {
    name = arch === 'x64' ? 'playit-windows-x86_64.exe' : 'playit-windows-x86.exe';
  } else if (platform === 'darwin') {
    // No official macOS binary; use Linux amd64 for Intel, aarch64 for Apple Silicon (may need Rosetta/experimental)
    name = arch === 'arm64' ? 'playit-linux-aarch64' : 'playit-linux-amd64';
  } else if (platform === 'linux') {
    if (arch === 'x64') name = 'playit-linux-amd64';
    else if (arch === 'arm64') name = 'playit-linux-aarch64';
    else if (arch === 'arm') name = 'playit-linux-armv7';
    else if (arch === 'ia32') name = 'playit-linux-i686';
    else name = 'playit-linux-amd64';
  }
  return name;
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Nodexity/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function ensurePlayitAgentInstalled(onProgress) {
  await fs.mkdir(PLAYIT_BIN_DIR, { recursive: true });
  const assetName = getPlayitAsset();
  if (!assetName) {
    throw new Error(`Unsupported platform: ${process.platform}/${process.arch}`);
  }
  const finalPath = path.join(PLAYIT_BIN_DIR, process.platform === 'win32' ? 'playit.exe' : 'playit');
  const exists = await fs.access(finalPath).then(() => true).catch(() => false);
  if (exists) {
    return { success: true, path: finalPath, alreadyInstalled: true };
  }

  if (onProgress) onProgress({ phase: 'fetching', message: 'Fetching latest playit-agent release...' });
  const release = await httpsGet('https://api.github.com/repos/playit-cloud/playit-agent/releases/latest');
  const tag = release.tag_name || 'v0.17.1';
  const assets = release.assets || [];
  const asset = assets.find((a) => a.name === assetName);
  if (!asset) {
    throw new Error(`No playit binary for ${process.platform}/${process.arch}. Asset name expected: ${assetName}`);
  }
  const downloadUrl = asset.browser_download_url;
  const downloadPath = path.join(PLAYIT_BIN_DIR, asset.name);

  const downloadPath = path.join(PLAYIT_BIN_DIR, asset.name);
  if (onProgress) onProgress({ phase: 'downloading', message: 'Downloading playit agent...' });
  await downloadFile(downloadUrl, downloadPath);
  try {
    await fs.rename(downloadPath, finalPath);
  } catch (e) {
    await fs.copyFile(downloadPath, finalPath);
    await fs.unlink(downloadPath).catch(() => {});
  }
  if (process.platform !== 'win32') {
    await fs.chmod(finalPath, 0o755);
  }
  if (onProgress) onProgress({ phase: 'done', message: 'Playit agent ready.' });
  return { success: true, path: finalPath, alreadyInstalled: false };
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filepath);
    https.get(url, { headers: { 'User-Agent': 'Nodexity/1.0' } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        require('fs').unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        require('fs').unlinkSync(filepath);
        reject(new Error(`Download failed: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
    }).on('error', (err) => {
      file.close();
      if (require('fs').existsSync(filepath)) require('fs').unlinkSync(filepath);
      reject(err);
    });
  });
}

/** Parse a line of playit output for connection status or public address. */
function parsePlayitLine(line, state) {
  const s = line.toString();
  if (/error|failed|invalid|unauthorized/i.test(s)) {
    state.lastError = s.trim();
  }
  // Common patterns: "Your connection: playit.gg:12345" or "tunnel at ..." or "Claim agent: https://..."
  const claimMatch = s.match(/https?:\/\/[^\s]+playit\.gg[^\s]*/i);
  if (claimMatch) state.claimUrl = claimMatch[0];
  const addrMatch = s.match(/(?:connection|address|connect to|playit\.gg)[:\s]+([^\s]+\.playit\.gg(?::\d+)?|[a-z0-9.-]+\.playit\.gg(?::\d+)?)/i)
    || s.match(/([a-z0-9.-]+\.playit\.gg(?::\d+)?)/i);
  if (addrMatch) state.publicAddress = addrMatch[1].trim();
  if (/connected|running|ready|listening/i.test(s)) state.connected = true;
}

function getAgentState(serverName) {
  let s = agents.get(serverName);
  if (!s) {
    s = { running: false, connected: false, publicAddress: null, lastError: null, claimUrl: null, logCallbacks: [] };
    agents.set(serverName, s);
  }
  return s;
}

function emitLog(serverName, line, type) {
  const state = getAgentState(serverName);
  state.logCallbacks.forEach((cb) => {
    try { cb(serverName, line, type); } catch (e) { /* ignore */ }
  });
}

async function startPlayit(serverName, options, mainWindow) {
  const state = getAgentState(serverName);
  if (state.process) {
    return { success: false, error: 'Playit agent is already running for this server.' };
  }
  const secret = await getStoredSecret(serverName);
  if (!secret || !secret.trim()) {
    return { success: false, error: 'No playit.gg secret key saved. Please add your secret key first.' };
  }

  const { path: agentPath } = await ensurePlayitAgentInstalled();
  const config = await getServerConfig(serverName);
  const localPort = config && config.port ? Number(config.port) : 25565;
  const cwd = path.join(PLAYIT_ROOT, 'servers', serverName);
  await fs.mkdir(cwd, { recursive: true });

  const env = { ...process.env, SECRET_KEY: secret };
  const spawnOpts = {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  };
  if (process.platform === 'win32') {
    spawnOpts.windowsHide = true;
    spawnOpts.creationFlags = 0x08000000; // CREATE_NO_WINDOW
  }

  const child = spawn(agentPath, [], spawnOpts);
  state.process = child;
  state.running = true;
  state.connected = false;
  state.publicAddress = null;
  state.lastError = null;
  state.claimUrl = null;

  const pushToRenderer = (line, type) => {
    emitLog(serverName, line, type);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('playit-log', { serverName, line, type });
    }
  };

  const onData = (data, type) => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    lines.forEach((line) => {
      parsePlayitLine(line, state);
      pushToRenderer(line, type);
    });
  };

  child.stdout.on('data', (data) => onData(data, 'stdout'));
  child.stderr.on('data', (data) => onData(data, 'stderr'));
  child.on('error', (err) => {
    state.lastError = err.message;
    state.running = false;
    state.process = null;
    pushToRenderer(`Process error: ${err.message}`, 'stderr');
  });
  child.on('exit', (code, signal) => {
    state.running = false;
    state.process = null;
    state.connected = false;
    if (code != null && code !== 0) state.lastError = `Exit code ${code}`;
    if (signal) state.lastError = `Signal ${signal}`;
    pushToRenderer(`Playit agent exited (code=${code}, signal=${signal})`, 'stderr');
  });

  return { success: true };
}

function stopPlayit(serverName) {
  const state = getAgentState(serverName);
  if (!state.process) {
    return { success: true, wasRunning: false };
  }
  state.process.kill('SIGTERM');
  state.process = null;
  state.running = false;
  state.connected = false;
  return { success: true, wasRunning: true };
}

async function restartPlayit(serverName, mainWindow) {
  stopPlayit(serverName);
  await new Promise((r) => setTimeout(r, 500));
  return startPlayit(serverName, {}, mainWindow);
}

function getPlayitStatus(serverName) {
  const state = getAgentState(serverName);
  return {
    running: state.running,
    connected: state.connected,
    publicAddress: state.publicAddress || null,
    lastError: state.lastError || null,
    claimUrl: state.claimUrl || null,
  };
}

function subscribePlayitLogs(serverName, callback) {
  const state = getAgentState(serverName);
  state.logCallbacks.push(callback);
  return () => {
    const idx = state.logCallbacks.indexOf(callback);
    if (idx !== -1) state.logCallbacks.splice(idx, 1);
  };
}

function stopAllPlayit() {
  const names = Array.from(agents.keys());
  names.forEach((name) => stopPlayit(name));
}

module.exports = {
  ensurePlayitAgentInstalled,
  startPlayit,
  stopPlayit,
  restartPlayit,
  getPlayitStatus,
  subscribePlayitLogs,
  stopAllPlayit,
  getStoredSecret,
  setStoredSecret,
  hasPlayitSecret,
};
