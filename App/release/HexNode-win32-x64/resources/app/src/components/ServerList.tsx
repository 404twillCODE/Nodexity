import { motion } from "framer-motion";
import ServerCard from "./ServerCard";
import { useServerManager } from "../hooks/useServerManager";
import JavaStatusIndicator from "./JavaStatusIndicator";
import CreateServerButton from "./CreateServerButton";

interface ServerListProps {
  onServerClick?: (serverName: string) => void;
}

export default function ServerList({ onServerClick }: ServerListProps) {
  const { servers, startServer, stopServer, loading } = useServerManager();

  const handleStart = async (serverName: string) => {
    const server = servers.find(s => s.name === serverName);
    const ramGB = server?.ramGB || 4;
    const result = await startServer(serverName, ramGB);
    if (!result.success) {
      alert(`Failed to start server: ${result.error}`);
    }
  };

  const handleStop = async (serverName: string) => {
    const result = await stopServer(serverName);
    if (!result.success) {
      alert(`Failed to stop server: ${result.error}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
              SERVERS
            </h1>
            <p className="text-text-secondary font-mono text-sm">
              Manage your Minecraft server instances
            </p>
          </div>
          <div className="flex items-center gap-4">
            <JavaStatusIndicator />
            <CreateServerButton />
          </div>
        </div>
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="system-card p-8 text-center"
        >
          <div className="text-text-muted font-mono text-sm">Loading servers...</div>
        </motion.div>
      ) : servers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="system-card p-12 text-center"
        >
          <div className="mb-6">
            <div className="text-6xl mb-4 opacity-20">⚡</div>
            <h2 className="text-xl font-semibold text-text-primary font-mono mb-2">
              NO SERVERS FOUND
            </h2>
            <p className="text-text-muted font-mono text-sm mb-6">
              Create your first server to get started with HexNode
            </p>
          </div>
          <CreateServerButton />
        </motion.div>
      ) : (
        <div className="space-y-4">
          {servers.map((server, index) => (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
            >
              <ServerCard
                server={server}
                onStart={() => handleStart(server.name)}
                onStop={() => handleStop(server.name)}
                onClick={() => onServerClick?.(server.name)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
