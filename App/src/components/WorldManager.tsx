import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";
import FileEditor from "./FileEditor";

const REGION_REGEX = /^r\.(-?\d+)\.(-?\d+)\.mca$/;

interface WorldManagerProps {
  serverName: string;
}

interface World {
  name: string;
  size: number;
  modified: string;
}

function WorldMapStrip({ serverName, worldPath }: { serverName: string; worldPath: string }) {
  const [regionSet, setRegionSet] = useState<Set<string>>(new Set());
  const [bounds, setBounds] = useState({ minX: 0, maxX: 0, minZ: 0, maxZ: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!window.electronAPI) return;
      setLoading(true);
      try {
        const path = worldPath.replace(/\/$/, '') + '/region';
        const result = await window.electronAPI.server.getServerFiles(serverName, path);
        if (cancelled) return;
        if (!result.success || !result.items) {
          setRegionSet(new Set());
          setBounds({ minX: 0, maxX: 0, minZ: 0, maxZ: 0 });
          setLoading(false);
          return;
        }
        const set = new Set<string>();
        let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
        for (const item of result.items) {
          if (item.type !== 'file' || !item.name.endsWith('.mca')) continue;
          const m = item.name.match(REGION_REGEX);
          if (!m) continue;
          const x = parseInt(m[1], 10);
          const z = parseInt(m[2], 10);
          set.add(`${x},${z}`);
          if (set.size === 1) {
            minX = maxX = x;
            minZ = maxZ = z;
          } else {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
          }
        }
        setRegionSet(set);
        setBounds({ minX, maxX, minZ, maxZ });
      } catch (e) {
        if (!cancelled) setRegionSet(new Set());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [serverName, worldPath]);

  const width = Math.max(1, bounds.maxX - bounds.minX + 1);
  const height = Math.max(1, bounds.maxZ - bounds.minZ + 1);
  const cellPx = Math.min(12, Math.max(6, Math.floor(200 / Math.max(width, height, 1))));
  const gridW = width * cellPx;
  const gridH = height * cellPx;

  return (
    <div className="w-full min-h-[100px] py-3 px-4 flex flex-col gap-2">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs font-mono text-text-muted uppercase tracking-wider whitespace-nowrap">
          World map (regions)
        </span>
        {loading ? (
          <div className="text-xs text-text-muted font-mono">Loading region files…</div>
        ) : regionSet.size === 0 ? (
          <div className="text-xs text-text-muted font-mono max-w-xl">
            No region files yet. To get a map to appear: load the world in Minecraft and explore a bit so the server generates chunk files; then reopen the app or refresh the Worlds view and the map should show the region grid.
          </div>
        ) : (
          <>
            <div
              className="overflow-auto rounded border border-border custom-scrollbar flex-shrink-0"
              style={{ maxWidth: 360, maxHeight: 120, minWidth: 80, minHeight: 60 }}
            >
              <div
                style={{
                  width: gridW,
                  height: gridH,
                  minWidth: gridW,
                  minHeight: gridH,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${width}, ${cellPx}px)`,
                  gridTemplateRows: `repeat(${height}, ${cellPx}px)`,
                  gap: 0,
                }}
              >
                {Array.from({ length: width * height }, (_, i) => {
                  const ix = i % width;
                  const iz = Math.floor(i / width);
                  const x = bounds.minX + ix;
                  const z = bounds.minZ + iz;
                  const key = `${x},${z}`;
                  const filled = regionSet.has(key);
                  return (
                    <div
                      key={key}
                      title={`Region r.${x}.${z}.mca`}
                      className={filled ? 'bg-accent/70 hover:bg-accent' : 'bg-background/50'}
                      style={{ width: cellPx, height: cellPx, minWidth: cellPx, minHeight: cellPx }}
                    />
                  );
                })}
              </div>
            </div>
            <span className="text-xs text-text-muted font-mono">
              {regionSet.size} region{regionSet.size !== 1 ? 's' : ''} · {width}×{height}
            </span>
          </>
        )}
      </div>
      {!loading && (
        <p className="text-xs text-text-muted font-mono">
          Regions are generated when you play the world. To get a map to appear: load the world in Minecraft and explore a bit so the server generates chunk files; then reopen the app or refresh the Worlds view and the map should show the region grid.
        </p>
      )}
    </div>
  );
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

        {/* World map on main view - show for first world when no overlay */}
        {!worldFilesPath && worlds.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
              World map (regions)
            </h3>
            <div className="system-card p-4">
              <WorldMapStrip serverName={serverName} worldPath={worlds[0].name} />
            </div>
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
              <div className="flex-1 min-h-0 overflow-hidden">
                <FileEditor key={worldFilesPath} serverName={serverName} initialPath={worldFilesPath} />
              </div>
              <div className="flex-shrink-0 w-full border-t border-border bg-background-secondary" style={{ minHeight: 100 }}>
                <WorldMapStrip serverName={serverName} worldPath={worldFilesPath} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


