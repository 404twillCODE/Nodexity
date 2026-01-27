import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useServerManager } from "../hooks/useServerManager";

type ServerType = 'paper' | 'spigot' | 'vanilla' | 'fabric' | 'forge' | 'purpur' | 'velocity' | 'waterfall' | 'bungeecord' | 'manual';

export default function CreateServerButton() {
  const { createServer, startServer } = useServerManager();
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
  const [serverPort, setServerPort] = useState(25565);
  const [createStep, setCreateStep] = useState(0);
  const [portMessage, setPortMessage] = useState<string | null>(null);
  const [creatingStatus, setCreatingStatus] = useState("Creating server files...");
  const [autoStart, setAutoStart] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const ramSliderRef = useRef<HTMLDivElement>(null);
  const portCheckTimeoutRef = useRef<number | null>(null);
  const stepLabels = ['Server Type', 'Version', 'Settings'];

  useEffect(() => {
    // Load settings and system RAM
    const loadSettings = async () => {
      if (window.electronAPI) {
        try {
          const appSettings = await window.electronAPI.server.getAppSettings();
          setSettings(appSettings);
          setRamGB(appSettings.defaultRAM || 4);
          setServerPort(appSettings.defaultPort || 25565);
          
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
    if (!showInput || !window.electronAPI?.server?.findAvailablePort) return;
    if (serverPort < 1024 || serverPort > 65535) return;

    if (portCheckTimeoutRef.current) {
      window.clearTimeout(portCheckTimeoutRef.current);
    }

    portCheckTimeoutRef.current = window.setTimeout(async () => {
      try {
        const suggestedPort = await window.electronAPI!.server.findAvailablePort(serverPort);
        if (suggestedPort && suggestedPort !== serverPort) {
          setServerPort(suggestedPort);
          setPortMessage(`Port ${serverPort} is in use. Switched to ${suggestedPort}.`);
        } else {
          setPortMessage(null);
        }
      } catch (error) {
        console.error('Failed to check port availability:', error);
      }
    }, 250);

    return () => {
      if (portCheckTimeoutRef.current) {
        window.clearTimeout(portCheckTimeoutRef.current);
        portCheckTimeoutRef.current = null;
      }
    };
  }, [serverPort, showInput]);

  useEffect(() => {
    // Update green bar position for RAM slider
    if (ramSliderRef.current && showInput && createStep === 2) {
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
        const rafId = requestAnimationFrame(updateFill);
        slider.addEventListener('input', updateFill);
        window.addEventListener('resize', updateFill);
        return () => {
          cancelAnimationFrame(rafId);
          slider.removeEventListener('input', updateFill);
          window.removeEventListener('resize', updateFill);
        };
      }
    }
  }, [ramGB, maxRAM, showInput, createStep]);

  useEffect(() => {
    // Reload versions when server type changes
    if (showInput && serverType) {
      setSelectedVersion(null);
      setVersions([]);
      setErrorMessage(null);
      setWarningMessage(null);
      loadVersions();
      
      // Set warning messages for specific server types
      if (serverType === 'spigot') {
        setWarningMessage('Spigot requires BuildTools for newer versions. Older versions may be available for direct download.');
      } else if (serverType === 'forge') {
        setWarningMessage('Forge installation may require manual setup. We will attempt automatic download, but you may need to use the installer from files.minecraftforge.net');
      } else if (serverType === 'bungeecord') {
        setWarningMessage('BungeeCord downloads may be limited. If download fails, please download manually from spigotmc.org/wiki/bungeecord');
      } else {
        setWarningMessage(null);
      }
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
        case 'purpur':
          versionsList = await window.electronAPI.server.getPurpurVersions();
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
        setErrorMessage('Failed to load versions. Please check your internet connection and try again.');
        return;
      }

      setVersions(versionsList);
      // Auto-select latest version if none selected (first item is newest)
      if (!selectedVersion && versionsList.length > 0) {
        setSelectedVersion(versionsList[0]);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      setErrorMessage('Failed to load versions. Please check your internet connection and try again.');
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
      setErrorMessage('Failed to select JAR file.');
    }
  };

  const handleSelectType = (type: ServerType) => {
    if (isCreating) return;
    setServerType(type);
    setSelectedVersion(null);
    setManualJarPath(null);
  };

  const handleCreate = async () => {
    if (!serverName.trim()) {
      setErrorMessage('Please enter a server name.');
      return;
    }

    if (serverType === 'manual') {
      if (!manualJarPath) {
        setErrorMessage('Please select a JAR file.');
        return;
      }
    } else {
      if (!selectedVersion) {
        setErrorMessage('Please select a version.');
        return;
      }
    }

    if (serverPort < 1024 || serverPort > 65535) {
      setErrorMessage('Please enter a valid port (1024-65535).');
      return;
    }

    setCreatingStatus(serverType === 'manual' ? 'Copying server files...' : 'Creating server files...');
    setIsCreating(true);
    try {
      // Replace spaces with dashes for folder name, but keep original for display
      const sanitizedServerName = serverName.trim().replace(/\s+/g, '-');
      const displayName = serverName.trim(); // Keep original with spaces for display
      const serverRAM = ramGB || settings?.defaultRAM || 4;
      const result = await createServer(
        sanitizedServerName,
        serverType,
        selectedVersion,
        serverRAM,
        serverPort,
        manualJarPath,
        displayName // Pass display name separately
      );
      if (result.success) {
        if (autoStart) {
          setCreatingStatus("Starting server...");
          const startResult = await startServer(sanitizedServerName, serverRAM);
          if (!startResult.success) {
            setErrorMessage(startResult.error || "Server created, but failed to start.");
            return;
          }
        }
        setShowInput(false);
        setServerName("");
        setServerType('paper');
        setSelectedVersion(null);
        setManualJarPath(null);
        setRamGB(settings?.defaultRAM || 4);
        setServerPort(settings?.defaultPort || 25565);
        setCreateStep(0);
        setErrorMessage(null);
        setWarningMessage(null);
        setPortMessage(null);
        setAutoStart(true);
      } else {
        // Show error in UI instead of alert
        const errorMsg = result.error || "Unknown error";
        setErrorMessage(errorMsg);
        
        // Add helpful links based on server type
        if (serverType === 'spigot' && errorMsg.includes('BuildTools')) {
          setWarningMessage('Download BuildTools: https://www.spigotmc.org/wiki/buildtools/');
        } else if (serverType === 'forge' && errorMsg.includes('installer')) {
          setWarningMessage('Download Forge Installer: https://files.minecraftforge.net/');
        } else if (serverType === 'bungeecord' && errorMsg.includes('download')) {
          setWarningMessage('Download BungeeCord: https://www.spigotmc.org/wiki/bungeecord/');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Unknown error occurred");
    } finally {
      setCreatingStatus("Creating server files...");
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
    setServerPort(settings?.defaultPort || 25565);
    setCreateStep(0);
    setPortMessage(null);
    setAutoStart(true);
  };

  const serverTypes = [
    { id: 'paper' as ServerType, name: 'Paper', description: 'High performance with plugin support', color: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-500/50', icon: '📄', category: 'server' },
    { id: 'spigot' as ServerType, name: 'Spigot', description: 'Plugin support, older alternative', color: 'from-yellow-500/20 to-orange-500/20', borderColor: 'border-yellow-500/50', icon: '🔧', category: 'server' },
    { id: 'vanilla' as ServerType, name: 'Vanilla', description: 'Official Minecraft server', color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/50', icon: '⚡', category: 'server' },
    { id: 'fabric' as ServerType, name: 'Fabric', description: 'Mod support with Fabric API', color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-500/50', icon: '🧵', category: 'server' },
    { id: 'forge' as ServerType, name: 'Forge', description: 'Mod support with Forge', color: 'from-red-500/20 to-rose-500/20', borderColor: 'border-red-500/50', icon: '🔥', category: 'server' },
    { id: 'purpur' as ServerType, name: 'Purpur', description: 'Paper fork with better performance', color: 'from-pink-500/20 to-rose-500/20', borderColor: 'border-pink-500/50', icon: '🟣', category: 'server' },
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
        {isCreating && (
          <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 text-text-primary font-mono text-sm">
              <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
              {creatingStatus}
            </div>
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary font-mono">
          CREATE SERVER
        </h3>
        <div className="flex items-center justify-between text-xs text-text-muted font-mono mt-2 mb-6">
          <span>Step {createStep + 1} of 3</span>
          <span className="text-text-primary">{stepLabels[createStep]}</span>
        </div>
        
        <div className="space-y-6 relative z-10">
          {/* Warning/Error Messages */}
          {(warningMessage || errorMessage) && (
            <div className={`p-3 rounded-lg border-2 ${
              errorMessage 
                ? 'border-red-500/50 bg-red-500/10 text-red-400' 
                : 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{errorMessage ? '⚠️' : 'ℹ️'}</span>
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold mb-1">
                    {errorMessage ? 'Error' : 'Note'}
                  </div>
                  <div className="font-mono text-xs">
                    {errorMessage || warningMessage}
                  </div>
                  {warningMessage && !errorMessage && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {serverType === 'spigot' && (
                        <a 
                          href="https://www.spigotmc.org/wiki/buildtools/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs underline hover:text-yellow-300"
                        >
                          Download BuildTools →
                        </a>
                      )}
                      {serverType === 'forge' && (
                        <a 
                          href="https://files.minecraftforge.net/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs underline hover:text-yellow-300"
                        >
                          Download Forge Installer →
                        </a>
                      )}
                      {serverType === 'bungeecord' && (
                        <a 
                          href="https://www.spigotmc.org/wiki/bungeecord/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs underline hover:text-yellow-300"
                        >
                          Download BungeeCord →
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {errorMessage && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setWarningMessage(null);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {portMessage && !errorMessage && (
            <div className="p-3 rounded-lg border-2 border-blue-500/40 bg-blue-500/10 text-blue-300">
              <div className="flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <div className="flex-1 font-mono text-xs">
                  {portMessage}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Server Type */}
          {createStep === 0 && (
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
                        onClick={() => handleSelectType(type.id)}
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
                            {(type.id === 'spigot' || type.id === 'forge' || type.id === 'bungeecord') && (
                              <div className="mt-1 text-[10px] text-yellow-400/80 font-mono">
                                {type.id === 'spigot' && '⚠️ May require BuildTools'}
                                {type.id === 'forge' && '⚠️ May require manual setup'}
                                {type.id === 'bungeecord' && '⚠️ Limited downloads'}
                              </div>
                            )}
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
                        onClick={() => handleSelectType(type.id)}
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
                        onClick={() => handleSelectType(type.id)}
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
          )}

          {/* Step 2: Version or Manual JAR */}
          {createStep === 1 && serverType === 'manual' ? (
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
          ) : null}

          {createStep === 1 && serverType !== 'manual' ? (
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
                      // For proxy servers, show compatibility info
                      const isProxy = ['velocity', 'waterfall', 'bungeecord'].includes(serverType);
                      const getCompatibilityText = (v: string) => {
                        if (!isProxy) return null;
                        // Extract major.minor version (e.g., "1.20" from "1.20.4")
                        const match = v.match(/^(\d+\.\d+)/);
                        if (!match) return null;
                        const majorMinor = match[1];
                        // For proxy servers, show that it works with that version range
                        return `MC ${majorMinor}+`;
                      };
                      const compatibilityText = getCompatibilityText(version);
                      return (
                        <motion.button
                          key={version}
                          onClick={() => {
                            if (isCreating) return;
                            setSelectedVersion(version);
                          }}
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
                          <div className="flex flex-col items-center gap-1">
                            <span>{version}</span>
                            {compatibilityText && (
                              <span className="text-[10px] text-text-muted opacity-75">
                                {compatibilityText}
                              </span>
                            )}
                          </div>
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
          ) : null}

          {/* Step 3: Settings */}
          {createStep === 2 && (
            <>
              <div>
                <label className="block text-sm text-text-secondary font-mono mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => {
                    // Allow spaces in display name, but folder will use dashes
                    setServerName(e.target.value);
                  }}
                  placeholder="my server"
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

              {/* Server Port */}
              <div className="text-text-secondary font-mono text-sm">
                <label className="block mb-2 text-text-primary">Server Port</label>
                <input
                  type="number"
                  min="1024"
                  max="65535"
                  value={serverPort}
                  onChange={(e) => setServerPort(parseInt(e.target.value) || 0)}
                  disabled={isCreating}
                  className="w-full bg-background-secondary border border-border px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                />
                <p className="text-xs text-text-muted mt-1">Recommended: 25565 (1024-65535)</p>
              </div>

            <div className="flex items-center justify-between text-text-secondary font-mono text-sm">
              <div>
                <span>Auto-start server</span>
                <p className="text-xs text-text-muted">Launch immediately after creation</p>
              </div>
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
                disabled={isCreating}
                className="w-4 h-4 accent-accent cursor-pointer"
              />
            </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-8 relative z-10">
          {createStep > 0 && (
            <motion.button
              onClick={() => setCreateStep((prev) => Math.max(0, prev - 1))}
              disabled={isCreating}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              whileHover={{ scale: isCreating ? 1 : 1.02 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
              style={{ pointerEvents: 'auto' }}
            >
              BACK
            </motion.button>
          )}
          {createStep < 2 ? (
            <motion.button
              onClick={() => setCreateStep((prev) => Math.min(2, prev + 1))}
              disabled={
                isCreating || (createStep === 1 && (serverType === 'manual' ? !manualJarPath : !selectedVersion))
              }
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              whileHover={{ scale: (isCreating || (createStep === 1 && (serverType === 'manual' ? !manualJarPath : !selectedVersion))) ? 1 : 1.02 }}
              whileTap={{ scale: (isCreating || (createStep === 1 && (serverType === 'manual' ? !manualJarPath : !selectedVersion))) ? 1 : 0.98 }}
              style={{ pointerEvents: 'auto' }}
            >
              NEXT
            </motion.button>
          ) : (
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
          )}
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
      onClick={() => {
        setShowInput(true);
        setCreateStep(0);
        setErrorMessage(null);
        setWarningMessage(null);
      }}
      className="btn-primary"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      CREATE SERVER
    </motion.button>
  );
}
