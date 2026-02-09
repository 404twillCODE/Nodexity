"use client";

import { useRouter } from "next/navigation";
import { createConversation } from "../../actions";
import { useState } from "react";

type User = { id: string; email: string; name: string | null };

export function StartConversationForm({ users, preselectedUserId }: { users: User[]; preselectedUserId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(userId: string) {
    setError(null);
    setLoading(true);
    const result = await createConversation(userId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.conversationId) {
      router.push(`/support/chat/${result.conversationId}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <ul className="rounded-lg border border-border bg-background-secondary/40 divide-y divide-border overflow-hidden">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => handleStart(u.id)}
              disabled={loading}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-background-secondary/60 disabled:opacity-50 ${u.id === preselectedUserId ? "bg-background-secondary/60" : ""}`}
            >
              <span className="font-medium text-text-primary">{u.name || u.email}</span>
              {u.name && <span className="text-text-muted">({u.email})</span>}
              <span className="text-accent">Message</span>
            </button>
          </li>
        ))}
      </ul>
      {users.length === 0 && (
        <p className="text-sm text-text-muted">No other users to message.</p>
      )}
    </div>
  );
}
