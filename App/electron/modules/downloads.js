/**
 * Server jar download and version management.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

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

// Download Fabric server launcher
async function downloadFabric(serverPath, version) {
  // Get loader version for this specific game version
  const loaderData = await new Promise((resolve, reject) => {
    const encodedVersion = encodeURIComponent(version);
    https.get(`https://meta.fabricmc.net/v2/versions/loader/${encodedVersion}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  const loader = loaderData.find((l) => l.loader?.stable) || loaderData[0];
  if (!loader?.loader?.version) {
    throw new Error(`No Fabric loader found for Minecraft ${version}`);
  }
  const loaderVersion = loader.loader.version;

  // Get installer version for the server jar URL
  const installerMeta = await new Promise((resolve, reject) => {
    https.get('https://meta.fabricmc.net/v2/versions/installer', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
  const installerVersion = installerMeta?.[0]?.version || '1.1.1';

  const encVersion = encodeURIComponent(version);
  const encLoader = encodeURIComponent(loaderVersion);
  const encInstaller = encodeURIComponent(installerVersion);
  const serverJarUrl = `https://meta.fabricmc.net/v2/versions/loader/${encVersion}/${encLoader}/${encInstaller}/server/jar`;
  const serverJarName = `fabric-server-${version}.jar`;
  const serverJarPath = path.join(serverPath, serverJarName);

  try {
    await downloadFile(serverJarUrl, serverJarPath);
  } catch (err) {
    throw new Error(`Failed to download Fabric server: ${err.message}. Try a different Minecraft version.`);
  }

  await fs.writeFile(path.join(serverPath, 'eula.txt'), 'eula=true\n', 'utf8');
  return serverJarPath;
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
              reject(new Error(`Failed to download Forge ${version}. Please download the installer from https://files.minecraftforge.net/ and run it manually. Then import the resulting server folder using the Import button on this page.`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Forge metadata. Please use the Forge installer manually from https://files.minecraftforge.net/, then import the server folder using the Import button on this page.`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Failed to fetch Forge metadata. Please use the Forge installer manually from https://files.minecraftforge.net/, then import the server folder using the Import button on this page.`));
      });
    } catch (error) {
      reject(new Error(`Forge installation requires manual setup. Please download from https://files.minecraftforge.net/ and use the installer. Then import the server folder using the Import button on this page.`));
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

module.exports = {
  downloadFile,
  getPaperVersions,
  getLatestPaperVersion,
  getLatestPaperBuild,
  downloadPaper,
  getSpigotVersions,
  downloadSpigot,
  getVanillaVersions,
  downloadVanilla,
  getFabricVersions,
  downloadFabric,
  getForgeVersions,
  downloadForge,
  mapVelocityToMinecraft,
  getVelocityVersions,
  getVelocityVersionForMC,
  getVelocityBuild,
  getPurpurVersions,
  getPurpurBuild,
  downloadPurpur,
  downloadVelocity,
  getWaterfallVersions,
  getWaterfallBuild,
  downloadWaterfall,
  getBungeeCordVersions,
  getBungeeCordBuildForVersion,
  downloadBungeeCord,
};
