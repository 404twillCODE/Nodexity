import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DeleteThreadButton } from "./DeleteThreadButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Threads | Moderation | Nodexity",
};

export default async function ModThreadsPage() {
  const { data: threads } = await supabase
    .from("Thread")
    .select(`
      id,
      title,
      body,
      createdAt,
      category:Category(slug, name),
      author:User(name, email)
    `)
    .order("createdAt", { ascending: false });

  const list = (threads ?? []).map((t) => {
    const raw = t as Record<string, unknown>;
    return {
      ...t,
      category: (t.category ?? raw.Category) as { slug: string; name: string } | null,
      author: (t.author ?? raw.User) as { name: string | null; email: string } | null,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Moderate threads</h1>
      <p className="text-sm text-text-muted">Delete threads that break the rules. This cannot be undone.</p>

      <div className="rounded border border-border bg-background-secondary/30 overflow-hidden">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">No threads.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/support/thread/${t.id}`} className="font-medium text-text-primary hover:text-accent">
                    {t.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{t.body}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {t.category?.name} · {t.author?.name || t.author?.email} · {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <DeleteThreadButton threadId={t.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
