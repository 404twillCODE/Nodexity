"use client";

import { useActionState } from "react";
import { sendDirectMessage } from "../../actions";

export function DMMessageForm({ conversationId }: { conversationId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_: unknown, formData: FormData) => {
      formData.set("conversationId", conversationId);
      return sendDirectMessage(formData);
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <textarea
        name="body"
        placeholder="Type a message..."
        rows={2}
        className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        required
      />
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
