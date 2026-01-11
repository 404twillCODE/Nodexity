import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ServerPropertiesEditorProps {
  serverName: string;
}

export default function ServerPropertiesEditor({ serverName }: ServerPropertiesEditorProps) {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
        alert('Server properties saved successfully! Restart the server for changes to take effect.');
      } else {
        alert(`Failed to save properties: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error saving properties: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const commonProperties = [
    { key: 'server-port', label: 'Server Port', type: 'number' },
    { key: 'max-players', label: 'Max Players', type: 'number' },
    { key: 'view-distance', label: 'View Distance', type: 'number' },
    { key: 'simulation-distance', label: 'Simulation Distance', type: 'number' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
    { key: 'gamemode', label: 'Default Gamemode', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'] },
    { key: 'hardcore', label: 'Hardcore', type: 'checkbox' },
    { key: 'pvp', label: 'PvP', type: 'checkbox' },
    { key: 'spawn-monsters', label: 'Spawn Monsters', type: 'checkbox' },
    { key: 'spawn-animals', label: 'Spawn Animals', type: 'checkbox' },
    { key: 'spawn-npcs', label: 'Spawn NPCs', type: 'checkbox' },
    { key: 'online-mode', label: 'Online Mode', type: 'checkbox' },
    { key: 'white-list', label: 'Whitelist', type: 'checkbox' },
    { key: 'enforce-whitelist', label: 'Enforce Whitelist', type: 'checkbox' },
    { key: 'motd', label: 'MOTD (Message of the Day)', type: 'text' },
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

        <div className="space-y-6">
          {commonProperties.map((prop) => {
            const value = properties[prop.key] || '';
            
            return (
              <div key={prop.key} className="system-card p-4">
                <label className="block text-sm font-semibold text-text-primary font-mono mb-2 uppercase tracking-wider">
                  {prop.label}
                </label>
                {prop.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value === 'true'}
                      onChange={(e) => handlePropertyChange(prop.key, e.target.checked ? 'true' : 'false')}
                      className="rounded"
                    />
                    <span className="text-sm text-text-secondary font-mono">
                      {value === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                ) : prop.type === 'select' ? (
                  <select
                    value={value}
                    onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
                    className="w-full bg-background-secondary border border-border px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent/50 rounded"
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
    </div>
  );
}

