import { motion } from "framer-motion";
import { useState } from "react";
import ServerCard from "./ServerCard";

interface Server {
  id: string;
  name: string;
  version: string;
  status: "ACTIVE" | "STOPPED" | "PLANNED";
  port: number;
}

const mockServers: Server[] = [
  {
    id: "1",
    name: "Survival Server",
    version: "1.20.1",
    status: "ACTIVE",
    port: 25565,
  },
  {
    id: "2",
    name: "Creative World",
    version: "1.20.1",
    status: "STOPPED",
    port: 25566,
  },
  {
    id: "3",
    name: "Test Server",
    version: "1.19.4",
    status: "STOPPED",
    port: 25567,
  },
];

export default function ServerList() {
  const [servers, setServers] = useState<Server[]>(mockServers);

  const handleStart = (id: string) => {
    setServers(servers.map(s => s.id === id ? { ...s, status: "ACTIVE" as const } : s));
  };

  const handleStop = (id: string) => {
    setServers(servers.map(s => s.id === id ? { ...s, status: "STOPPED" as const } : s));
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          SERVERS
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          Manage your Minecraft server instances
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server, index) => (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
          >
            <ServerCard
              server={server}
              onStart={() => handleStart(server.id)}
              onStop={() => handleStop(server.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

