"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useRef, useState } from "react";
import { isKnownPurePackFileName, parsePurePackConfig } from "@/lib/pure-pack";
import type { PureBuilderSelections } from "@/lib/pure-fps";

interface UpdatePackModalProps {
  open: boolean;
  onClose: () => void;
  onApplyConfig: (selections: PureBuilderSelections) => void;
}

export default function UpdatePackModal({
  open,
  onClose,
  onApplyConfig,
}: UpdatePackModalProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const selections = parsePurePackConfig(text);
      onApplyConfig(selections);
      handleClose();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "We could not read that pack config.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={handleClose}
          aria-hidden
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-pack-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d1117]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div className="relative space-y-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-[0.32em] text-accent/80">
                    Nodexity Builder Flow
                  </p>
                  <h2
                    id="update-pack-title"
                    className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                  >
                    Update My Pack
                  </h2>
                  <p className="max-w-xl text-sm text-text-secondary sm:text-base">
                    Upload or load your existing Nodexity Pure pack config to rebuild
                    it with newer settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.24em] text-text-secondary transition hover:border-accent/40 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.25fr_0.85fr]">
                <label
                  htmlFor={inputId}
                  className="group relative flex min-h-[240px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-accent/35 hover:bg-accent/[0.05]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(46,242,162,0.12),transparent_55%)] opacity-80" />
                  <div className="relative space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 16V4m0 12l-4-4m4 4l4-4M4 16.5v1A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5v-1"
                        />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-white">
                        Import an existing Pure FPS config
                      </p>
                      <p className="text-sm text-text-secondary">
                        Select a previous JSON export and the builder will preload
                        version, profile, preset, and toggle choices.
                      </p>
                    </div>
                  </div>

                  <div className="relative space-y-2">
                    <div className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-accent">
                      JSON only
                    </div>
                    <p className="text-xs text-text-muted">
                      Tip: files named like{" "}
                      <span className="font-mono text-text-secondary">
                        nodexity-pure-fps-1-21-4.json
                      </span>{" "}
                      are recognized automatically.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    id={inputId}
                    type="file"
                    accept=".json,application/json"
                    className="sr-only"
                    onChange={(event) =>
                      handleFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">
                      What gets restored
                    </p>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li>Minecraft version</li>
                      <li>Pure FPS profile selection</li>
                      <li>Performance preset</li>
                      <li>Enabled custom toggles</li>
                      <li>Last PC suggestion preference</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-text-secondary">
                    Modrinth and Fabric stay locked in for V1, so imported configs are
                    rebuilt for the same web-based Pure FPS flow.
                  </div>

                  {isLoading ? (
                    <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4 text-sm text-accent">
                      Loading config...
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary w-full font-mono"
                  >
                    Choose Pack Config
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-text-muted">
                Supported import sources: exported Nodexity Pure FPS builder configs.
                {` `}
                {isKnownPurePackFileName("nodexity-pure-fps-template.json")
                  ? "Future .mrpack update support can be wired into this modal later."
                  : ""}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
