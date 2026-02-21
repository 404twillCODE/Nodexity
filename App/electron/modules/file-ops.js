/**
 * File operations: read/write text & binary, NBT, plugins, worlds, server properties.
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const nbt = require('prismarine-nbt');

const config = require('./config');
const downloads = require('./downloads');

async function getServerFiles(serverName, filePath = '') {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName, filePath);
    
    // Security check - prevent path traversal
    const normalizedPath = path.normalize(serverPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid file path' };
    }
    
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
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
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
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
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

async function readServerFileBinary(serverName, filePath) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const fullPath = path.join(serversDir, serverName, filePath);

    // Security check - prevent path traversal
    const normalizedPath = path.normalize(fullPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid file path' };
    }

    const rawBuffer = await fs.readFile(fullPath);

    // Check for gzip magic bytes (1f 8b)
    let wasGzipped = false;
    let contentBuffer = rawBuffer;
    if (rawBuffer.length >= 2 && rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b) {
      try {
        contentBuffer = await new Promise((resolve, reject) => {
          zlib.gunzip(rawBuffer, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });
        wasGzipped = true;
      } catch {
        // Not valid gzip despite magic bytes, return raw
        contentBuffer = rawBuffer;
        wasGzipped = false;
      }
    }

    const contentBase64 = contentBuffer.toString('base64');
    return { success: true, contentBase64, wasGzipped };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Write a base64-encoded binary file, optionally gzip-compressing it
async function writeServerFileBinary(serverName, filePath, contentBase64, wasGzipped) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const fullPath = path.join(serversDir, serverName, filePath);

    // Security check - prevent path traversal
    const normalizedPath = path.normalize(fullPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid file path' };
    }

    let buffer = Buffer.from(contentBase64, 'base64');

    // Re-compress with gzip if the original was gzipped
    if (wasGzipped) {
      buffer = await new Promise((resolve, reject) => {
        zlib.gzip(buffer, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Read an NBT file, returning parsed structure and format type
async function readServerFileNbt(serverName, filePath) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const fullPath = path.join(serversDir, serverName, filePath);

    // Security check - prevent path traversal
    const normalizedPath = path.normalize(fullPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid file path' };
    }

    const rawBuffer = await fs.readFile(fullPath);
    if (rawBuffer.length === 0) {
      return { success: false, error: 'File is empty' };
    }

    const { parsed, type } = await nbt.parse(rawBuffer);
    // Simplify for easier JSON serialization / UI rendering
    const simplified = nbt.simplify(parsed);
    return { success: true, parsed: simplified, type };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Write parsed NBT data back to a file
async function writeServerFileNbt(serverName, filePath, parsed, nbtFormat) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const fullPath = path.join(serversDir, serverName, filePath);

    // Security check - prevent path traversal
    const normalizedPath = path.normalize(fullPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid file path' };
    }

    // Read the original file to get the proper NBT structure (not simplified)
    const rawBuffer = await fs.readFile(fullPath);
    const original = await nbt.parse(rawBuffer);

    // Write back using the original format (big/little/bedrockLevel)
    const outBuffer = fsSync.createWriteStream ? nbt.writeUncompressed(original.parsed, original.type) : nbt.writeUncompressed(original.parsed);

    // If the original was gzipped, re-compress
    let finalBuffer;
    if (rawBuffer.length >= 2 && rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b) {
      finalBuffer = await new Promise((resolve, reject) => {
        zlib.gzip(outBuffer, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    } else {
      finalBuffer = outBuffer;
    }

    await fs.writeFile(fullPath, finalBuffer);
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
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    
    // Check server type from config first (fastest and most reliable)
    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig && serverConfig.serverType) {
      const serverType = serverConfig.serverType.toLowerCase();
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
  const loaders = encodeURIComponent(JSON.stringify(['bukkit', 'spigot', 'paper', 'purpur']));
  const gameVersions = encodeURIComponent(JSON.stringify([minecraftVersion]));
  const fetchVersions = (url) => new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Nodexity/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(Array.isArray(json) ? json : []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
  const urlWithVersion = `https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version?game_versions=${gameVersions}&loaders=${loaders}`;
  let versions = await fetchVersions(urlWithVersion);
  if (versions.length === 0) {
    const urlLatest = `https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version?loaders=${loaders}`;
    versions = await fetchVersions(urlLatest);
  }
  if (versions.length === 0) {
    throw new Error('No compatible version found');
  }
  return versions[0];
}

// Install EssentialsX from GitHub releases (not on Modrinth as plugin)
async function installEssentialsXFromGitHub(serverName) {
  try {
    const supportsPlugins = await checkJarSupportsPlugins(serverName);
    if (!supportsPlugins) {
      return { success: false, error: 'This server type does not support plugins' };
    }
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const pluginsPath = path.join(serversDir, serverName, 'plugins');
    await fs.mkdir(pluginsPath, { recursive: true });
    const apiUrl = 'https://api.github.com/repos/EssentialsX/Essentials/releases/latest';
    const releaseJson = await new Promise((resolve, reject) => {
      const req = https.get(apiUrl, {
        headers: { 'User-Agent': 'Nodexity/1.0' }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
    });
    const assets = releaseJson.assets || [];
    const mainJar = assets.find((a) => /^EssentialsX-\d+\.\d+\.\d+\.jar$/.test(a.name));
    if (!mainJar || !mainJar.browser_download_url) {
      return { success: false, error: 'EssentialsX main jar not found in latest release' };
    }
    const pluginPath = path.join(pluginsPath, mainJar.name);
    const downloadUrl = mainJar.browser_download_url;
    await new Promise((resolve, reject) => {
      const file = fsSync.createWriteStream(pluginPath);
      const onResponse = (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          https.get(res.headers.location, { headers: { 'User-Agent': 'Nodexity/1.0' } }, onResponse).on('error', reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          try { fsSync.unlinkSync(pluginPath); } catch (_) {}
          reject(new Error(`Failed to download EssentialsX: HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', (err) => { file.close(); reject(err); });
      };
      const req = https.get(downloadUrl, { headers: { 'User-Agent': 'Nodexity/1.0' } }, onResponse);
      req.on('error', (err) => {
        file.close();
        reject(err);
      });
    });
    return { success: true, filename: mainJar.name, path: pluginPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const pluginsPath = path.join(serversDir, serverName, 'plugins');
    
    // Ensure plugins directory exists
    await fs.mkdir(pluginsPath, { recursive: true });

    // Get the latest compatible version (try slug first, then project id for known plugins)
    const slugToId = { luckperms: 'Vebnzrzj', worldedit: '1u6JkXh5', chunky: 'fALzjamp' };
    let version;
    try {
      version = await getModrinthPluginVersion(projectId, minecraftVersion);
    } catch (e) {
      const altId = slugToId[projectId.toLowerCase()];
      if (altId && altId !== projectId) {
        version = await getModrinthPluginVersion(altId, minecraftVersion);
      } else {
        throw e;
      }
    }
    
    if (!version || !version.files || version.files.length === 0) {
      return { success: false, error: 'No download file found for this plugin version' };
    }

    // Find the primary jar file (usually the first one, or one marked as primary)
    const jarFile = version.files.find(f => f.primary) || version.files.find(f => f.filename.endsWith('.jar')) || version.files[0];
    
    if (!jarFile) {
      return { success: false, error: 'No jar file found in plugin version' };
    }

    // Download the plugin (use version.project_id for CDN in case we resolved by slug)
    const pluginPath = path.join(pluginsPath, jarFile.filename);
    const cdnProjectId = version.project_id || projectId;
    const downloadUrl = jarFile.url || `https://cdn.modrinth.com/data/${cdnProjectId}/versions/${version.id}/${jarFile.filename}`;
    
    await downloads.downloadFile(downloadUrl, pluginPath);

    return { success: true, filename: jarFile.filename, path: pluginPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// List plugins
async function listPlugins(serverName) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
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

// Check if a server supports mods (Fabric, Forge)
async function checkJarSupportsMods(serverName) {
  try {
    const serverConfig = await config.getServerConfig(serverName);
    if (serverConfig && serverConfig.serverType) {
      const serverType = serverConfig.serverType.toLowerCase();
      const modServers = ['fabric', 'forge'];
      return { supportsMods: modServers.includes(serverType) };
    }
    // Fallback: check jar filename
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const serverPath = path.join(serversDir, serverName);
    const files = await fs.readdir(serverPath).catch(() => []);
    const jarFile = files.find(f => f.endsWith('.jar'));
    if (!jarFile) return { supportsMods: false };
    const jarName = jarFile.toLowerCase();
    const supportsMods = jarName.includes('forge') || jarName.includes('fabric');
    return { supportsMods };
  } catch {
    return { supportsMods: false };
  }
}

// List mods
async function listMods(serverName) {
  try {
    const supportsMods = await checkJarSupportsMods(serverName);
    if (!supportsMods.supportsMods) {
      return { success: true, mods: [], supportsMods: false };
    }
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const modsPath = path.join(serversDir, serverName, 'mods');
    try {
      await fs.access(modsPath);
    } catch {
      return { success: true, mods: [], supportsMods: true };
    }
    const files = await fs.readdir(modsPath);
    const mods = [];
    for (const file of files) {
      if (file.endsWith('.jar')) {
        const filePath = path.join(modsPath, file);
        const stat = await fs.stat(filePath);
        mods.push({
          name: file,
          size: stat.size,
          modified: stat.mtime.toISOString()
        });
      }
    }
    return { success: true, mods, supportsMods: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get mods from Modrinth API
async function getModrinthMods(minecraftVersion = null, loader = 'fabric', limit = 200) {
  return new Promise(async (resolve, reject) => {
    try {
      const facets = [['project_type:mod'], ['categories:' + loader]]; // loaders (fabric/forge) are in categories
      if (minecraftVersion) {
        facets.push(['versions:' + minecraftVersion]);
      }
      const facetsJson = encodeURIComponent(JSON.stringify(facets));
      let allMods = [];
      let offset = 0;
      const pageSize = 100;
      let hasMore = true;
      while (hasMore) {
        const url = `https://api.modrinth.com/v2/search?facets=${facetsJson}&limit=${pageSize}&offset=${offset}`;
        const pageResults = await new Promise((pageResolve, pageReject) => {
          https.get(url, {
            headers: { 'User-Agent': 'HexNode/1.0.0' }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                pageResolve({ hits: json.hits || [], total: json.total_hits || 0 });
              } catch (e) {
                pageReject(e);
              }
            });
          }).on('error', pageReject);
        });
        allMods = allMods.concat(pageResults.hits);
        if (limit && allMods.length >= limit) {
          allMods = allMods.slice(0, limit);
          hasMore = false;
        } else if (pageResults.hits.length < pageSize || allMods.length >= pageResults.total) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }
      resolve(allMods);
    } catch (error) {
      reject(error);
    }
  });
}

// Get latest version of a Modrinth mod for a specific Minecraft version and loader
async function getModrinthModVersion(projectId, minecraftVersion, loader) {
  return new Promise((resolve, reject) => {
    const gameVersions = encodeURIComponent(JSON.stringify([minecraftVersion]));
    const loaders = encodeURIComponent(JSON.stringify([loader]));
    const url = `https://api.modrinth.com/v2/project/${projectId}/version?game_versions=${gameVersions}&loaders=${loaders}`;
    https.get(url, {
      headers: { 'User-Agent': 'HexNode/1.0.0' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
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

// Install mod from Modrinth
async function installModrinthMod(serverName, projectId, minecraftVersion) {
  try {
    const supportsMods = await checkJarSupportsMods(serverName);
    if (!supportsMods.supportsMods) {
      return { success: false, error: 'This server type does not support mods' };
    }
    const serverConfig = await config.getServerConfig(serverName);
    const serverType = (serverConfig?.serverType || '').toLowerCase();
    const loader = serverType === 'forge' ? 'forge' : 'fabric';
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const modsPath = path.join(serversDir, serverName, 'mods');
    await fs.mkdir(modsPath, { recursive: true });
    const version = await getModrinthModVersion(projectId, minecraftVersion, loader);
    if (!version || !version.files || version.files.length === 0) {
      return { success: false, error: 'No download file found for this mod version' };
    }
    const jarFile = version.files.find(f => f.primary) || version.files.find(f => f.filename.endsWith('.jar')) || version.files[0];
    if (!jarFile) {
      return { success: false, error: 'No jar file found in mod version' };
    }
    const modPath = path.join(modsPath, jarFile.filename);
    const downloadUrl = jarFile.url || `https://cdn.modrinth.com/data/${projectId}/versions/${version.id}/${jarFile.filename}`;
    await downloads.downloadFile(downloadUrl, modPath);
    return { success: true, filename: jarFile.filename, path: modPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete mod
async function deleteMod(serverName, modName) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const modPath = path.join(serversDir, serverName, 'mods', modName);
    const normalizedPath = path.normalize(modPath);
    const normalizedModsDir = path.normalize(path.join(serversDir, serverName, 'mods'));
    if (!normalizedPath.startsWith(normalizedModsDir)) {
      return { success: false, error: 'Invalid mod path' };
    }
    await fs.unlink(modPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Install Geyser and Floodgate for Java+Bedrock cross-play (from GeyserMC)
async function installGeyserFloodgate(serverName, serverPort = 25565) {
  try {
    const supportsPlugins = await checkJarSupportsPlugins(serverName);
    if (!supportsPlugins) {
      return { success: false, error: 'Server does not support plugins' };
    }
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const pluginsPath = path.join(serversDir, serverName, 'plugins');
    await fs.mkdir(pluginsPath, { recursive: true });
    const geyserUrl = 'https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot';
    const floodgateUrl = 'https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot';
    const geyserPath = path.join(pluginsPath, 'Geyser-Spigot.jar');
    const floodgatePath = path.join(pluginsPath, 'floodgate-spigot.jar');
    await downloads.downloadFile(geyserUrl, geyserPath);
    await downloads.downloadFile(floodgateUrl, floodgatePath);
    const geyserConfigDir = path.join(pluginsPath, 'Geyser-Spigot');
    await fs.mkdir(geyserConfigDir, { recursive: true });
    const geyserConfig = `# Geyser config - auto-generated for Floodgate
# Bedrock players can join using the port below (default 19132)
bedrock:
  port: 19132
  address: 0.0.0.0

remote:
  address: 127.0.0.1
  port: ${serverPort}

auth-type: floodgate
`;
    await fs.writeFile(path.join(geyserConfigDir, 'config.yml'), geyserConfig);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete plugin
async function deletePlugin(serverName, pluginName) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
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
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
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

// Delete a world directory from a server
async function deleteWorld(serverName, worldName) {
  try {
    const settings = await config.getAppSettings();
    const serversDir = settings.serversDirectory || config.SERVERS_DIR;
    const worldPath = path.join(serversDir, serverName, worldName);

    // Security check - prevent path traversal
    const normalizedPath = path.normalize(worldPath);
    const normalizedServerDir = path.normalize(path.join(serversDir, serverName));
    if (!normalizedPath.startsWith(normalizedServerDir)) {
      return { success: false, error: 'Invalid world path' };
    }

    // Verify it's actually a world directory (has level.dat)
    const levelDatPath = path.join(worldPath, 'level.dat');
    try {
      await fs.access(levelDatPath);
    } catch {
      return { success: false, error: 'Not a valid world directory (no level.dat found).' };
    }

    await fs.rm(worldPath, { recursive: true, force: true });
    return { success: true };
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

module.exports = {
  getServerFiles,
  readServerFile,
  readServerFileBinary,
  writeServerFile,
  writeServerFileBinary,
  readServerFileNbt,
  writeServerFileNbt,
  checkJarSupportsPlugins,
  checkJarSupportsMods,
  getModrinthPlugins,
  getModrinthPluginVersion,
  installEssentialsXFromGitHub,
  installModrinthPlugin,
  getModrinthMods,
  getModrinthModVersion,
  installModrinthMod,
  listPlugins,
  deletePlugin,
  listMods,
  deleteMod,
  installGeyserFloodgate,
  listWorlds,
  deleteWorld,
  getDirectorySize,
  getServerProperties,
  updateServerProperties,
};
