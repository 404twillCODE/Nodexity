"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createThread } from "./actions";

type Category = { id: string; slug: string; name: string };

export function NewThreadButton({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createThread(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
    const slug = formData.get("categorySlug") as string;
    if (slug) router.push(`/support/category/${slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        <span className="relative z-20 font-mono">NEW THREAD</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded border border-border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary">New thread</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <p className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}
              <div>
                <label htmlFor="categorySlug" className="mb-1 block text-xs font-mono uppercase text-text-muted">Category</label>
                <select
                  id="categorySlug"
                  name="categorySlug"
                  required
                  className="w-full rounded border border-border bg-background-secondary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-mono uppercase text-text-muted">Title</label>
                <input
                  id="title"
                  name="title"
                  required
                  maxLength={500}
                  className="w-full rounded border border-border bg-background-secondary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Short title"
                />
              </div>
              <div>
                <label htmlFor="body" className="mb-1 block text-xs font-mono uppercase text-text-muted">Message</label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={4}
                  maxLength={10000}
                  className="w-full rounded border border-border bg-background-secondary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Describe your question or issue…"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary">
                  <span className="relative z-20 font-mono">{loading ? "Creating…" : "CREATE"}</span>
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  <span className="relative z-20 font-mono">CANCEL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
