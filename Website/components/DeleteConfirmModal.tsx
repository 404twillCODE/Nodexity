'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { buttonHover, buttonTap } from '@/components/motionVariants';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  serverName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  serverName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          >
            <motion.div
              className="bg-background border border-foreground/10 rounded-lg shadow-2xl max-w-md w-full p-6"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Delete Server
              </h3>
              <p className="text-muted mb-6">
                Are you sure you want to delete <span className="font-medium text-foreground">{serverName}</span>? This action cannot be undone.
              </p>

              <div className="flex items-center gap-3 justify-end">
                <motion.button
                  onClick={onCancel}
                  className="px-4 py-2 border border-foreground/20 text-foreground font-medium rounded-lg hover:border-foreground/30 hover:bg-foreground/5 transition-colors"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

