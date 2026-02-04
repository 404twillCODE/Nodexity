import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";
import FileEditor from "./FileEditor";

interface PluginManagerProps {
  serverName: string;
}

interface Plugin {
  name: string;
  size: number;
  modified: string;
}

interface ModrinthPlugin {
  project_id: string;
  title: string;
  description: string;
  slug: string;
  downloads: number;
  icon_url?: string;
  versions?: string[];
}

export default function PluginManager({ serverName }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [modrinthPlugins, setModrinthPlugins] = useState<ModrinthPlugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingModrinth, setLoadingModrinth] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [supportsPlugins, setSupportsPlugins] = useState<boolean | null>(null);
  const [minecraftVersion, setMinecraftVersion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modrinthLimit, setModrinthLimit] = useState(200);
  const [configPath, setConfigPath] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { notify } = useToast();
  const modrinthListRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollRef = useRef<number | null>(null);

  useEffect(() => {
    checkPluginSupport();
  }, [serverName]);

  useEffect(() => {
    if (supportsPlugins) {
      loadPlugins();
      loadModrinthPlugins();
    }
  }, [serverName, supportsPlugins, modrinthLimit]);

  const checkPluginSupport = async () => {
    if (!window.electronAPI || !window.electronAPI.server) return;
    
    // Check if function exists (defensive check for hot reload scenarios)
    if (typeof window.electronAPI.server.checkJarSupportsPlugins !== 'function') {
      console.warn('checkJarSupportsPlugins not available yet, defaulting to false');
      setSupportsPlugins(false);
      return;
    }
    
    try {
      const supports = await window.electronAPI.server.checkJarSupportsPlugins(serverName);
      setSupportsPlugins(supports);
      
      // Get Minecraft version for Modrinth search - get from server config to ensure accuracy
      if (supports && window.electronAPI) {
        try {
          const servers = await window.electronAPI.server.listServers();
          const server = servers.find((s: any) => s.name === serverName);
          if (server && server.version && server.version !== 'manual' && server.version !== 'unknown') {
            // Use the exact version from the server config
            setMinecraftVersion(server.version);
          } else {
            // Try to get version from server config directly
            try {
              const config = await window.electronAPI.server.getServerConfig?.(serverName);
              if (config?.version && config.version !== 'manual' && config.version !== 'unknown') {
                setMinecraftVersion(config.version);
              }
            } catch (e) {
              // Fallback: try to extract from jar filename if available
              console.warn('Could not determine Minecraft version for plugin search');
            }
          }
        } catch (error) {
          console.error('Failed to get server version:', error);
        }
      }
    } catch (error) {
      console.error('Failed to check plugin support:', error);
      setSupportsPlugins(false);
    }
  };

  const loadPlugins = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.server.listPlugins(serverName);
      if (result.success) {
        setPlugins(result.plugins || []);
        if (result.supportsPlugins !== undefined) {
          setSupportsPlugins(result.supportsPlugins);
        }
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModrinthPlugins = async () => {
    if (!window.electronAPI || !window.electronAPI.server) return;
    
    // Check if function exists (defensive check for hot reload scenarios)
    if (typeof window.electronAPI.server.getModrinthPlugins !== 'function') {
      console.warn('getModrinthPlugins not available yet');
      setLoadingModrinth(false);
      return;
    }
    
    setLoadingModrinth(true);
    try {
      const plugins = await window.electronAPI.server.getModrinthPlugins(minecraftVersion, modrinthLimit);
      setModrinthPlugins(plugins || []);
    } catch (error) {
      console.error('Failed to load Modrinth plugins:', error);
    } finally {
      setLoadingModrinth(false);
    }
  };
  const normalizeName = (value: string) =>
    value
      .toLowerCase()
      .replace(/\.jar$/i, '')
      .replace(/[^a-z0-9]/g, '');

  const installedPluginKeys = useMemo(() => {
    return new Set(plugins.map((plugin) => normalizeName(plugin.name)));
  }, [plugins]);

  const filteredModrinthPlugins = useMemo(() => {
    const matchesSearch = (plugin: ModrinthPlugin) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        plugin.title.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.slug.toLowerCase().includes(query)
      );
    };

    return modrinthPlugins.filter((plugin) => {
      const normalizedTitle = normalizeName(plugin.title);
      const normalizedSlug = normalizeName(plugin.slug);
      const alreadyInstalled =
        installedPluginKeys.has(normalizedTitle) ||
        installedPluginKeys.has(normalizedSlug);
      if (alreadyInstalled) return false;
      return matchesSearch(plugin);
    });
  }, [modrinthPlugins, searchQuery, installedPluginKeys]);

  useEffect(() => {
    if (restoreScrollRef.current === null) return;
    if (modrinthListRef.current) {
      modrinthListRef.current.scrollTop = restoreScrollRef.current;
    }
    restoreScrollRef.current = null;
  }, [filteredModrinthPlugins.length]);


  const handleDeleteConfirmed = async (pluginName: string) => {
    if (!window.electronAPI) return;
    setDeleting(pluginName);
    try {
      const result = await window.electronAPI.server.deletePlugin(serverName, pluginName);
      if (result.success) {
        await loadPlugins();
      } else {
        notify({
          type: "error",
          title: "Delete failed",
          message: result.error || "Unable to delete the plugin."
        });
      }
    } catch (error: any) {
      notify({
        type: "error",
        title: "Delete failed",
        message: error.message || "Unable to delete the plugin."
      });
    } finally {
      setDeleting(null);
    }
  };

  const openPluginConfig = async (pluginName: string) => {
    if (!window.electronAPI) return;
    const baseName = pluginName.replace(/\.jar$/i, '');
    const preferredPath = `plugins/${baseName}`;
    try {
      const result = await window.electronAPI.server.getServerFiles(serverName, preferredPath);
      if (result.success) {
        setConfigPath(preferredPath);
        return;
      }
    } catch (error) {
      // Ignore and fallback
    }
    setConfigPath('plugins');
  };

  const handleInstall = async (projectId: string, pluginTitle: string) => {
    if (!window.electronAPI || !minecraftVersion) {
      notify({
        type: "error",
        title: "Install failed",
        message: "Minecraft version not available."
      });
      return;
    }

    if (!window.electronAPI.server.installModrinthPlugin) {
      notify({
        type: "error",
        title: "Install unavailable",
        message: "Install function not available. Please restart the app."
      });
      return;
    }

    setInstalling(projectId);
    try {
      const result = await window.electronAPI.server.installModrinthPlugin(serverName, projectId, minecraftVersion);
      if (result.success) {
        notify({
          type: "success",
          title: "Plugin installed",
          message: `${pluginTitle} is ready.`
        });
        await loadPlugins(); // Refresh installed plugins list
      } else {
        notify({
          type: "error",
          title: "Install failed",
          message: result.error || "Unable to install the plugin."
        });
      }
    } catch (error: any) {
      notify({
        type: "error",
        title: "Install failed",
        message: error.message || "Unable to install the plugin."
      });
    } finally {
      setInstalling(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // If server doesn't support plugins, show message
  if (supportsPlugins === false) {
    return (
      <div className="h-full overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="system-card p-12 text-center">
            <div className="text-4xl mb-4 opacity-20">🚫</div>
            <h3 className="text-lg font-semibold text-text-primary font-mono mb-2">
              PLUGINS NOT SUPPORTED
            </h3>
            <p className="text-text-muted font-mono text-sm">
              This server type does not support plugins. Only Paper, Spigot, Purpur, Waterfall, and BungeeCord servers support plugins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary font-mono mb-2">
            Plugin Manager
          </h2>
          <p className="text-text-secondary font-mono text-sm">
            Manage your server plugins
          </p>
        </div>

        {/* Installed Plugins Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary font-mono mb-4">
            Installed Plugins
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-text-muted font-mono text-sm">Loading plugins...</div>
            </div>
          ) : plugins.length === 0 ? (
            <div className="system-card p-8 text-center">
              <div className="text-3xl mb-3 opacity-20">🔌</div>
              <h4 className="text-md font-semibold text-text-primary font-mono mb-2">
                NO PLUGINS INSTALLED
              </h4>
              <p className="text-text-muted font-mono text-sm">
                Plugins will appear here once you add them to the plugins folder
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plugins.map((plugin) => (
                <motion.div
                  key={plugin.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="system-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🔌</span>
                        <h4 className="text-lg font-semibold text-text-primary font-mono truncate">
                          {plugin.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary font-mono ml-11">
                        <span>Size: {formatSize(plugin.size)}</span>
                        <span>Modified: {formatDate(plugin.modified)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => openPluginConfig(plugin.name)}
                        className="btn-secondary text-xs px-3 py-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        CONFIG
                      </motion.button>
                      <motion.button
                        onClick={() => setDeleteTarget(plugin.name)}
                        disabled={deleting === plugin.name}
                        className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                        whileHover={{ scale: deleting === plugin.name ? 1 : 1.02 }}
                        whileTap={{ scale: deleting === plugin.name ? 1 : 0.98 }}
                      >
                        {deleting === plugin.name ? 'DELETING...' : 'DELETE'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modrinth Plugins Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-mono">
              Available on Modrinth
            </h3>
          </div>
          
          {/* Search Bar */}
          {modrinthPlugins.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plugins by name, description..."
                className="w-full bg-background border border-border px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded transition-colors"
              />
            </div>
          )}
          {loadingModrinth ? (
            <div className="text-center py-8">
              <div className="text-text-muted font-mono text-sm">Loading all Modrinth plugins...</div>
              <div className="text-xs text-text-muted font-mono mt-2">This may take a moment</div>
            </div>
          ) : modrinthPlugins.length === 0 ? (
            <div className="system-card p-8 text-center">
              <div className="text-3xl mb-3 opacity-20">📦</div>
              <h4 className="text-md font-semibold text-text-primary font-mono mb-2">
                NO PLUGINS FOUND
              </h4>
              <p className="text-text-muted font-mono text-sm">
                {minecraftVersion ? `No plugins found for Minecraft ${minecraftVersion}` : 'Unable to determine Minecraft version'}
              </p>
            </div>
          ) : (
            <div ref={modrinthListRef} className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
              {filteredModrinthPlugins.map((plugin) => (
                <motion.div
                  key={plugin.project_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="system-card p-4"
                >
                  <div className="flex items-center gap-4">
                    {plugin.icon_url && (
                      <img 
                        src={plugin.icon_url} 
                        alt={plugin.title}
                        className="w-12 h-12 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-text-primary font-mono truncate mb-1">
                        {plugin.title}
                      </h4>
                      <p className="text-sm text-text-secondary font-mono line-clamp-2 mb-2">
                        {plugin.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                        <span>Downloads: {plugin.downloads.toLocaleString()}</span>
                        <a 
                          href={`https://modrinth.com/plugin/${plugin.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          View on Modrinth →
                        </a>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleInstall(plugin.project_id, plugin.title)}
                      disabled={installing === plugin.project_id || !minecraftVersion}
                      className="btn-primary text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      whileHover={{ scale: installing === plugin.project_id ? 1 : 1.02 }}
                      whileTap={{ scale: installing === plugin.project_id ? 1 : 0.98 }}
                    >
                      {installing === plugin.project_id ? 'INSTALLING...' : 'INSTALL'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              {filteredModrinthPlugins.length === 0 && searchQuery.trim() && (
                <div className="system-card p-8 text-center">
                  <div className="text-3xl mb-3 opacity-20">🔍</div>
                  <h4 className="text-md font-semibold text-text-primary font-mono mb-2">
                    NO RESULTS FOUND
                  </h4>
                  <p className="text-text-muted font-mono text-sm">
                    No plugins match "{searchQuery}"
                  </p>
                </div>
              )}
              {!searchQuery.trim() && modrinthPlugins.length >= modrinthLimit && (
                <div className="flex justify-center">
                  <motion.button
                    onClick={() => {
                      if (modrinthListRef.current) {
                        restoreScrollRef.current = modrinthListRef.current.scrollTop;
                      }
                      setModrinthLimit((prev) => prev + 200);
                    }}
                    className="btn-secondary text-xs px-4 py-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    LOAD MORE
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {configPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
          <div className="system-card w-full max-w-5xl h-[80vh] overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-border bg-background-secondary px-4 py-3">
              <div className="text-sm font-mono text-text-secondary">
                Plugin Config: {configPath}
              </div>
              <motion.button
                onClick={() => setConfigPath(null)}
                className="btn-secondary text-xs px-3 py-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CLOSE
              </motion.button>
            </div>
            <FileEditor serverName={serverName} initialPath={configPath} />
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
          <div className="system-card w-full max-w-md p-6">
            <div className="text-lg font-semibold text-text-primary font-mono mb-2">
              Delete plugin?
            </div>
            <p className="text-text-secondary font-mono text-sm mb-6">
              Are you sure you want to delete {deleteTarget}?
            </p>
            <div className="flex justify-end gap-3">
              <motion.button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-xs px-4 py-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CANCEL
              </motion.button>
              <motion.button
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  if (target) {
                    await handleDeleteConfirmed(target);
                  }
                }}
                className="btn-primary text-xs px-4 py-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                DELETE
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


