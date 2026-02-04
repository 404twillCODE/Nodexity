import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "./ToastProvider";
import ToggleSwitch from "./ToggleSwitch";

interface ServerPropertiesEditorProps {
  serverName: string;
}

export default function ServerPropertiesEditor({ serverName }: ServerPropertiesEditorProps) {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    loadProperties();
  }, [serverName]);

  const loadProperties = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.server.getServerProperties(serverName);
      if (result.success) {
        setProperties(result.properties || {});
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (key: string, value: string) => {
    setProperties(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!window.electronAPI) return;
    setSaving(true);
    try {
      const result = await window.electronAPI.server.updateServerProperties(serverName, properties);
      if (result.success) {
        setHasChanges(false);
        notify({
          type: "success",
          title: "Properties saved",
          message: "Restart the server for changes to take effect."
        });
      } else {
        notify({
          type: "error",
          title: "Save failed",
          message: result.error || "Unable to save properties."
        });
      }
    } catch (error: any) {
      notify({
        type: "error",
        title: "Save failed",
        message: error.message || "Unable to save properties."
      });
    } finally {
      setSaving(false);
    }
  };

  const propertyGroups = [
    {
      title: 'Network & Slots',
      description: 'Ports and player limits',
      items: [
        { key: 'server-port', label: 'Server Port', type: 'number' },
        { key: 'max-players', label: 'Max Players', type: 'number' }
      ]
    },
    {
      title: 'Performance',
      description: 'World simulation settings',
      items: [
        { key: 'view-distance', label: 'View Distance', type: 'number' },
        { key: 'simulation-distance', label: 'Simulation Distance', type: 'number' }
      ]
    },
    {
      title: 'Gameplay',
      description: 'Difficulty and rules',
      items: [
        { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
        { key: 'gamemode', label: 'Default Gamemode', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'] },
        { key: 'hardcore', label: 'Hardcore', type: 'checkbox' },
        { key: 'pvp', label: 'PvP', type: 'checkbox' }
      ]
    },
    {
      title: 'World Spawns',
      description: 'Mob spawning rules',
      items: [
        { key: 'spawn-monsters', label: 'Spawn Monsters', type: 'checkbox' },
        { key: 'spawn-animals', label: 'Spawn Animals', type: 'checkbox' },
        { key: 'spawn-npcs', label: 'Spawn NPCs', type: 'checkbox' }
      ]
    },
    {
      title: 'Access Control',
      description: 'Auth and whitelist',
      items: [
        { key: 'online-mode', label: 'Online Mode', type: 'checkbox' },
        { key: 'white-list', label: 'Whitelist', type: 'checkbox' },
        { key: 'enforce-whitelist', label: 'Enforce Whitelist', type: 'checkbox' }
      ]
    },
    {
      title: 'Messaging',
      description: 'Server announcement',
      items: [
        { key: 'motd', label: 'MOTD (Message of the Day)', type: 'text' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-text-muted font-mono">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary font-mono mb-2">
              Server Properties
            </h2>
            <p className="text-text-secondary font-mono text-sm">
              Configure your server settings
            </p>
          </div>
          {hasChanges && (
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </motion.button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {propertyGroups.map((group) => (
            <div key={group.title} className="system-card p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-primary font-mono uppercase tracking-wider">
                  {group.title}
                </h3>
                <p className="text-xs text-text-muted font-mono mt-1">
                  {group.description}
                </p>
              </div>
              <div className="grid gap-4">
                {group.items.map((prop) => {
                  const value = properties[prop.key] || '';
                  return (
                    <div key={prop.key}>
                      <label className="block text-xs font-semibold text-text-secondary font-mono mb-2 uppercase tracking-wider">
                        {prop.label}
                      </label>
                      {prop.type === 'checkbox' ? (
                        <div className="flex items-center gap-3">
                          <ToggleSwitch
                            checked={value === 'true'}
                            onChange={(checked) => handlePropertyChange(prop.key, checked ? 'true' : 'false')}
                            ariaLabel={`${prop.label} toggle`}
                          />
                          <span className="text-sm text-text-secondary font-mono">
                            {value === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : prop.type === 'select' ? (
                        <select
                          value={value}
                          onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
                          className="select-custom w-full"
                        >
                          {prop.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={prop.type}
                          value={value}
                          onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
                          className="w-full bg-background-secondary border border-border px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


