"use client";

import { motion } from "framer-motion";
import {
  PERFORMANCE_PRESETS,
  PROFILE_OPTIONS,
  getToggleDefinitionsByIds,
  type MinecraftVersion,
  type PerformancePresetId,
  type ProfileType,
  type ToggleId,
} from "@/lib/pure-fps";

interface BuildSummaryCardProps {
  minecraftVersion: MinecraftVersion;
  profileType: ProfileType;
  performancePreset: PerformancePresetId;
  selectedToggles: ToggleId[];
  isPackGenerated: boolean;
  onDownload: () => void;
  onUpdatePack: () => void;
}

export default function BuildSummaryCard({
  minecraftVersion,
  profileType,
  performancePreset,
  selectedToggles,
  isPackGenerated,
  onDownload,
  onUpdatePack,
}: BuildSummaryCardProps) {
  const profile = PROFILE_OPTIONS.find((item) => item.id === profileType);
  const preset = PERFORMANCE_PRESETS.find((item) => item.id === performancePreset);
  const enabledToggleNames = getToggleDefinitionsByIds(selectedToggles)
    .slice(0, 4)
    .map((toggle) => toggle.name);

  const summaryItems = [
    { label: "Version", value: minecraftVersion },
    { label: "Profile", value: profile?.name ?? profileType },
    { label: "Preset", value: preset?.name ?? performancePreset },
    { label: "Launcher", value: "Modrinth" },
    { label: "Status", value: "Ready to Build" },
  ];

  return (
    <div className="lg:sticky lg:top-28">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1115]/95 shadow-[0_18px_80px_rgba(0,0,0,0.42)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,242,162,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(51,153,255,0.12),transparent_38%)]" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
        <div className="relative space-y-6 p-6">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.28em] text-accent">
              Builder Summary
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight text-white">
                Pure FPS build snapshot
              </h3>
              <p className="text-sm text-text-secondary">
                Your downloadable config stays locked to Modrinth and Fabric for this
                first release of the web builder.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-text-muted">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-text-muted">
                  Enabled Toggles
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
                  {selectedToggles.length}
                </p>
              </div>
              <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-accent">
                {isPackGenerated ? "Config exported" : "Awaiting export"}
              </div>
            </div>

            {enabledToggleNames.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {enabledToggleNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-text-secondary"
                  >
                    {name}
                  </span>
                ))}
                {selectedToggles.length > enabledToggleNames.length ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-text-secondary">
                    +{selectedToggles.length - enabledToggleNames.length} more
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <motion.button
              type="button"
              onClick={onDownload}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary flex w-full items-center justify-center gap-2 font-mono"
            >
              Download Pack
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v10m0 0l-4-4m4 4l4-4M4 20h16"
                />
              </svg>
            </motion.button>
            <motion.button
              type="button"
              onClick={onUpdatePack}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-secondary flex w-full items-center justify-center gap-2 font-mono"
            >
              Update My Pack
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v6h6M20 20v-6h-6M5.64 18.36A9 9 0 1020 12"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
