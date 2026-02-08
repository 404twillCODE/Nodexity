import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  const { id } = params;
  const thread = await prisma.thread.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!thread) return { title: "Support | Nodexity" };
  return {
    title: `${thread.title} | Support | Nodexity`,
  };
}

export default async function ThreadPage({ params }: Props) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      category: true,
      author: { select: { id: true, name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!thread) notFound();

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <Link href={`/support/category/${thread.category.slug}`} className="text-sm text-text-muted hover:text-accent mb-2 inline-block">
          ← {thread.category.name}
        </Link>

        <article className="rounded border border-border bg-background-secondary/50 p-5">
          <h1 className="text-2xl font-semibold text-text-primary">{thread.title}</h1>
          <p className="mt-2 text-xs text-text-muted">
            {thread.author.name || thread.author.email} · {new Date(thread.createdAt).toLocaleString()}
          </p>
          <div className="mt-4 whitespace-pre-wrap text-text-secondary">{thread.body}</div>
        </article>

        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-text-primary">Replies ({thread.replies.length})</h2>
          {thread.replies.map((r) => (
            <div
              key={r.id}
              className="rounded border border-border bg-background-secondary/30 p-4"
            >
              <p className="text-xs text-text-muted">
                {r.author.name || r.author.email} · {new Date(r.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 whitespace-pre-wrap text-text-secondary">{r.body}</div>
            </div>
          ))}
        </div>

        {session ? (
          <div className="mt-8 border-t border-border pt-8">
            <ReplyForm threadId={thread.id} />
          </div>
        ) : (
          <p className="mt-8 rounded border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-text-secondary">
            <Link href={`/login?callbackUrl=/support/thread/${thread.id}`} className="text-accent hover:underline">Log in</Link>
            {" to reply."}
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8">
          <Link href={`/support/category/${thread.category.slug}`} className="btn-secondary">
            <span className="relative z-20 font-mono">← CATEGORY</span>
          </Link>
          <Link href="/support" className="btn-secondary">
            <span className="relative z-20 font-mono">SUPPORT</span>
          </Link>
          <Link href="/" className="btn-secondary">
            <span className="relative z-20 font-mono">HOME</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
