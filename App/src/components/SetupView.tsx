import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface Drive {
  letter: string;
  label: string;
  totalGB: number;
  freeGB: number;
  usedGB: number;
}

interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
    threads: number;
  };
  memory: {
    totalGB: number;
    freeGB: number;
    usedGB: number;
  };
  drives: Drive[];
  platform: string;
  arch: string;
  hostname: string;
}

interface SetupViewProps {
  onNext: () => void;
}

export default function SetupView({ onNext }: SetupViewProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<SystemInfo | null>(null);

  useEffect(() => {
    loadSystemInfo();
    
    // Set up real-time updates every 10 seconds (much less frequent to reduce stutter)
    const startUpdates = () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = setInterval(async () => {
        // Don't run updates at all if scrolling
        if (isScrollingRef.current || !window.electronAPI) return;
        
        try {
          const info = await window.electronAPI.server.getSystemInfo();
          // Use requestAnimationFrame for smoother updates
          requestAnimationFrame(() => {
            if (!isScrollingRef.current) {
              setSystemInfo(info);
            }
          });
        } catch (error) {
          console.error('Failed to load system info:', error);
        }
      }, 10000); // 10 seconds - much less frequent
    };

    startUpdates();

    // Handle scroll events - completely pause updates while scrolling
    const handleScrollStart = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        // Pause updates completely
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      }
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Resume updates after scroll stops
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        // Resume updates
        startUpdates();
        // Apply any pending updates
        if (pendingUpdateRef.current) {
          setSystemInfo(pendingUpdateRef.current);
          pendingUpdateRef.current = null;
        }
      }, 500); // Longer delay to ensure scroll is truly stopped
    };

    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScrollStart, { passive: true });
      // Also listen for wheel events for better detection
      scrollElement.addEventListener('wheel', handleScrollStart, { passive: true });
    }

    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScrollStart);
        scrollElement.removeEventListener('wheel', handleScrollStart);
      }
    };
  }, []);

  const loadSystemInfo = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      const info = await window.electronAPI.server.getSystemInfo();
      // Only update if not scrolling to prevent stutter
      if (!isScrollingRef.current) {
        setSystemInfo(info);
      } else {
        // Queue update for when scrolling stops
        pendingUpdateRef.current = info;
      }
    } catch (error) {
      console.error('Failed to load system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    onNext();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary font-mono text-sm">
          Detecting system specifications...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen flex items-center justify-center bg-background p-8 overflow-hidden"
    >
      <motion.div
        className="relative border border-border bg-background-secondary p-8 max-w-2xl w-full max-h-[90vh] flex flex-col rounded"
        whileHover={{ 
          borderColor: 'rgba(46, 242, 162, 0.2)',
          transition: { duration: 0.3 }
        }}
        style={{ 
          borderColor: 'rgba(26, 26, 26, 1)',
          backgroundColor: 'rgba(17, 17, 17, 1)',
        }}
      >
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
            WELCOME TO HEXNODE
          </h1>
          <p className="text-text-secondary font-mono text-sm">
            First-time setup - System detection
          </p>
        </div>

        {systemInfo && (
          <div 
            ref={scrollContainerRef}
            className="space-y-6 mb-6 flex-1 custom-scrollbar"
            style={{ 
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              paddingRight: '8px'
            }}
          >
            {/* CPU Info */}
            <div className="border border-border rounded p-4">
              <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
                Processor
              </h3>
              <div className="space-y-2 text-text-secondary font-mono text-sm">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="text-text-primary">{systemInfo.cpu.model}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cores:</span>
                  <span className="text-text-primary">{systemInfo.cpu.cores}</span>
                </div>
                <div className="flex justify-between">
                  <span>Threads:</span>
                  <span className="text-text-primary">{systemInfo.cpu.threads}</span>
                </div>
              </div>
            </div>

            {/* Memory Info */}
            <div className="border border-border rounded p-4">
              <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
                Memory
              </h3>
              <div className="space-y-2 text-text-secondary font-mono text-sm">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="text-text-primary">
                    {systemInfo.memory.totalGB} GB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="text-text-primary">
                    {systemInfo.memory.freeGB} GB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span className="text-text-primary">
                    {systemInfo.memory.usedGB} GB
                  </span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300 ease-out"
                      style={{ width: `${(systemInfo.memory.usedGB / systemInfo.memory.totalGB) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Info - Individual Drives */}
            {systemInfo.drives && systemInfo.drives.length > 0 && (
              <div className="border border-border rounded p-4">
                <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
                  Storage
                </h3>
                <div className="space-y-4">
                  {systemInfo.drives.map((drive, index) => (
                    <div key={`${drive.letter}-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-primary font-mono font-semibold text-sm">
                          {drive.letter} {drive.label !== drive.letter && `(${drive.label})`}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-text-secondary font-mono text-xs">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="text-text-primary">
                            {drive.totalGB} GB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available:</span>
                          <span className="text-text-primary">
                            {drive.freeGB} GB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Used:</span>
                          <span className="text-text-primary">
                            {drive.usedGB} GB
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent transition-all duration-300 ease-out"
                              style={{ width: `${(drive.usedGB / drive.totalGB) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {index < systemInfo.drives.length - 1 && (
                        <div className="border-t border-border my-3"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Info */}
            <div className="border border-border rounded p-4">
              <h3 className="text-sm font-semibold text-text-primary font-mono mb-3 uppercase tracking-wider">
                System
              </h3>
              <div className="space-y-2 text-text-secondary font-mono text-sm">
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="text-text-primary">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span>Architecture:</span>
                  <span className="text-text-primary">{systemInfo.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hostname:</span>
                  <span className="text-text-primary">{systemInfo.hostname}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end flex-shrink-0 pt-4 border-t border-border">
          <motion.button
            onClick={handleNext}
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            CONTINUE
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

