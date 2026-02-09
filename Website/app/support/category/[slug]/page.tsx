import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import { ensureCategories } from "@/lib/forum";
import { NewThreadButton } from "../../NewThreadButton";
import { RoleBadge } from "@/components/RoleBadge";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

type ThreadRow = {
  id: string;
  title: string;
  updatedAt: string;
  author: { id: string; name: string | null; email: string; role?: string } | null;
  replies: unknown[];
};

export async function generateMetadata({ params }: Props) {
  const { slug } = params;
  const { data: category } = await supabase
    .from("Category")
    .select("name, description")
    .eq("slug", slug)
    .single();
  if (!category) return { title: "Support | Nodexity" };
  return {
    title: `${category.name} | Support | Nodexity`,
    description: category.description ?? undefined,
  };
}

const ALLOWED_CATEGORY_SLUGS = ["server-manager", "general"];

export default async function CategoryPage({ params }: Props) {
  await ensureCategories();
  const { slug } = params;
  if (!ALLOWED_CATEGORY_SLUGS.includes(slug)) notFound();
  const session = await getSession();

  const { data: category, error } = await supabase
    .from("Category")
    .select(`
      id,
      slug,
      name,
      description,
      threads:Thread(
        id,
        title,
        updatedAt,
        author:User(id, name, email, role),
        replies:Reply(id)
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !category) notFound();

  const rawCat = category as Record<string, unknown>;
  const threads = (rawCat.threads ?? rawCat.Thread ?? []) as ThreadRow[];
  const sortedThreads = [...threads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const { data: categoriesList } = await supabase
    .from("Category")
    .select("id, slug, name")
    .order("order", { ascending: true });

  const categories = categoriesList ?? [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary font-mono sm:text-2xl">
            # {category.name}
          </h1>
          {category.description && (
            <p className="mt-0.5 text-sm text-text-muted">{category.description}</p>
          )}
        </div>
        {session && (
          <NewThreadButton categories={categories} />
        )}
      </div>

      <div className="rounded-lg border border-border bg-background-secondary/40 overflow-hidden">
        {sortedThreads.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">No threads yet. Be the first to post.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sortedThreads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/support/thread/${t.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-background-secondary/60"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-text-primary">{t.title}</span>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                      {t.author?.name || t.author?.email}
                      <RoleBadge role={t.author?.role as "user" | "mod" | "admin" | "owner" | undefined} size="sm" />
                      <span>·</span>
                      <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{Array.isArray(t.replies) ? t.replies.length : 0} replies</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
