'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useResourcePoolConfig } from './ResourcePoolConfigContext';

export interface Server {
  id: string;
  name: string;
  type: string;
  version: string;
  ram: number; // in GB
  status: 'Online' | 'Offline' | 'Restarting';
}

interface ResourcePool {
  totalRam: number; // in GB
  usedRam: number; // in GB
}

interface ServerContextType {
  servers: Server[];
  resourcePool: ResourcePool;
  addServer: (server: Omit<Server, 'id' | 'status'>) => void;
  startServer: (serverId: string) => void;
  stopServer: (serverId: string) => void;
  restartServer: (serverId: string) => void;
  deleteServer: (serverId: string) => void;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { config } = useResourcePoolConfig();
  const [servers, setServers] = useState<Server[]>([]);
  const [resourcePool, setResourcePool] = useState<ResourcePool>({
    totalRam: config.ram,
    usedRam: 0,
  });

  // Update totalRam when config changes
  useEffect(() => {
    setResourcePool((prev) => ({
      ...prev,
      totalRam: config.ram,
    }));
  }, [config.ram]);

  // Calculate usedRam from existing servers
  useEffect(() => {
    const calculatedUsedRam = servers.reduce((sum, server) => sum + server.ram, 0);
    setResourcePool((prev) => ({
      ...prev,
      usedRam: calculatedUsedRam,
    }));
  }, [servers]);

  const addServer = (serverData: Omit<Server, 'id' | 'status'>) => {
    const newServer: Server = {
      ...serverData,
      id: `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Online',
    };

    setServers((prev) => [...prev, newServer]);
    // usedRam will be recalculated by useEffect
  };

  const startServer = (serverId: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId ? { ...server, status: 'Online' } : server
      )
    );
  };

  const stopServer = (serverId: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId ? { ...server, status: 'Offline' } : server
      )
    );
  };

  const restartServer = (serverId: string) => {
    // Set to Restarting
    setServers((prev) =>
      prev.map((server) =>
        server.id === serverId ? { ...server, status: 'Restarting' } : server
      )
    );

    // After 1.5 seconds, set to Online
    setTimeout(() => {
      setServers((prev) =>
        prev.map((server) =>
          server.id === serverId ? { ...server, status: 'Online' } : server
        )
      );
    }, 1500);
  };

  const deleteServer = (serverId: string) => {
    setServers((prev) => prev.filter((s) => s.id !== serverId));
    // usedRam will be recalculated by useEffect
  };

  return (
    <ServerContext.Provider
      value={{
        servers,
        resourcePool,
        addServer,
        startServer,
        stopServer,
        restartServer,
        deleteServer,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServerContext must be used within a ServerProvider');
  }
  return context;
}

