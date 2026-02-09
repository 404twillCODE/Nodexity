import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Threads | Admin | Nodexity",
  description: "Manage support threads",
};

export default async function AdminThreadsPage() {
  const { data: threads } = await supabase
    .from("Thread")
    .select(`
      id,
      title,
      body,
      createdAt,
      updatedAt,
      category:Category(id, slug, name),
      author:User(id, name, email, role)
    `)
    .order("createdAt", { ascending: false });

  const list = (threads ?? []).map((t) => {
    const raw = t as Record<string, unknown>;
    const category = (t.category ?? raw.Category) as { id: string; slug: string; name: string } | null;
    const author = (t.author ?? raw.User) as { id: string; name: string | null; email: string; role?: string } | null;
    return { ...t, category, author };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">All threads</h1>

      <div className="rounded border border-border bg-background-secondary/30 overflow-hidden">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">No threads.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((t) => (
              <li key={t.id} className="p-4">
                <Link href={`/support/thread/${t.id}`} className="block hover:opacity-90">
                  <p className="font-medium text-text-primary">{t.title}</p>
                  <p className="mt-1 text-xs text-text-muted line-clamp-1">{t.body}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span>{t.category?.name}</span>
                    <span>·</span>
                    <span>{t.author?.name || t.author?.email}</span>
                    {t.author?.role && t.author.role !== "user" && (
                      <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">{t.author.role}</span>
                    )}
                    <span>·</span>
                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
