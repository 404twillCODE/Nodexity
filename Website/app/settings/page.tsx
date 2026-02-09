"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ToggleSwitch from "@/components/ToggleSwitch";
import { useWebsiteSettings } from "@/components/WebsiteSettingsProvider";

export default function SettingsPage() {
  const { settings, setSetting } = useWebsiteSettings();

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="mb-8"
      >
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          WEBSITE SETTINGS
        </h1>
        <p className="mt-2 font-mono text-sm text-text-secondary">
          Configure website preferences (e.g. boot sequence, banners). Stored in your browser.
        </p>
      </motion.div>

      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 100, damping: 15 }}
          className="system-card p-6"
        >
          <h2 className="font-mono text-lg font-semibold text-text-primary mb-4">
            General
          </h2>
          <div className="space-y-4 font-mono text-sm text-text-secondary">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="block text-text-primary">Show boot sequence</span>
                <p className="text-xs text-text-muted">
                  Display the loading screen when visiting the homepage
                </p>
              </div>
              <ToggleSwitch
                checked={settings.showBootSequence}
                onChange={(v) => setSetting("showBootSequence", v)}
                ariaLabel="Show boot sequence"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="block text-text-primary">Show development banner</span>
                <p className="text-xs text-text-muted">
                  Show &quot;Website in active development&quot; notice at the top
                </p>
              </div>
              <ToggleSwitch
                checked={settings.showDevBanner}
                onChange={(v) => setSetting("showDevBanner", v)}
                ariaLabel="Show development banner"
              />
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 100, damping: 15 }}
          className="pt-4"
        >
          <Link
            href="/"
            className="btn-secondary inline-block"
          >
            <span className="relative z-20 font-mono">BACK TO HOME</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
