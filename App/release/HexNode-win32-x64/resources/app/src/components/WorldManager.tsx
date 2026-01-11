import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface WorldManagerProps {
  serverName: string;
}

interface World {
  name: string;
  size: number;
  modified: string;
}

export default function WorldManager({ serverName }: WorldManagerProps) {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorlds();
  }, [serverName]);

  const loadWorlds = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.server.listWorlds(serverName);
      if (result.success) {
        setWorlds(result.worlds || []);
      }
    } catch (error) {
      console.error('Failed to load worlds:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary font-mono mb-2">
            World Manager
          </h2>
          <p className="text-text-secondary font-mono text-sm">
            View and manage your server worlds
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-text-muted font-mono text-sm">Loading worlds...</div>
          </div>
        ) : worlds.length === 0 ? (
          <div className="system-card p-12 text-center">
            <div className="text-4xl mb-4 opacity-20">🌍</div>
            <h3 className="text-lg font-semibold text-text-primary font-mono mb-2">
              NO WORLDS FOUND
            </h3>
            <p className="text-text-muted font-mono text-sm">
              Worlds will appear here once your server generates them
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {worlds.map((world) => (
              <motion.div
                key={world.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="system-card p-6"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🌍</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary font-mono mb-2">
                      {world.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-text-secondary font-mono">
                      <span>Size: {formatSize(world.size)}</span>
                      <span>Modified: {formatDate(world.modified)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

