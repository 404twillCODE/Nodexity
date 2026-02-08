import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCategories } from "@/lib/forum";
import { NewThreadButton } from "../../NewThreadButton";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const { slug } = params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Support | Nodexity" };
  return {
    title: `${category.name} | Support | Nodexity`,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  await ensureCategories();
  const { slug } = params;
  const session = await getServerSession(authOptions);

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      threads: {
        orderBy: { updatedAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { replies: true } },
        },
      },
    },
  });

  if (!category) notFound();

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, slug: true, name: true },
  });

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/support" className="text-sm text-text-muted hover:text-accent mb-2 inline-block">
              ← Support
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-2 text-text-secondary">{category.description}</p>
            )}
          </div>
          {session && (
            <NewThreadButton categories={categories} />
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-8">
          {category.threads.length === 0 ? (
            <p className="py-8 text-center text-text-muted">No threads yet. Be the first to post.</p>
          ) : (
            category.threads.map((t) => (
              <Link
                key={t.id}
                href={`/support/thread/${t.id}`}
                className="block rounded border border-border bg-background-secondary/50 px-4 py-3 transition-colors hover:border-accent/30 hover:bg-background-secondary"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-text-primary">{t.title}</span>
                  <span className="text-sm text-text-muted shrink-0">{t._count.replies} replies</span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  by {t.author.name || t.author.email} · {new Date(t.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8">
          <Link href="/support" className="btn-secondary">
            <span className="relative z-20 font-mono">ALL CATEGORIES</span>
          </Link>
          <Link href="/" className="btn-secondary">
            <span className="relative z-20 font-mono">HOME</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
