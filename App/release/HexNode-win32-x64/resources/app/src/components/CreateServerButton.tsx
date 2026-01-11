import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useServerManager } from "../hooks/useServerManager";

type ServerType = 'paper' | 'spigot' | 'vanilla' | 'fabric' | 'forge' | 'velocity' | 'waterfall' | 'bungeecord' | 'manual';

export default function CreateServerButton() {
  const { createServer } = useServerManager();
  const [isCreating, setIsCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [serverName, setServerName] = useState("");
  const [serverType, setServerType] = useState<ServerType>('paper');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [versions, setVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [manualJarPath, setManualJarPath] = useState<string | null>(null);
  const [ramGB, setRamGB] = useState(4);
  const [maxRAM, setMaxRAM] = useState(16); // Safe default
  const [settings, setSettings] = useState<any>(null);
  const ramSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load settings and system RAM
    const loadSettings = async () => {
      if (window.electronAPI) {
        try {
          const appSettings = await window.electronAPI.server.getAppSettings();
          setSettings(appSettings);
          setRamGB(appSettings.defaultRAM || 4);
          
          // Get system RAM info
          const systemInfo = await window.electronAPI.server.getSystemInfo();
          const systemMaxRAM = Math.max(4, Math.floor(systemInfo.memory.totalGB * 0.8));
          setMaxRAM(systemMaxRAM);
        } catch (error) {
          console.error('Failed to load settings:', error);
          // Fallback to safe default
          setMaxRAM(16);
        }
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (showInput && versions.length === 0) {
      loadVersions();
    }
  }, [showInput]);

  useEffect(() => {
    // Update green bar position for RAM slider
    if (ramSliderRef.current && showInput) {
      const slider = ramSliderRef.current.querySelector('input[type="range"]') as HTMLInputElement;
      const fill = ramSliderRef.current.querySelector('.ram-fill') as HTMLElement;
      if (slider && fill) {
        const updateFill = () => {
          const value = parseFloat(slider.value);
          const min = parseFloat(slider.min);
          const max = parseFloat(slider.max);
          const percentage = ((value - min) / (max - min)) * 100;
          const sliderWidth = slider.offsetWidth;
          const thumbWidth = 18;
          const thumbPosition = (percentage / 100) * (sliderWidth - thumbWidth) + (thumbWidth / 2);
          fill.style.width = `${Math.max(0, thumbPosition - (thumbWidth / 2))}px`;
        };
        updateFill();
        slider.addEventListener('input', updateFill);
        window.addEventListener('resize', updateFill);
        return () => {
          slider.removeEventListener('input', updateFill);
          window.removeEventListener('resize', updateFill);
        };
      }
    }
  }, [ramGB, maxRAM, showInput]);

  useEffect(() => {
    // Reload versions when server type changes
    if (showInput && serverType) {
      setSelectedVersion(null);
      setVersions([]);
      loadVersions();
    }
  }, [serverType]);

  const loadVersions = async () => {
    if (serverType === 'manual') {
      setVersions([]);
      setLoadingVersions(false);
      return;
    }

    setLoadingVersions(true);
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      let versionsList: string[] = [];
      
      switch (serverType) {
        case 'paper':
          versionsList = await window.electronAPI.server.getPaperVersions();
          break;
        case 'spigot':
          versionsList = await window.electronAPI.server.getSpigotVersions();
          break;
        case 'vanilla':
          versionsList = await window.electronAPI.server.getVanillaVersions();
          break;
        case 'fabric':
          versionsList = await window.electronAPI.server.getFabricVersions();
          break;
        case 'forge':
          versionsList = await window.electronAPI.server.getForgeVersions();
          break;
        case 'velocity':
          versionsList = await window.electronAPI.server.getVelocityVersions();
          break;
        case 'waterfall':
          versionsList = await window.electronAPI.server.getWaterfallVersions();
          break;
        case 'bungeecord':
          versionsList = await window.electronAPI.server.getBungeeCordVersions();
          break;
        default:
          versionsList = [];
      }

      if (versionsList.length === 0) {
        alert('Failed to load versions. Please check your internet connection and try again.');
        return;
      }

      setVersions(versionsList);
      // Auto-select latest version if none selected
      if (!selectedVersion && versionsList.length > 0) {
        setSelectedVersion(versionsList[versionsList.length - 1]);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      alert('Failed to load versions. Please check your internet connection and try again.');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSelectJar = async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.server.selectJarFile();
      if (result.success && result.path) {
        setManualJarPath(result.path);
      }
    } catch (error) {
      console.error('Failed to select jar file:', error);
      alert('Failed to select jar file');
    }
  };

  const handleCreate = async () => {
    if (!serverName.trim()) {
      alert('Please enter a server name');
      return;
    }

    if (serverType === 'manual') {
      if (!manualJarPath) {
        alert('Please select a JAR file');
        return;
      }
    } else {
      if (!selectedVersion) {
        alert('Please select a version');
        return;
      }
    }

    setIsCreating(true);
    try {
      // Replace spaces with underscores in server name
      const sanitizedServerName = serverName.trim().replace(/\s+/g, '_');
      const serverRAM = ramGB || settings?.defaultRAM || 4;
      const result = await createServer(
        sanitizedServerName,
        serverType,
        selectedVersion,
        serverRAM,
        manualJarPath
      );
      if (result.success) {
        setShowInput(false);
        setServerName("");
        setServerType('paper');
        setSelectedVersion(null);
        setManualJarPath(null);
        setRamGB(settings?.defaultRAM || 4);
      } else {
        alert(`Failed to create server: ${result.error || "Unknown error"}\n\nPlease check:\n- Java is installed\n- You have internet connection\n- Server name is valid`);
      }
    } catch (error: any) {
      alert(`Error creating server: ${error.message}\n\nPlease check:\n- Java is installed\n- You have internet connection`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setShowInput(false);
    setServerName("");
    setServerType('paper');
    setSelectedVersion(null);
    setManualJarPath(null);
    setRamGB(settings?.defaultRAM || 4);
  };

  const serverTypes = [
    { id: 'paper' as ServerType, name: 'Paper', description: 'High performance with plugin support', color: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-500/50', icon: '📄', category: 'server' },
    { id: 'spigot' as ServerType, name: 'Spigot', description: 'Plugin support, older alternative', color: 'from-yellow-500/20 to-orange-500/20', borderColor: 'border-yellow-500/50', icon: '🔧', category: 'server' },
    { id: 'vanilla' as ServerType, name: 'Vanilla', description: 'Official Minecraft server', color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/50', icon: '⚡', category: 'server' },
    { id: 'fabric' as ServerType, name: 'Fabric', description: 'Mod support with Fabric API', color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-500/50', icon: '🧵', category: 'server' },
    { id: 'forge' as ServerType, name: 'Forge', description: 'Mod support with Forge', color: 'from-red-500/20 to-rose-500/20', borderColor: 'border-red-500/50', icon: '🔥', category: 'server' },
    { id: 'velocity' as ServerType, name: 'Velocity', description: 'Modern proxy server', color: 'from-indigo-500/20 to-blue-500/20', borderColor: 'border-indigo-500/50', icon: '🚀', category: 'proxy' },
    { id: 'waterfall' as ServerType, name: 'Waterfall', description: 'BungeeCord fork proxy', color: 'from-teal-500/20 to-cyan-500/20', borderColor: 'border-teal-500/50', icon: '💧', category: 'proxy' },
    { id: 'bungeecord' as ServerType, name: 'BungeeCord', description: 'Original proxy server', color: 'from-amber-500/20 to-yellow-500/20', borderColor: 'border-amber-500/50', icon: '🌊', category: 'proxy' },
    { id: 'manual' as ServerType, name: 'Manual', description: 'Select your own JAR file', color: 'from-gray-500/20 to-slate-500/20', borderColor: 'border-gray-500/50', icon: '📁', category: 'manual' },
  ];

  if (showInput) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-8" style={{ pointerEvents: 'auto' }}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleCancel}></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="system-card p-6 w-full max-w-[800px] relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
        <h3 className="text-lg font-semibold text-text-primary font-mono mb-6">
          CREATE SERVER
        </h3>
        
        <div className="space-y-6 relative z-10">
          {/* Server Name */}
          <div>
            <label className="block text-sm text-text-secondary font-mono mb-2">
              Server Name
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => {
                // Replace spaces with underscores as user types
                const sanitized = e.target.value.replace(/\s+/g, '_');
                setServerName(sanitized);
              }}
              placeholder="my-server"
              className="w-full bg-background-secondary border border-border px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded relative z-10"
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreate();
                } else if (e.key === "Escape") {
                  handleCancel();
                }
              }}
              autoFocus
              style={{ pointerEvents: 'auto' }}
            />
          </div>

          {/* Server Type - Card Selection */}
          <div>
            <label className="block text-sm text-text-secondary font-mono mb-3">
              Server Type
            </label>
            <div className="space-y-4">
              {/* Game Servers */}
              <div>
                <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wider">Game Servers</div>
                <div className="grid grid-cols-2 gap-3">
                  {serverTypes.filter(t => t.category === 'server').map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => !isCreating && setServerType(type.id)}
                      disabled={isCreating}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        serverType === type.id
                          ? `${type.borderColor} bg-gradient-to-br ${type.color}`
                          : 'border-border bg-background-secondary hover:border-border/80'
                      } disabled:opacity-50 disabled:cursor-not-allowed relative z-10`}
                      whileHover={!isCreating ? { scale: 1.02 } : {}}
                      whileTap={!isCreating ? { scale: 0.98 } : {}}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-semibold text-text-primary text-sm mb-1">
                            {type.name}
                            {type.id === 'paper' && (
                              <span className="ml-2 text-xs text-accent">(Recommended)</span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted font-mono">
                            {type.description}
                          </div>
                        </div>
                        {serverType === type.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-5 w-5 rounded-full bg-accent flex items-center justify-center"
                          >
                            <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Proxy Servers */}
              <div>
                <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wider">Proxy Servers</div>
                <div className="grid grid-cols-3 gap-3">
                  {serverTypes.filter(t => t.category === 'proxy').map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => !isCreating && setServerType(type.id)}
                      disabled={isCreating}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        serverType === type.id
                          ? `${type.borderColor} bg-gradient-to-br ${type.color}`
                          : 'border-border bg-background-secondary hover:border-border/80'
                      } disabled:opacity-50 disabled:cursor-not-allowed relative z-10`}
                      whileHover={!isCreating ? { scale: 1.02 } : {}}
                      whileTap={!isCreating ? { scale: 0.98 } : {}}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-semibold text-text-primary text-sm mb-1">
                            {type.name}
                          </div>
                          <div className="text-xs text-text-muted font-mono">
                            {type.description}
                          </div>
                        </div>
                        {serverType === type.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-5 w-5 rounded-full bg-accent flex items-center justify-center"
                          >
                            <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Manual */}
              <div>
                <div className="text-xs text-text-muted font-mono mb-2 uppercase tracking-wider">Other</div>
                <div className="grid grid-cols-1 gap-3">
                  {serverTypes.filter(t => t.category === 'manual').map((type) => (
                    <motion.button
                      key={type.id}
                      onClick={() => !isCreating && setServerType(type.id)}
                      disabled={isCreating}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        serverType === type.id
                          ? `${type.borderColor} bg-gradient-to-br ${type.color}`
                          : 'border-border bg-background-secondary hover:border-border/80'
                      } disabled:opacity-50 disabled:cursor-not-allowed relative z-10`}
                      whileHover={!isCreating ? { scale: 1.02 } : {}}
                      whileTap={!isCreating ? { scale: 0.98 } : {}}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-semibold text-text-primary text-sm mb-1">
                            {type.name}
                          </div>
                          <div className="text-xs text-text-muted font-mono">
                            {type.description}
                          </div>
                        </div>
                        {serverType === type.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-5 w-5 rounded-full bg-accent flex items-center justify-center"
                          >
                            <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Version Selection or Manual JAR */}
          {serverType === 'manual' ? (
            <div>
              <label className="block text-sm text-text-secondary font-mono mb-2">
                JAR File
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualJarPath || ''}
                  placeholder="No file selected"
                  readOnly
                  className="flex-1 bg-background-secondary border border-border px-4 py-3 text-text-primary font-mono text-sm rounded relative z-10"
                  style={{ pointerEvents: 'auto' }}
                />
                <motion.button
                  onClick={handleSelectJar}
                  disabled={isCreating}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                  whileHover={!isCreating ? { scale: 1.02 } : {}}
                  whileTap={!isCreating ? { scale: 0.98 } : {}}
                  style={{ pointerEvents: 'auto' }}
                >
                  BROWSE
                </motion.button>
              </div>
              {manualJarPath && (
                <p className="text-xs text-text-muted font-mono mt-2">
                  Selected: {manualJarPath.split(/[/\\]/).pop()}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm text-text-secondary font-mono mb-3">
                Version
              </label>
              {loadingVersions ? (
                <div className="text-text-muted font-mono text-sm py-8 text-center">
                  Loading versions...
                </div>
              ) : versions.length === 0 ? (
                <div className="text-red-400 font-mono text-sm py-8 text-center">
                  Failed to load versions. Please try again.
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar border border-border rounded-lg p-3 bg-background-secondary">
                  <div className="grid grid-cols-3 gap-2">
                    {versions.map((version) => {
                      const isLatest = version === versions[0]; // First version is latest (newest first)
                      const isSelected = selectedVersion === version;
                      return (
                        <motion.button
                          key={version}
                          onClick={() => !isCreating && setSelectedVersion(version)}
                          disabled={isCreating}
                          className={`relative p-3 rounded border-2 transition-all text-center font-mono text-sm ${
                            isSelected
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border bg-background hover:border-border/80 text-text-primary'
                          } disabled:opacity-50 disabled:cursor-not-allowed relative z-10`}
                          whileHover={!isCreating ? { scale: 1.05 } : {}}
                          whileTap={!isCreating ? { scale: 0.95 } : {}}
                          style={{ pointerEvents: 'auto' }}
                        >
                          {version}
                          {isLatest && (
                            <span className="absolute -top-1 -right-1 bg-accent text-background text-[10px] px-1.5 py-0.5 rounded font-mono">
                              LATEST
                            </span>
                          )}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1 right-1"
                            >
                              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RAM Allocation */}
          <div className="text-text-secondary font-mono text-sm">
            <label className="block mb-2 text-text-primary">RAM Allocation: {ramGB}GB</label>
            <div className="flex items-center gap-4 relative">
              <div className="flex-1 relative h-2" ref={ramSliderRef}>
                {/* Filled portion - calculated dynamically to stop at thumb */}
                <div 
                  className="ram-fill absolute inset-y-0 left-0 h-2 bg-accent rounded-l-lg pointer-events-none"
                  style={{ zIndex: 1 }}
                ></div>
                {/* Slider input */}
                <input
                  type="range"
                  min="1"
                  max={maxRAM}
                  value={ramGB}
                  onChange={(e) => setRamGB(parseInt(e.target.value))}
                  disabled={isCreating}
                  className="absolute inset-0 w-full h-2 appearance-none cursor-pointer slider-custom bg-transparent"
                  style={{ zIndex: 5 }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-text-muted font-mono mt-1">
              <span>1GB</span>
              <span>{maxRAM}GB</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 relative z-10">
          <motion.button
            onClick={handleCreate}
            disabled={isCreating || !serverName.trim() || (serverType !== 'manual' && !selectedVersion) || (serverType === 'manual' && !manualJarPath)}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
            whileHover={{ scale: (isCreating || !serverName.trim() || (serverType !== 'manual' && !selectedVersion) || (serverType === 'manual' && !manualJarPath)) ? 1 : 1.02 }}
            whileTap={{ scale: (isCreating || !serverName.trim() || (serverType !== 'manual' && !selectedVersion) || (serverType === 'manual' && !manualJarPath)) ? 1 : 0.98 }}
            style={{ pointerEvents: 'auto' }}
          >
            {isCreating ? "CREATING..." : "CREATE SERVER"}
          </motion.button>
          <motion.button
            onClick={handleCancel}
            disabled={isCreating}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
            whileHover={{ scale: isCreating ? 1 : 1.02 }}
            whileTap={{ scale: isCreating ? 1 : 0.98 }}
            style={{ pointerEvents: 'auto' }}
          >
            CANCEL
          </motion.button>
        </div>
      </motion.div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={() => setShowInput(true)}
      className="btn-primary"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      CREATE SERVER
    </motion.button>
  );
}
