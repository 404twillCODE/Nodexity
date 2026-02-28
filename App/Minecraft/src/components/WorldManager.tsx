import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";
import FileEditor from "./FileEditor";

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
  const [deletingWorld, setDeletingWorld] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [worldFilesPath, setWorldFilesPath] = useState<string | null>(null);
  const [worldFilesKey, setWorldFilesKey] = useState(0);
  const { notify } = useToast();

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

  const handleDeleteWorld = async (worldName: string) => {
    if (confirmDelete !== worldName) {
      setConfirmDelete(worldName);
      return;
    }
    if (!window.electronAPI) return;
    setDeletingWorld(worldName);
    try {
      const result = await window.electronAPI.server.deleteWorld(serverName, worldName);
      if (result.success) {
        setWorlds((prev) => prev.filter((w) => w.name !== worldName));
        setConfirmDelete(null);
        notify({
          type: "success",
          title: "World deleted",
          message: `"${worldName}" has been permanently deleted.`,
        });
      } else {
        notify({
          type: "error",
          title: "Delete failed",
          message: result.error || "Could not delete the world.",
        });
        setConfirmDelete(null);
      }
    } catch (error: unknown) {
      notify({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Could not delete the world.",
      });
      setConfirmDelete(null);
    } finally {
      setDeletingWorld(null);
    }
  };

  const openWorldFiles = (worldName: string) => {
    setWorldFilesPath(worldName);
    setWorldFilesKey((prev) => prev + 1);
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
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-4xl">🌍</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-text-primary font-mono mb-2">
                      {world.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-text-secondary font-mono">
                      <span>Size: {formatSize(world.size)}</span>
                      <span>Modified: {formatDate(world.modified)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => openWorldFiles(world.name)}
                      className="btn-secondary text-xs px-3 py-1.5"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      EDIT FILES
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteWorld(world.name)}
                      disabled={deletingWorld === world.name}
                      className={`text-xs px-3 py-1.5 font-mono uppercase tracking-wider transition-colors disabled:opacity-50 ${
                        confirmDelete === world.name
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400"
                      }`}
                      whileHover={{ scale: deletingWorld === world.name ? 1 : 1.02 }}
                      whileTap={{ scale: deletingWorld === world.name ? 1 : 0.98 }}
                    >
                      {deletingWorld === world.name
                        ? "DELETING..."
                        : confirmDelete === world.name
                        ? "CONFIRM DELETE"
                        : "DELETE"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {worldFilesPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
          <div
            className="system-card w-full max-w-5xl overflow-hidden relative flex flex-col bg-background border border-border rounded-lg shadow-xl"
            style={{ height: '85vh', maxHeight: '85vh' }}
            key={worldFilesKey}
          >
            <div className="flex items-center justify-between border-b border-border bg-background-secondary px-4 py-3 flex-shrink-0">
              <div className="text-sm font-mono text-text-secondary">
                World Files: {worldFilesPath}
              </div>
              <motion.button
                onClick={() => setWorldFilesPath(null)}
                className="btn-secondary text-xs px-3 py-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CLOSE
              </motion.button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <FileEditor key={worldFilesPath} serverName={serverName} initialPath={worldFilesPath} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


