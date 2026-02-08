import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCategories } from "@/lib/forum";
import { NewThreadButton } from "./NewThreadButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support | Nodexity",
  description: "Forum-style support: categories, threads, and replies. Log in to post.",
};

export default async function SupportPage() {
  await ensureCategories();
  const session = await getServerSession(authOptions);

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { threads: true } },
      threads: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
              SUPPORT
            </h1>
            <p className="mt-2 text-text-secondary">
              Forum-style support. Browse categories and threads. Log in to create threads and reply.
            </p>
          </div>
          {session && (
            <NewThreadButton categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))} />
          )}
        </div>

        <div className="space-y-4 border-t border-border pt-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/support/category/${cat.slug}`}
              className="block rounded border border-border bg-background-secondary/50 p-5 transition-colors hover:border-accent/30 hover:bg-background-secondary"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{cat.name}</h2>
                  {cat.description && (
                    <p className="mt-1 text-sm text-text-muted">{cat.description}</p>
                  )}
                </div>
                <div className="text-right text-sm text-text-muted shrink-0">
                  <span className="font-medium text-text-secondary">{cat._count.threads}</span> threads
                </div>
              </div>
              {cat.threads[0] && (
                <p className="mt-3 border-t border-border pt-3 text-xs text-text-muted">
                  Latest: “{cat.threads[0].title}” by {cat.threads[0].author.name || cat.threads[0].author.email}
                </p>
              )}
            </Link>
          ))}
        </div>

        {!session && (
          <p className="mt-8 rounded border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-text-secondary">
            <Link href="/login?callbackUrl=/support" className="text-accent hover:underline">Log in</Link>
            {" or "}
            <Link href="/register" className="text-accent hover:underline">sign up</Link>
            {" to create threads and reply."}
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8">
          <a href="https://discord.gg/RVTAEbdDBJ" target="_blank" rel="noopener noreferrer" className="btn-discord">
            <span className="relative z-20 font-mono">DISCORD</span>
          </a>
          <Link href="/faq" className="btn-secondary">
            <span className="relative z-20 font-mono">FAQ</span>
          </Link>
          <Link href="/" className="btn-secondary">
            <span className="relative z-20 font-mono">BACK HOME</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
