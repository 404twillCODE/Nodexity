import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DeleteReplyButton } from "./DeleteReplyButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Replies | Moderation | Nodexity",
};

export default async function ModRepliesPage() {
  const { data: replies } = await supabase
    .from("Reply")
    .select(`
      id,
      body,
      createdAt,
      thread:Thread(id, title),
      author:User(name, email)
    `)
    .order("createdAt", { ascending: false })
    .limit(100);

  const list = (replies ?? []).map((r) => {
    const raw = r as Record<string, unknown>;
    return {
      ...r,
      thread: (r.thread ?? raw.Thread) as { id: string; title: string } | null,
      author: (r.author ?? raw.User) as { name: string | null; email: string } | null,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Moderate replies</h1>
      <p className="text-sm text-text-muted">Delete replies that break the rules. This cannot be undone.</p>

      <div className="rounded border border-border bg-background-secondary/30 overflow-hidden">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">No replies.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-secondary line-clamp-2">{r.body}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {r.author?.name || r.author?.email} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                  {r.thread && (
                    <Link href={`/support/thread/${r.thread.id}`} className="mt-1 block text-xs text-accent hover:underline">
                      Thread: {r.thread.title}
                    </Link>
                  )}
                </div>
                <DeleteReplyButton replyId={r.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
