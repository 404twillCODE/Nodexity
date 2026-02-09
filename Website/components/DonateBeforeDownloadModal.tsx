"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const GITHUB_RELEASES_URL = "https://github.com/404twillCODE/Nodexity/releases/latest";

interface DonateBeforeDownloadModalProps {
  open: boolean;
  onClose: () => void;
  onContinueToDownload: () => void;
}

export default function DonateBeforeDownloadModal({
  open,
  onClose,
  onContinueToDownload,
}: DonateBeforeDownloadModalProps) {
  const handleContinue = () => {
    onContinueToDownload();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            aria-hidden
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="donate-modal-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="z-[51] w-full max-w-md rounded-xl border border-border bg-background-secondary p-6 shadow-xl sm:p-8"
            >
            <h2 id="donate-modal-title" className="font-mono text-lg font-semibold uppercase tracking-wider text-text-primary sm:text-xl">
              Before you download
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base">
              Please consider donating — I&apos;m a single developer working hard on this project, the app, and this website. If you can&apos;t or prefer not to, that&apos;s totally okay!
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/donate"
                className="btn-primary inline-flex items-center justify-center font-mono"
                onClick={onClose}
              >
                Donate
              </Link>
              <button
                type="button"
                onClick={handleContinue}
                className="btn-secondary font-mono"
              >
                Continue to download
              </button>
            </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { GITHUB_RELEASES_URL };
