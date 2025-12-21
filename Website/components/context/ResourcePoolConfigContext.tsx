'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface ResourcePoolConfig {
  ram: number; // in GB
  cpu: number; // cores
  storage: number; // in GB
  backups: boolean;
}

interface ResourcePoolConfigContextType {
  config: ResourcePoolConfig;
  updateConfig: (config: Partial<ResourcePoolConfig>) => void;
}

const ResourcePoolConfigContext = createContext<ResourcePoolConfigContextType | undefined>(undefined);

// Default mock data if no pricing selection exists
const DEFAULT_CONFIG: ResourcePoolConfig = {
  ram: 8,
  cpu: 4,
  storage: 100,
  backups: false,
};

export function ResourcePoolConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ResourcePoolConfig>(DEFAULT_CONFIG);

  const updateConfig = (newConfig: Partial<ResourcePoolConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...newConfig,
    }));
  };

  return (
    <ResourcePoolConfigContext.Provider
      value={{
        config,
        updateConfig,
      }}
    >
      {children}
    </ResourcePoolConfigContext.Provider>
  );
}

export function useResourcePoolConfig() {
  const context = useContext(ResourcePoolConfigContext);
  if (context === undefined) {
    throw new Error('useResourcePoolConfig must be used within a ResourcePoolConfigProvider');
  }
  return context;
}

