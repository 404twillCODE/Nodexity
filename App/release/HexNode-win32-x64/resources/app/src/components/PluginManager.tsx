import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PluginManagerProps {
  serverName: string;
}

interface Plugin {
  name: string;
  size: number;
  modified: string;
}

export default function PluginManager({ serverName }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
  }, [serverName]);

  const loadPlugins = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.server.listPlugins(serverName);
      if (result.success) {
        setPlugins(result.plugins || []);
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pluginName: string) => {
    if (!confirm(`Are you sure you want to delete ${pluginName}?`)) return;
    
    if (!window.electronAPI) return;
    setDeleting(pluginName);
    try {
      const result = await window.electronAPI.server.deletePlugin(serverName, pluginName);
      if (result.success) {
        await loadPlugins();
      } else {
        alert(`Failed to delete plugin: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error deleting plugin: ${error.message}`);
    } finally {
      setDeleting(null);
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

        {loading ? (
          <div className="text-center py-8">
            <div className="text-text-muted font-mono text-sm">Loading plugins...</div>
          </div>
        ) : plugins.length === 0 ? (
          <div className="system-card p-12 text-center">
            <div className="text-4xl mb-4 opacity-20">🔌</div>
            <h3 className="text-lg font-semibold text-text-primary font-mono mb-2">
              NO PLUGINS FOUND
            </h3>
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
                      <h3 className="text-lg font-semibold text-text-primary font-mono truncate">
                        {plugin.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-secondary font-mono ml-11">
                      <span>Size: {formatSize(plugin.size)}</span>
                      <span>Modified: {formatDate(plugin.modified)}</span>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handleDelete(plugin.name)}
                    disabled={deleting === plugin.name}
                    className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                    whileHover={{ scale: deleting === plugin.name ? 1 : 1.02 }}
                    whileTap={{ scale: deleting === plugin.name ? 1 : 0.98 }}
                  >
                    {deleting === plugin.name ? 'DELETING...' : 'DELETE'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

