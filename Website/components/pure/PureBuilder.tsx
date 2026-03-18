"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ToggleSwitch from "@/components/ToggleSwitch";
import BuildSummaryCard from "@/components/pure/BuildSummaryCard";
import UpdatePackModal from "@/components/pure/UpdatePackModal";
import {
  MINECRAFT_VERSIONS,
  PERFORMANCE_PRESETS,
  PC_SUGGESTIONS,
  PROFILE_OPTIONS,
  TOGGLE_CATEGORIES,
  TOGGLE_DEFINITIONS,
  buildPcSuggestedSelections,
  buildRecommendedToggleIds,
  defaultPureBuilderSelections,
  getToggleDefinitionsByIds,
  type PcSuggestionId,
  type PureBuilderSelections,
  type ToggleId,
} from "@/lib/pure-fps";
import {
  createGeneratedPackConfig,
  downloadGeneratedPack,
  type GeneratedPackConfig,
} from "@/lib/pure-pack";

type ToastTone = "success" | "error" | "info";

interface ToastState {
  tone: ToastTone;
  title: string;
  description: string;
}

function ToggleCategoryIcon({ categoryId }: { categoryId: string }) {
  if (categoryId === "performance-core") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    );
  }

  if (categoryId === "visual-utility") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          d="M15 10l4.55-2.275A2 2 0 0020 5.937V5a2 2 0 00-2-2h-.937a2 2 0 00-1.788.894L13 7m2 3l-2 4m0 0l-2-4m2 4v7m-6-6a3 3 0 100-6 3 3 0 000 6zm12 0a3 3 0 100-6 3 3 0 000 6z"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function PureBuilder() {
  const [minecraftVersion, setMinecraftVersion] = useState(
    defaultPureBuilderSelections.minecraftVersion,
  );
  const [profileType, setProfileType] = useState(
    defaultPureBuilderSelections.profileType,
  );
  const [performancePreset, setPerformancePreset] = useState(
    defaultPureBuilderSelections.performancePreset,
  );
  const [selectedToggles, setSelectedToggles] = useState<ToggleId[]>(
    defaultPureBuilderSelections.selectedToggles,
  );
  const [pcSuggestion, setPcSuggestion] = useState<PcSuggestionId | null>(
    defaultPureBuilderSelections.pcSuggestion,
  );
  const [suggestionPreviewId, setSuggestionPreviewId] = useState<PcSuggestionId>(
    defaultPureBuilderSelections.pcSuggestion ?? "mid-range",
  );
  const [generatedPackConfig, setGeneratedPackConfig] =
    useState<GeneratedPackConfig | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    setGeneratedPackConfig(null);
  }, [minecraftVersion, performancePreset, profileType, selectedToggles, pcSuggestion]);

  const previewSuggestion = useMemo(
    () => PC_SUGGESTIONS.find((item) => item.id === suggestionPreviewId) ?? null,
    [suggestionPreviewId],
  );

  const previewSuggestionSelections = useMemo(
    () => buildPcSuggestedSelections(suggestionPreviewId, minecraftVersion),
    [suggestionPreviewId, minecraftVersion],
  );

  const enabledToggleDefinitions = useMemo(
    () => getToggleDefinitionsByIds(selectedToggles),
    [selectedToggles],
  );

  const pushToast = (nextToast: ToastState) => {
    setToast(nextToast);
  };

  const applySelections = (selections: PureBuilderSelections) => {
    setMinecraftVersion(selections.minecraftVersion);
    setProfileType(selections.profileType);
    setPerformancePreset(selections.performancePreset);
    setSelectedToggles(selections.selectedToggles);
    setPcSuggestion(selections.pcSuggestion);
  };

  const handleProfileChange = (nextProfileType: PureBuilderSelections["profileType"]) => {
    setProfileType(nextProfileType);
    setSelectedToggles(buildRecommendedToggleIds(nextProfileType, performancePreset));
  };

  const handlePresetChange = (
    nextPerformancePreset: PureBuilderSelections["performancePreset"],
  ) => {
    setPerformancePreset(nextPerformancePreset);
    setSelectedToggles(buildRecommendedToggleIds(profileType, nextPerformancePreset));
  };

  const handleToggleChange = (toggleId: ToggleId, checked: boolean) => {
    setSelectedToggles((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(toggleId);
      } else {
        next.delete(toggleId);
      }
      return TOGGLE_DEFINITIONS.filter((toggle) => next.has(toggle.id)).map(
        (toggle) => toggle.id,
      );
    });
  };

  const handleApplyPcSuggestion = () => {
    applySelections(previewSuggestionSelections);
    pushToast({
      tone: "success",
      title: "PC recommendation applied",
      description: `${previewSuggestion?.name ?? "System"} tuned the builder with a recommended profile, preset, and toggle mix.`,
    });
  };

  const handleDownload = () => {
    const selections: PureBuilderSelections = {
      minecraftVersion,
      profileType,
      performancePreset,
      selectedToggles,
      pcSuggestion,
    };
    const config = createGeneratedPackConfig(selections);
    downloadGeneratedPack(config);
    setGeneratedPackConfig(config);
    pushToast({
      tone: "success",
      title: "Pure FPS config downloaded",
      description: `${config.filenameHint} is ready for your Modrinth import flow.`,
    });
  };

  const handleApplyImportedConfig = (selections: PureBuilderSelections) => {
    applySelections(selections);
    setSuggestionPreviewId(selections.pcSuggestion ?? "mid-range");
    pushToast({
      tone: "info",
      title: "Previous build loaded",
      description:
        "Your saved Pure FPS config was imported into the builder. Review anything you want, then download an updated build.",
    });
  };

  const toastStyles: Record<ToastTone, string> = {
    success: "border-accent/25 bg-accent/10 text-accent",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    info: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  };

  return (
    <section id="pure-builder" className="full-width-section relative overflow-hidden py-16 sm:py-20">
      <div className="section-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(46,242,162,0.1),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(70,110,255,0.12),transparent_28%)]" />
      </div>

      <div className="section-content mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-4">
          <p className="text-xs font-mono uppercase tracking-[0.34em] text-accent/80">
            Pure FPS Configurator
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Choose your version, customize your setup, and download your optimized pack.
              </h2>
              <p className="max-w-3xl text-base text-text-secondary sm:text-lg">
                Profiles and presets create a premium starting point. You can still
                fine-tune every toggle before exporting your pack config.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.22em] text-accent">
                Modrinth only
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-mono uppercase tracking-[0.22em] text-text-secondary">
                Fabric only
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-mono uppercase tracking-[0.22em] text-text-secondary">
                Downloadable config flow
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_380px] lg:items-start">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45 }}
              className="rounded-[28px] border border-white/10 bg-[#0d1117]/92 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.32)]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.26em] text-accent/80">
                      Step 01
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      Minecraft Version
                    </h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-text-secondary">
                    Multi-version ready
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {MINECRAFT_VERSIONS.map((version) => {
                    const isActive = version === minecraftVersion;
                    return (
                      <button
                        key={version}
                        type="button"
                        onClick={() => setMinecraftVersion(version)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          isActive
                            ? "border-accent/40 bg-accent/10 text-white shadow-[0_0_0_1px_rgba(46,242,162,0.15)]"
                            : "border-white/10 bg-white/[0.03] text-text-secondary hover:border-accent/25 hover:bg-accent/[0.05] hover:text-white"
                        }`}
                      >
                        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-text-muted">
                          Version
                        </p>
                        <p className="mt-2 text-lg font-semibold">{version}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, delay: 0.04 }}
              className="rounded-[28px] border border-white/10 bg-[#0d1117]/92 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.32)]"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.26em] text-accent/80">
                    Step 02
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Profile</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Pick the baseline you want Pure FPS to build from.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {PROFILE_OPTIONS.map((profile) => {
                    const isActive = profile.id === profileType;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleProfileChange(profile.id)}
                        className={`rounded-3xl border p-5 text-left transition ${
                          isActive
                            ? "border-accent/40 bg-accent/10 shadow-[0_0_0_1px_rgba(46,242,162,0.16)]"
                            : "border-white/10 bg-white/[0.03] hover:border-accent/25 hover:bg-accent/[0.04]"
                        }`}
                      >
                        <p className="text-xs font-mono uppercase tracking-[0.24em] text-text-muted">
                          {profile.tagline}
                        </p>
                        <p className="mt-3 text-xl font-semibold text-white">
                          {profile.name}
                        </p>
                        <p className="mt-3 text-sm text-text-secondary">
                          {profile.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-[28px] border border-white/10 bg-[#0d1117]/92 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.32)]"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.26em] text-accent/80">
                    Step 03
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Performance Preset
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Presets rebalance the recommendation so you can aim for pure speed,
                    a stable middle ground, or cleaner visuals.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {PERFORMANCE_PRESETS.map((preset) => {
                    const isActive = preset.id === performancePreset;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetChange(preset.id)}
                        className={`rounded-3xl border p-5 text-left transition ${
                          isActive
                            ? "border-accent/40 bg-accent/10 shadow-[0_0_0_1px_rgba(46,242,162,0.16)]"
                            : "border-white/10 bg-white/[0.03] hover:border-accent/25 hover:bg-accent/[0.04]"
                        }`}
                      >
                        <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent/80">
                          {preset.name}
                        </p>
                        <p className="mt-3 text-sm text-text-secondary">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="rounded-[28px] border border-white/10 bg-[#0d1117]/92 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.32)]"
            >
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.26em] text-accent/80">
                      Step 04
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      Custom Toggles
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm text-text-secondary">
                      The UI and state handling below are ready for future backend
                      plug-in. For now, the pack export stores your exact choices in a
                      clean JSON config.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-text-secondary">
                    {enabledToggleDefinitions.length} toggles enabled
                  </div>
                </div>

                <div className="grid gap-5">
                  {TOGGLE_CATEGORIES.map((category) => {
                    const toggles = TOGGLE_DEFINITIONS.filter(
                      (toggle) => toggle.category === category.id,
                    );
                    return (
                      <div
                        key={category.id}
                        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
                            <ToggleCategoryIcon categoryId={category.id} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">
                              {category.title}
                            </h4>
                            <p className="mt-2 text-sm text-text-secondary">
                              {category.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3">
                          {toggles.map((toggle) => {
                            const checked = selectedToggles.includes(toggle.id);
                            return (
                              <div
                                key={toggle.id}
                                className={`rounded-2xl border p-4 transition ${
                                  checked
                                    ? "border-accent/30 bg-accent/[0.07]"
                                    : "border-white/10 bg-black/20"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-2">
                                    <p className="text-sm font-semibold text-white">
                                      {toggle.name}
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                      {toggle.description}
                                    </p>
                                  </div>
                                  <ToggleSwitch
                                    checked={checked}
                                    onChange={(nextChecked) =>
                                      handleToggleChange(toggle.id, nextChecked)
                                    }
                                    ariaLabel={`Toggle ${toggle.name}`}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="rounded-[28px] border border-white/10 bg-[#0d1117]/92 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.32)]"
            >
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.26em] text-accent/80">
                    Step 05
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Suggest for my PC
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Choose a system level to simulate hardware guidance. V1 does not
                    auto-detect browser hardware; you stay in control of the final
                    recommendation.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {PC_SUGGESTIONS.map((suggestion) => {
                    const isPreviewing = suggestion.id === suggestionPreviewId;
                    const isApplied = suggestion.id === pcSuggestion;
                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => setSuggestionPreviewId(suggestion.id)}
                        className={`rounded-3xl border p-5 text-left transition ${
                          isPreviewing
                            ? "border-accent/40 bg-accent/10 shadow-[0_0_0_1px_rgba(46,242,162,0.16)]"
                            : "border-white/10 bg-white/[0.03] hover:border-accent/25 hover:bg-accent/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-lg font-semibold text-white">
                            {suggestion.name}
                          </p>
                          {isApplied ? (
                            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.24em] text-accent">
                              Applied
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm text-text-secondary">
                          {suggestion.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {previewSuggestion ? (
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-white">
                          {previewSuggestion.name} recommendation
                        </p>
                        <p className="text-sm text-text-secondary">
                          {previewSuggestion.recommendation}
                        </p>
                        <p className="text-sm text-text-muted">
                          {previewSuggestion.systemExamples}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-text-muted">
                          Suggested builder state
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-text-secondary">
                          <p>
                            Profile:{" "}
                            <span className="font-semibold text-white">
                              {
                                PROFILE_OPTIONS.find(
                                  (item) =>
                                    item.id === previewSuggestionSelections.profileType,
                                )?.name
                              }
                            </span>
                          </p>
                          <p>
                            Preset:{" "}
                            <span className="font-semibold text-white">
                              {
                                PERFORMANCE_PRESETS.find(
                                  (item) =>
                                    item.id ===
                                    previewSuggestionSelections.performancePreset,
                                )?.name
                              }
                            </span>
                          </p>
                          <p>
                            Enabled toggles:{" "}
                            <span className="font-semibold text-white">
                              {previewSuggestionSelections.selectedToggles.length}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyPcSuggestion}
                          className="btn-primary mt-4 w-full font-mono"
                        >
                          Apply Recommendation
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>

          <BuildSummaryCard
            minecraftVersion={minecraftVersion}
            profileType={profileType}
            performancePreset={performancePreset}
            selectedToggles={selectedToggles}
            isPackGenerated={Boolean(generatedPackConfig)}
            onDownload={handleDownload}
            onUpdatePack={() => setIsUpdateModalOpen(true)}
          />
        </div>
      </div>

      <UpdatePackModal
        open={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onApplyConfig={handleApplyImportedConfig}
      />

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-4 right-4 z-[60] w-full max-w-sm px-4 sm:px-0"
          >
            <div
              className={`rounded-3xl border p-4 shadow-[0_16px_60px_rgba(0,0,0,0.35)] backdrop-blur-md ${toastStyles[toast.tone]}`}
            >
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-1 text-sm opacity-90">{toast.description}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
