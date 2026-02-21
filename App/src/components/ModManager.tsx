import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";
import FileEditor from "./FileEditor";

interface ModManagerProps {
  serverName: string;
}

interface Mod {
  name: string;
  size: number;
  modified: string;
}

interface ModrinthMod {
  project_id: string;
  title: string;
  description: string;
  slug: string;
  downloads: number;
  icon_url?: string;
  versions?: string[];
}

export default function ModManager({ serverName }: ModManagerProps) {
  const [mods, setMods] = useState<Mod[]>([]);
  const [modrinthMods, setModrinthMods] = useState<ModrinthMod[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingModrinth, setLoadingModrinth] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [supportsMods, setSupportsMods] = useState<boolean | null>(null);
  const [minecraftVersion, setMinecraftVersion] = useState<string | null>(null);
  const [loader, setLoader] = useState<string>("fabric");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [modrinthLimit, setModrinthLimit] = useState(200);
  const [configPath, setConfigPath] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [configKey, setConfigKey] = useState(0);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { notify } = useToast();
  const modrinthListRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollRef = useRef<number | null>(null);

  useEffect(() => {
    checkModSupport();
  }, [serverName]);

  useEffect(() => {
    if (supportsMods) {
      loadMods();
    }
  }, [serverName, supportsMods]);

  useEffect(() => {
    if (showInstallModal && supportsMods) {
      loadModrinthMods();
    }
  }, [showInstallModal, supportsMods, modrinthLimit, loader]);

  const checkModSupport = async () => {
    if (!window.electronAPI || !window.electronAPI.server) return;
    if (typeof window.electronAPI.server.checkJarSupportsMods !== "function") {
      setSupportsMods(false);
      return;
    }
    try {
      const result = await window.electronAPI.server.checkJarSupportsMods(serverName);
      const supports = result?.supportsMods ?? false;
      setSupportsMods(supports);
      if (supports && window.electronAPI) {
        try {
          const servers = await window.electronAPI.server.listServers();
          const server = servers.find((s: { name: string; version?: string; serverType?: string }) => s.name === serverName);
          if (server?.version && server.version !== "manual" && server.version !== "unknown") {
            setMinecraftVersion(server.version);
          } else {
            const config = await window.electronAPI.server.getServerConfig(serverName);
            if (config?.version && config.version !== "manual" && config.version !== "unknown") {
              setMinecraftVersion(config.version);
            }
          }
          const serverType = (server?.serverType || "").toLowerCase();
          setLoader(serverType === "forge" ? "forge" : "fabric");
        } catch {
          setLoader("fabric");
        }
      }
    } catch {
      setSupportsMods(false);
    }
  };

  const loadMods = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.server.listMods(serverName);
      if (result.success) {
        setMods(result.mods || []);
        if (result.supportsMods !== undefined) {
          setSupportsMods(result.supportsMods);
        }
      }
    } catch (error) {
      console.error("Failed to load mods:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadModrinthMods = async () => {
    if (!window.electronAPI?.server?.getModrinthMods) return;
    setLoadingModrinth(true);
    try {
      const list = await window.electronAPI.server.getModrinthMods(minecraftVersion, loader, modrinthLimit);
      setModrinthMods((list || []) as unknown as ModrinthMod[]);
    } catch (error) {
      console.error("Failed to load Modrinth mods:", error);
    } finally {
      setLoadingModrinth(false);
    }
  };

  const normalizeName = (value: string) =>
    value
      .toLowerCase()
      .replace(/\.jar$/i, "")
      .replace(/[^a-z0-9]/g, "");

  const installedModKeys = useMemo(() => new Set(mods.map((m) => normalizeName(m.name))), [mods]);

  const filteredModrinthMods = useMemo(() => {
    const matchesSearch = (mod: ModrinthMod) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        mod.title.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.slug.toLowerCase().includes(q)
      );
    };
    return modrinthMods.filter((mod) => {
      const nTitle = normalizeName(mod.title);
      const nSlug = normalizeName(mod.slug);
      if (installedModKeys.has(nTitle) || installedModKeys.has(nSlug)) return false;
      return matchesSearch(mod);
    });
  }, [modrinthMods, searchQuery, installedModKeys]);

  useEffect(() => {
    if (restoreScrollRef.current === null) return;
    if (modrinthListRef.current) modrinthListRef.current.scrollTop = restoreScrollRef.current;
    restoreScrollRef.current = null;
  }, [filteredModrinthMods.length]);

  const handleDeleteConfirmed = async (modName: string) => {
    if (!window.electronAPI) return;
    setDeleting(modName);
    try {
      const result = await window.electronAPI.server.deleteMod(serverName, modName);
      if (result.success) {
        await loadMods();
      } else {
        notify({ type: "error", title: "Delete failed", message: result.error || "Unable to delete the mod." });
      }
    } catch (error: unknown) {
      notify({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Unable to delete the mod.",
      });
    } finally {
      setDeleting(null);
    }
  };

  const openModConfig = async () => {
    if (!window.electronAPI) return;
    const preferredPath = `config`;
    try {
      const result = await window.electronAPI.server.getServerFiles(serverName, preferredPath);
      if (result.success) {
        setConfigPath(preferredPath);
        setConfigKey((prev) => prev + 1);
      } else {
        setConfigPath(".");
        setConfigKey((prev) => prev + 1);
      }
    } catch {
      setConfigPath(".");
      setConfigKey((prev) => prev + 1);
    }
  };

  const handleInstall = async (projectId: string, modTitle: string) => {
    if (!window.electronAPI || !minecraftVersion) {
      notify({ type: "error", title: "Install failed", message: "Minecraft version not available." });
      return;
    }
    if (!window.electronAPI.server.installModrinthMod) {
      notify({ type: "error", title: "Install unavailable", message: "Install function not available. Please restart the app." });
      return;
    }
    setInstalling(projectId);
    try {
      const result = await window.electronAPI.server.installModrinthMod(serverName, projectId, minecraftVersion);
      if (result.success) {
        notify({ type: "success", title: "Mod installed", message: `${modTitle} is ready.` });
        await loadMods();
      } else {
        notify({ type: "error", title: "Install failed", message: result.error || "Unable to install the mod." });
      }
    } catch (error: unknown) {
      notify({
        type: "error",
        title: "Install failed",
        message: error instanceof Error ? error.message : "Unable to install the mod.",
      });
    } finally {
      setInstalling(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (supportsMods === false) {
    return (
      <div className="h-full overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="system-card p-12 text-center">
            <div className="text-4xl mb-4 opacity-20">🚫</div>
            <h3 className="text-lg font-semibold text-text-primary font-mono mb-2">MODS NOT SUPPORTED</h3>
            <p className="text-text-muted font-mono text-sm">
              This server type does not support mods. Only Fabric and Forge servers support mods.
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
          <h2 className="text-xl font-semibold text-text-primary font-mono mb-2">Mod Manager</h2>
          <p className="text-text-secondary font-mono text-sm">Manage your server mods</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-mono">Installed Mods</h3>
            <motion.button
              onClick={() => setShowInstallModal(true)}
              className="btn-primary text-sm px-4 py-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Install mods
            </motion.button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-text-muted font-mono text-sm">Loading mods...</div>
            </div>
          ) : mods.length === 0 ? (
            <div className="system-card p-8 text-center">
              <div className="text-3xl mb-3 opacity-20">📦</div>
              <h4 className="text-md font-semibold text-text-primary font-mono mb-2">NO MODS INSTALLED</h4>
              <p className="text-text-muted font-mono text-sm">
                Mods will appear here once you add them to the mods folder
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mods.map((mod) => (
                <motion.div
                  key={mod.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="system-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📦</span>
                        <h4 className="text-lg font-semibold text-text-primary font-mono truncate">{mod.name}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary font-mono ml-11">
                        <span>Size: {formatSize(mod.size)}</span>
                        <span>Modified: {formatDate(mod.modified)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => openModConfig()}
                        className="btn-secondary text-xs px-3 py-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        CONFIG
                      </motion.button>
                      <motion.button
                        onClick={() => setDeleteTarget(mod.name)}
                        disabled={deleting === mod.name}
                        className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                        whileHover={{ scale: deleting === mod.name ? 1 : 1.02 }}
                        whileTap={{ scale: deleting === mod.name ? 1 : 0.98 }}
                      >
                        {deleting === mod.name ? "DELETING..." : "DELETE"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
          <div className="system-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background border border-border rounded-lg shadow-xl">
            <div className="flex items-center justify-between border-b border-border bg-background-secondary px-4 py-3 flex-shrink-0">
              <h3 className="text-lg font-semibold text-text-primary font-mono">
                Install mods from Modrinth ({loader})
              </h3>
              <motion.button
                onClick={() => setShowInstallModal(false)}
                className="btn-secondary text-xs px-3 py-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CLOSE
              </motion.button>
            </div>
            <div className="p-4 flex-shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mods by name, description..."
                className="w-full bg-background border border-border px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded transition-colors"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-0 custom-scrollbar">
              {loadingModrinth && modrinthMods.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-text-muted font-mono text-sm">Loading mods from Modrinth...</div>
                  <div className="text-xs text-text-muted font-mono mt-2">This may take a moment</div>
                </div>
              ) : modrinthMods.length === 0 ? (
                <div className="system-card p-8 text-center">
                  <div className="text-3xl mb-3 opacity-20">📦</div>
                  <h4 className="text-md font-semibold text-text-primary font-mono mb-2">NO MODS FOUND</h4>
                  <p className="text-text-muted font-mono text-sm">
                    {minecraftVersion
                      ? `No ${loader} mods found for Minecraft ${minecraftVersion}`
                      : "Unable to determine Minecraft version"}
                  </p>
                </div>
              ) : (
                <div ref={modrinthListRef} className="space-y-3">
                  {filteredModrinthMods.map((mod) => (
                    <motion.div
                      key={mod.project_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="system-card p-4"
                    >
                      <div className="flex items-center gap-4">
                        {mod.icon_url && (
                          <img
                            src={mod.icon_url}
                            alt={mod.title}
                            className="w-12 h-12 rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-text-primary font-mono truncate mb-1">
                            {mod.title}
                          </h4>
                          <p className="text-sm text-text-secondary font-mono line-clamp-2 mb-2">{mod.description}</p>
                          <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                            <span>Downloads: {mod.downloads.toLocaleString()}</span>
                            <a
                              href={`https://modrinth.com/mod/${mod.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              View on Modrinth →
                            </a>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => handleInstall(mod.project_id, mod.title)}
                          disabled={installing === mod.project_id || !minecraftVersion}
                          className="btn-primary text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          whileHover={{ scale: installing === mod.project_id ? 1 : 1.02 }}
                          whileTap={{ scale: installing === mod.project_id ? 1 : 0.98 }}
                        >
                          {installing === mod.project_id ? "INSTALLING..." : "INSTALL"}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                  {filteredModrinthMods.length === 0 && searchQuery.trim() && (
                    <div className="system-card p-8 text-center">
                      <div className="text-3xl mb-3 opacity-20">🔍</div>
                      <h4 className="text-md font-semibold text-text-primary font-mono mb-2">NO RESULTS FOUND</h4>
                      <p className="text-text-muted font-mono text-sm">No mods match "{searchQuery}"</p>
                    </div>
                  )}
                  {!searchQuery.trim() && (
                    <div className="flex justify-center pt-2">
                      {loadingModrinth && modrinthMods.length > 0 ? (
                        <div className="text-text-muted font-mono text-sm py-2 flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                          Loading more...
                        </div>
                      ) : modrinthMods.length >= modrinthLimit ? (
                        <motion.button
                          onClick={() => {
                            if (modrinthListRef.current) restoreScrollRef.current = modrinthListRef.current.scrollTop;
                            setModrinthLimit((prev) => prev + 200);
                          }}
                          className="btn-secondary text-xs px-4 py-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          LOAD MORE
                        </motion.button>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {configPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
          <div className="system-card w-full max-w-5xl h-[80vh] overflow-hidden relative" key={configKey}>
            <div className="flex items-center justify-between border-b border-border bg-background-secondary px-4 py-3">
              <div className="text-sm font-mono text-text-secondary">Config: {configPath}</div>
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
            <div className="text-lg font-semibold text-text-primary font-mono mb-2">Delete mod?</div>
            <p className="text-text-secondary font-mono text-sm mb-6">Are you sure you want to delete {deleteTarget}?</p>
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
                  if (target) await handleDeleteConfirmed(target);
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
