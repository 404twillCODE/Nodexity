'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [resourcePool, setResourcePool] = useState<ResourcePool>({
    totalRam: 8,
    usedRam: 0,
  });

  const addServer = (serverData: Omit<Server, 'id' | 'status'>) => {
    const newServer: Server = {
      ...serverData,
      id: `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Online',
    };

    setServers((prev) => [...prev, newServer]);
    setResourcePool((prev) => ({
      ...prev,
      usedRam: prev.usedRam + serverData.ram,
    }));
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

  return (
    <ServerContext.Provider
      value={{
        servers,
        resourcePool,
        addServer,
        startServer,
        stopServer,
        restartServer,
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

