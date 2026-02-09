import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | Nodexity",
  description: "Admin dashboard",
};

export default async function AdminDashboardPage() {
  const [{ count: usersCount }, { count: categoriesCount }, { count: threadsCount }, { count: repliesCount }] = await Promise.all([
    supabase.from("User").select("*", { count: "exact", head: true }),
    supabase.from("Category").select("*", { count: "exact", head: true }),
    supabase.from("Thread").select("*", { count: "exact", head: true }),
    supabase.from("Reply").select("*", { count: "exact", head: true }),
  ]);

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

  const threads = (recentThreads ?? []).map((t) => {
    const raw = t as Record<string, unknown>;
    const category = (t.category ?? raw.Category) as { slug: string; name: string } | null;
    const author = (t.author ?? raw.User) as { name: string | null; email: string } | null;
    return { ...t, category, author };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-border bg-background-secondary/50 p-4">
          <p className="text-sm text-text-muted">Users</p>
          <p className="text-2xl font-semibold text-text-primary">{usersCount ?? 0}</p>
          <Link href="/admin/users" className="mt-1 text-xs text-accent hover:underline">Manage →</Link>
        </div>
        <div className="rounded border border-border bg-background-secondary/50 p-4">
          <p className="text-sm text-text-muted">Categories</p>
          <p className="text-2xl font-semibold text-text-primary">{categoriesCount ?? 0}</p>
        </div>
        <div className="rounded border border-border bg-background-secondary/50 p-4">
          <p className="text-sm text-text-muted">Threads</p>
          <p className="text-2xl font-semibold text-text-primary">{threadsCount ?? 0}</p>
          <Link href="/admin/threads" className="mt-1 text-xs text-accent hover:underline">View all →</Link>
        </div>
        <div className="rounded border border-border bg-background-secondary/50 p-4">
          <p className="text-sm text-text-muted">Replies</p>
          <p className="text-2xl font-semibold text-text-primary">{repliesCount ?? 0}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Recent threads</h2>
        <div className="rounded border border-border bg-background-secondary/30 overflow-hidden">
          {threads.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">No threads yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/support/thread/${t.id}`}
                    className="block px-4 py-3 text-sm text-text-primary hover:bg-background-secondary transition-colors"
                  >
                    <span className="font-medium">{t.title}</span>
                    <span className="ml-2 text-text-muted">
                      {t.category?.name} · {t.author?.name || t.author?.email} · {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
