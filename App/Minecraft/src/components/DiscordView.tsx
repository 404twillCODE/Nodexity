import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ToggleSwitch from "./ToggleSwitch";

type AppSettings = import("../hooks/useServerManager").AppSettings;

interface DiscordBotSettings {
  enabled?: boolean;
  token?: string;
  clientId?: string;
  defaultPrefix?: string;
  defaultHost?: string;
  defaultPort?: number;
}

export default function DiscordView() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!window.electronAPI) {
        setLoading(false);
        return;
      }
      try {
        const appSettings = await window.electronAPI.server.getAppSettings();
        setSettings(appSettings || {});
      } catch (error) {
        console.error("Failed to load app settings for Discord view:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveDiscordSetting = async (key: keyof DiscordBotSettings, value: unknown) => {
    if (!window.electronAPI) return;
    try {
      const currentSettings: AppSettings =
        settings || (await window.electronAPI.server.getAppSettings()) || {};
      const existingDiscord: DiscordBotSettings = (currentSettings as any).discordBot || {};
      const updatedDiscord: DiscordBotSettings = {
        ...existingDiscord,
        [key]: value,
      };
      const updated: AppSettings = {
        ...currentSettings,
        discordBot: updatedDiscord as any,
      };
      const saved = await window.electronAPI.server.saveAppSettings(updated);
      setSettings((saved || updated) as AppSettings);
    } catch (error) {
      console.error("Failed to save Discord bot setting:", error);
    }
  };

  const discord: DiscordBotSettings = (settings as any)?.discordBot || {};

  const inviteUrl =
    discord.clientId && String(discord.clientId).trim().length > 0
      ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(
          String(discord.clientId).trim()
        )}&permissions=8&scope=bot%20applications.commands`
      : "";

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="text-text-secondary font-mono text-sm">Loading Discord settings...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold text-text-primary font-mono mb-2">
          DISCORD BOT
        </h1>
        <p className="text-text-secondary font-mono text-sm">
          Configure your Discord bot to show Nodexity and Minecraft server information.
        </p>
      </motion.div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 100, damping: 15 }}
          className="system-card p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
            Discord Bot Settings
          </h2>
          <div className="space-y-4 text-text-secondary font-mono text-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span>Enable Discord integration</span>
                <p className="text-xs text-text-muted">
                  Store your Discord bot credentials and defaults in Nodexity.
                </p>
              </div>
              <ToggleSwitch
                checked={discord.enabled !== false}
                onChange={(checked) => saveDiscordSetting("enabled", checked)}
                ariaLabel="Enable Discord integration"
              />
            </div>

            <div>
              <label className="block mb-2 text-text-primary">Bot Token</label>
              <input
                type="password"
                autoComplete="off"
                value={discord.token || ""}
                onChange={(e) => saveDiscordSetting("token", e.target.value)}
                className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                placeholder="Paste your bot token from the Discord Developer Portal"
              />
              <p className="text-xs text-text-muted mt-1">
                Keep this secret. Nodexity stores it locally on your machine only.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-text-primary">Application (Client) ID</label>
                <input
                  type="text"
                  value={discord.clientId || ""}
                  onChange={(e) => saveDiscordSetting("clientId", e.target.value)}
                  className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  placeholder="Discord application ID"
                />
                <p className="text-xs text-text-muted mt-1">
                  Used to generate an invite link to add your bot to servers.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-text-primary">Default Command Prefix</label>
                <input
                  type="text"
                  maxLength={4}
                  value={discord.defaultPrefix || "!"}
                  onChange={(e) => saveDiscordSetting("defaultPrefix", e.target.value || "!")}
                  className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  placeholder="!"
                />
                <p className="text-xs text-text-muted mt-1">
                  The default prefix for your bot&apos;s text commands (for example: !help).
                </p>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-text-primary">Invite URL</label>
              <input
                type="text"
                readOnly
                value={
                  inviteUrl ||
                  "Enter your Application (Client) ID above to generate an invite link."
                }
                className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-xs focus:outline-none rounded"
              />
              <p className="text-xs text-text-muted mt-1">
                Copy this into a browser to add your bot to any Discord server (after setting the
                correct permissions in the Developer Portal).
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
          className="system-card p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary font-mono mb-4">
            Minecraft Defaults for Bot
          </h2>
          <div className="space-y-4 text-text-secondary font-mono text-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="block mb-2 text-text-primary">Default Server Address</label>
                <input
                  type="text"
                  value={discord.defaultHost || ""}
                  onChange={(e) => saveDiscordSetting("defaultHost", e.target.value)}
                  className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  placeholder="play.example.com"
                />
                <p className="text-xs text-text-muted mt-1">
                  Hostname or IP that the bot should use by default when checking Minecraft status.
                </p>
              </div>
              <div>
                <label className="block mb-2 text-text-primary">Default Port</label>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={typeof discord.defaultPort === "number" ? discord.defaultPort : 25565}
                  onChange={(e) =>
                    saveDiscordSetting(
                      "defaultPort",
                      Math.max(1, Math.min(65535, Number(e.target.value) || 25565))
                    )
                  }
                  className="w-full bg-background-secondary border border-border px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                  placeholder="25565"
                />
                <p className="text-xs text-text-muted mt-1">
                  Port for your Minecraft server (default Java: 25565).
                </p>
              </div>
            </div>

            <p className="text-xs text-text-muted">
              These defaults are used by Nodexity&apos;s built-in Discord bot when Discord
              integration is enabled and Nodexity is running.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

