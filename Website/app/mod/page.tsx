import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moderation | Nodexity",
  description: "Moderation dashboard for threads and replies",
};

export default async function ModPage() {
  const { data: recentThreads } = await supabase
    .from("Thread")
    .select(`
      id,
      title,
      createdAt,
      category:Category(slug, name),
      author:User(name, email)
    `)
    .order("createdAt", { ascending: false })
    .limit(10);

  const { data: recentReplies } = await supabase
    .from("Reply")
    .select(`
      id,
      body,
      createdAt,
      thread:Thread(id, title),
      author:User(name, email)
    `)
    .order("createdAt", { ascending: false })
    .limit(10);

  const threads = (recentThreads ?? []).map((t) => {
    const raw = t as Record<string, unknown>;
    return {
      ...t,
      category: (t.category ?? raw.Category) as { slug: string; name: string } | null,
      author: (t.author ?? raw.User) as { name: string | null; email: string } | null,
    };
  });

  const replies = (recentReplies ?? []).map((r) => {
    const raw = r as Record<string, unknown>;
    return {
      ...r,
      thread: (r.thread ?? raw.Thread) as { id: string; title: string } | null,
      author: (r.author ?? raw.User) as { name: string | null; email: string } | null,
    };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-text-primary">Moderation dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Recent threads</h2>
            <Link href="/mod/threads" className="text-sm text-accent hover:underline">View all →</Link>
          </div>
          <div className="rounded border border-border bg-background-secondary/30 overflow-hidden">
            {threads.length === 0 ? (
              <p className="p-4 text-sm text-text-muted">No threads</p>
            ) : (
              <ul className="divide-y divide-border">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/support/thread/${t.id}`}
                      className="block px-4 py-2.5 text-sm text-text-primary hover:bg-background-secondary/60"
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className="ml-2 text-text-muted">
                        {t.category?.name} · {t.author?.name || t.author?.email}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Recent replies</h2>
            <Link href="/mod/replies" className="text-sm text-accent hover:underline">View all →</Link>
          </div>
          <div className="rounded border border-border bg-background-secondary/30 overflow-hidden">
            {replies.length === 0 ? (
              <p className="p-4 text-sm text-text-muted">No replies</p>
            ) : (
              <ul className="divide-y divide-border">
                {replies.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={r.thread ? `/support/thread/${r.thread.id}` : "#"}
                      className="block px-4 py-2.5 text-sm hover:bg-background-secondary/60"
                    >
                      <span className="text-text-muted line-clamp-1">{r.body}</span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        {r.thread?.title} · {r.author?.name || r.author?.email}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-text-muted">
        Use the <Link href="/mod/threads" className="text-accent hover:underline">Threads</Link> page to delete threads or replies that break the rules.
      </p>
    </div>
  );
}
