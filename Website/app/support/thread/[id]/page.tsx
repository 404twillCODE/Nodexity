import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import { ReplyForm } from "./ReplyForm";
import { RoleBadge } from "@/components/RoleBadge";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  const { id } = params;
  const { data: thread } = await supabase
    .from("Thread")
    .select("title")
    .eq("id", id)
    .single();
  if (!thread) return { title: "Support | Nodexity" };
  return {
    title: `${thread.title} | Support | Nodexity`,
  };
}

export default async function ThreadPage({ params }: Props) {
  const { id } = params;
  const session = await getSession();

  const { data: thread, error } = await supabase
    .from("Thread")
    .select(`
      id,
      title,
      body,
      createdAt,
      category:Category(id, slug, name),
      author:User(id, name, email, role),
      replies:Reply(id, body, createdAt, author:User(id, name, email, role))
    `)
    .eq("id", id)
    .single();

  if (error || !thread) notFound();

  const rawThread = thread as Record<string, unknown>;
  const category = (rawThread.category ?? rawThread.Category) as { id: string; slug: string; name: string } | null;
  const author = (rawThread.author ?? rawThread.User) as { id: string; name: string | null; email: string; role?: string } | null;
  const replies = (rawThread.replies ?? rawThread.Reply ?? []) as Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string | null; email: string; role?: string } | null;
  }>;
  const normalizedReplies = replies.map((r) => {
    const raw = r as Record<string, unknown>;
    return { ...r, author: (r.author ?? raw.User) ?? null };
  });
  const sortedReplies = [...normalizedReplies].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <>
      {category && (
        <Link href={`/support/category/${category.slug}`} className="mb-4 inline-block text-sm text-text-muted hover:text-accent">
          ← # {category.name}
        </Link>
      )}

      {/* Thread = first "message" */}
      <div className="rounded-lg border border-border bg-background-secondary/40">
        <div className="flex gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
            {(author?.name || author?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-text-primary">{author?.name || author?.email}</span>
              <RoleBadge role={author?.role as "user" | "mod" | "admin" | "owner" | undefined} size="sm" />
              <span className="text-xs text-text-muted">{new Date(thread.createdAt).toLocaleString()}</span>
            </div>
            <h1 className="mt-1 text-lg font-semibold text-text-primary">{thread.title}</h1>
            <div className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{thread.body}</div>
          </div>
        </div>
      </div>

      {/* Replies = chat messages */}
      <div className="mt-4 space-y-1">
        {sortedReplies.map((r) => (
          <div
            key={r.id}
            className="flex gap-3 rounded-lg border border-border/60 bg-background-secondary/30 px-4 py-2.5 hover:border-border"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium text-text-muted">
              {(r.author?.name || r.author?.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span className="font-medium text-text-primary">{r.author?.name || r.author?.email}</span>
                <RoleBadge role={r.author?.role as "user" | "mod" | "admin" | "owner" | undefined} size="sm" />
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{r.body}</div>
            </div>
          </div>
        ))}
      </div>

      {session ? (
        <div className="mt-6">
          <ReplyForm threadId={thread.id} />
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-border bg-background-secondary/50 px-4 py-3 text-sm text-text-secondary">
          <Link href={`/login?callbackUrl=/support/thread/${thread.id}`} className="text-accent hover:underline">Log in</Link>
          {" to reply."}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
        {category && (
          <Link href={`/support/category/${category.slug}`} className="text-sm text-text-muted hover:text-accent">
            ← # {category.name}
          </Link>
        )}
        <Link href="/support" className="text-sm text-text-muted hover:text-accent">Support</Link>
        <Link href="/" className="text-sm text-text-muted hover:text-accent">Home</Link>
      </div>
    </>
  );
}
