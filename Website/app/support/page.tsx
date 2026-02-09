import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import { ensureCategories } from "@/lib/forum";
import { NewThreadButton } from "./NewThreadButton";
import { RoleBadge } from "@/components/RoleBadge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support | Nodexity",
  description: "Forum-style support: categories, threads, and replies. Log in to post.",
};

type ThreadRow = {
  id: string;
  title: string;
  updatedAt: string;
  author: { name: string | null; email: string; role?: string } | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  threads: ThreadRow[];
  _count: { threads: number };
};

export default async function SupportPage() {
  await ensureCategories();
  const session = await getSession();

  const { data: categoriesRaw } = await supabase
    .from("Category")
    .select("id, slug, name, description, order, threads:Thread(id, title, updatedAt, author:User(name, email, role))")
    .order("order", { ascending: true });

  const allowedSlugs = ["server-manager", "general"];
  const filtered = (categoriesRaw ?? []).filter((c: { slug: string }) => allowedSlugs.includes(c.slug));
  const categories: CategoryRow[] = filtered.map((c) => {
    const raw = c as Record<string, unknown>;
    const threads = (raw.threads ?? raw.Thread ?? []) as ThreadRow[];
    const sorted = [...threads].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return {
      ...c,
      threads: sorted,
      _count: { threads: threads.length },
    };
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary font-mono sm:text-2xl">
            Support
          </h1>
          <p className="mt-0.5 text-sm text-text-muted">
            Pick a category on the left or browse below. Log in to create threads and reply.
          </p>
        </div>
        {session && (
          <NewThreadButton categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))} />
        )}
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id}>
            <Link
              href={`/support/category/${cat.slug}`}
              className="mb-2 flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              # {cat.name}
              <span className="text-text-muted font-normal">({cat._count.threads})</span>
            </Link>
            <div className="rounded-lg border border-border bg-background-secondary/40 overflow-hidden">
              {cat.threads.length === 0 ? (
                <p className="px-4 py-3 text-sm text-text-muted">No threads yet</p>
              ) : (
                <ul className="divide-y divide-border">
                  {cat.threads.slice(0, 5).map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/support/thread/${t.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-background-secondary/60"
                      >
                        <span className="min-w-0 truncate text-text-primary">{t.title}</span>
                        <span className="shrink-0 text-xs text-text-muted">
                          {t.author?.name || t.author?.email}
                          <RoleBadge role={t.author?.role as "user" | "mod" | "admin" | "owner" | undefined} size="sm" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {cat.threads.length > 5 && (
                <Link
                  href={`/support/category/${cat.slug}`}
                  className="block border-t border-border px-4 py-2 text-center text-xs text-text-muted hover:bg-background-secondary/60 hover:text-accent"
                >
                  View all {cat._count.threads} threads →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {!session && (
        <p className="mt-6 rounded-lg border border-border bg-background-secondary/50 px-4 py-3 text-sm text-text-secondary">
          <Link href="/login?callbackUrl=/support" className="text-accent hover:underline">Log in</Link>
          {" or "}
          <Link href="/register" className="text-accent hover:underline">sign up</Link>
          {" to create threads and reply."}
        </p>
      )}
    </>
  );
}
