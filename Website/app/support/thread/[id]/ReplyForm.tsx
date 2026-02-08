"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReply } from "../../actions";

export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("threadId", threadId);
    const result = await createReply(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-semibold text-text-primary">Post a reply</h3>
      {error && (
        <p className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
      <input type="hidden" name="threadId" value={threadId} />
      <div>
        <label htmlFor="body" className="mb-1 block text-xs font-mono uppercase text-text-muted">Message</label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          maxLength={10000}
          className="w-full rounded border border-border bg-background-secondary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Your reply…"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        <span className="relative z-20 font-mono">{loading ? "Posting…" : "POST REPLY"}</span>
      </button>
    </form>
  );
}
