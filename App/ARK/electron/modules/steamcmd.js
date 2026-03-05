/**
 * SteamCMD integration: version checking and ARK server updates.
 */
const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

class SteamCMD extends EventEmitter {
  constructor(getAppSettings) {
    super();
    this._getAppSettings = getAppSettings;
  }

  async checkVersions() {
    const settings = await this._getAppSettings();
    const serverVersion = this._getCurrentServerVersion(settings);
    const gameVersion = await this._getLatestGameVersion();
    return { serverVersion, gameVersion };
  }

  _getCurrentServerVersion(settings) {
    try {
      const arkPath = settings.arkInstallPath;
      if (!arkPath) return null;
      const vFile = path.join(arkPath, 'ShooterGame', 'Binaries', 'Win64', 'version.txt');
      if (fs.existsSync(vFile)) return fs.readFileSync(vFile, 'utf8').trim();
      const manifest = path.join(arkPath, 'appmanifest_376030.acf');
      if (fs.existsSync(manifest)) {
        const content = fs.readFileSync(manifest, 'utf8');
        const m = content.match(/"buildid"\s+"(\d+)"/);
        if (m) return m[1];
      }
      return null;
    } catch { return null; }
  }

  async _getLatestGameVersion() {
    try {
      return new Promise((resolve) => {
        const req = https.get(
          'https://api.steampowered.com/ISteamApps/UpToDateCheck/v1/?appid=346110&version=0',
          { timeout: 10000 },
          (res) => {
            let data = '';
            res.on('data', (d) => data += d);
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                resolve(json.response?.required_version?.toString() || null);
              } catch { resolve(null); }
            });
          }
        );
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });
    } catch { return null; }
  }

  async updateServer(progressCallback, forceUpdate = false) {
    const settings = await this._getAppSettings();
    const steamcmdPath = settings.steamCmdPath;
    if (!steamcmdPath || !fs.existsSync(steamcmdPath)) {
      throw new Error('SteamCMD not found at configured path');
    }

    const arkPath = settings.arkInstallPath;
    if (!arkPath) throw new Error('ARK install path not configured');

    if (!forceUpdate) {
      progressCallback?.('Checking versions...');
      const { serverVersion, gameVersion } = await this.checkVersions();
      if (serverVersion && gameVersion) {
        const sv = parseInt(serverVersion), gv = parseInt(gameVersion);
        if (!isNaN(sv) && !isNaN(gv) && sv > gv) {
          return {
            success: true,
            message: `Server (${serverVersion}) is ahead of game (${gameVersion}). Update skipped.`,
            hadUpdate: false,
          };
        }
      }
    }

    progressCallback?.('Preparing update script...');

    const tmpDir = os.tmpdir();
    const scriptPath = path.join(tmpDir, `ark_update_${Date.now()}.txt`);
    const scriptContent = [
      '@ShutdownOnFailedCommand 1',
      '@NoPromptForPassword 1',
      `force_install_dir "${arkPath}"`,
      'login anonymous',
      'app_update 376030',
      'quit',
    ].join('\n');

    fs.writeFileSync(scriptPath, scriptContent, 'utf8');

    try {
      progressCallback?.('Running SteamCMD update...');
      return await this._runSteamCmd(steamcmdPath, scriptPath, progressCallback);
    } finally {
      try { fs.unlinkSync(scriptPath); } catch {}
    }
  }

  _runSteamCmd(steamcmdPath, scriptPath, progressCallback) {
    return new Promise((resolve) => {
      const proc = spawn(steamcmdPath, ['+runscript', scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let hadUpdate = false;

      const handleData = (data) => {
        const text = data.toString();
        if (/downloading|update state|progress/i.test(text)) hadUpdate = true;
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) {
          if (line.trim() && !line.startsWith('Steam>')) {
            this.emit('log', `SteamCMD: ${line.trim().slice(0, 200)}`);
            if (/\d+%/.test(line)) progressCallback?.(`Downloading: ${line.trim().slice(0, 100)}`);
          }
        }
      };

      if (proc.stdout) proc.stdout.on('data', handleData);
      if (proc.stderr) proc.stderr.on('data', handleData);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            message: hadUpdate ? 'Update completed successfully' : 'Server is up to date',
            hadUpdate,
          });
        } else if (code === 8) {
          resolve({
            success: true,
            message: 'SteamCMD self-updated. Server verified.',
            hadUpdate: false,
          });
        } else {
          resolve({
            success: false,
            message: `SteamCMD exited with code ${code}`,
            hadUpdate: false,
          });
        }
      });

      proc.on('error', (err) => {
        resolve({ success: false, message: err.message, hadUpdate: false });
      });

      setTimeout(() => {
        try { proc.kill(); } catch {}
        resolve({ success: false, message: 'Update timed out (10 min)', hadUpdate: false });
      }, 600000);
    });
  }
}

module.exports = SteamCMD;
