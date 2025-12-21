'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import {
  fadeUp,
  fadeUpTransition,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "@/components/motionVariants";

export default function SettingsPage() {
  // Mock user data (UI only)
  const [username] = useState('user@hexnode.com');
  const [email] = useState('user@hexnode.com');
  
  // Preferences state (UI only)
  const [defaultServerType, setDefaultServerType] = useState('Paper');
  const [defaultRam, setDefaultRam] = useState(2); // in GB

  const serverTypes = ['Paper', 'Fabric', 'Forge', 'Proxy (Velocity)'];

  return (
    <div className="p-8">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Page Header */}
        <motion.div
          className="mb-10"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Account Section */}
        <motion.div
          className="p-6 border border-foreground/10 rounded-lg mb-8"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Account
          </h2>
          
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                readOnly
                className="w-full px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted mt-1">
                Coming soon: Username changes will be available in a future update.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted mt-1">
                Coming soon: Email changes will be available in a future update.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          className="p-6 border border-foreground/10 rounded-lg mb-8"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Preferences
          </h2>
          
          <div className="space-y-6">
            {/* Default Server Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Default Server Type
              </label>
              <select
                value={defaultServerType}
                onChange={(e) => setDefaultServerType(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-foreground/10 rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
              >
                {serverTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">
                This will be pre-selected when creating new servers. (UI only)
              </p>
            </div>

            {/* Default RAM per Server */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-foreground">
                  Default RAM per Server
                </label>
                <span className="text-sm text-muted">
                  {defaultRam.toFixed(1)} GB
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={8}
                step={0.5}
                value={defaultRam}
                onChange={(e) => setDefaultRam(Number(e.target.value))}
                className="w-full h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-accent"
                style={{
                  background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(defaultRam / 8) * 100}%, rgba(255, 255, 255, 0.1) ${(defaultRam / 8) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                }}
              />
              <div className="flex justify-between items-center text-xs text-muted mt-1">
                <span>0.5 GB</span>
                <span>8 GB</span>
              </div>
              <p className="text-xs text-muted mt-1">
                This will be pre-selected when creating new servers. (UI only)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          className="p-6 border border-red-500/20 rounded-lg bg-red-500/5"
          variants={fadeUp}
          transition={fadeUpTransition}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Danger Zone
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-muted mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <motion.button
                disabled
                className="px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg cursor-not-allowed opacity-50"
                whileHover={{}}
                whileTap={{}}
              >
                Delete Account
              </motion.button>
              <p className="text-xs text-muted mt-2">
                Coming soon: Account deletion will be available in a future update.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

