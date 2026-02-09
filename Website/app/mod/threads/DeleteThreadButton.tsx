"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteThread } from "../actions";

export function DeleteThreadButton({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setLoading(true);
    const result = await deleteThread(threadId);
    setLoading(false);
    setConfirm(false);
    if (result.ok) router.refresh();
  }

  return (
    <div className="shrink-0 flex items-center gap-2">
      {confirm ? (
        <>
          <span className="text-xs text-red-400">Delete?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded border border-red-500/50 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-background-secondary"
          >
            No
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:border-red-500/40 hover:text-red-400"
        >
          Delete
        </button>
      )}
    </div>
  );
}
