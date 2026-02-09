import Link from "next/link";
import { getCurrentUser, isModOrAbove } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chat | Support | Nodexity",
  description: "Direct messages",
};

type ConvRow = {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  other: { id: string; name: string | null; email: string } | null;
};

export default async function SupportChatPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/support/chat");
  }

  const { data: rows } = await supabase
    .from("Conversation")
    .select(`
      id,
      user1Id,
      user2Id,
      createdAt,
      user1:User!user1Id(id, name, email),
      user2:User!user2Id(id, name, email)
    `)
    .or(`user1Id.eq.${user.id},user2Id.eq.${user.id}`)
    .order("createdAt", { ascending: false });

  const list: ConvRow[] = (rows ?? []).map((r: Record<string, unknown>) => {
    const otherId = r.user1Id === user.id ? r.user2Id : r.user1Id;
    const u1 = r.user1 as { id: string; name: string | null; email: string } | undefined;
    const u2 = r.user2 as { id: string; name: string | null; email: string } | undefined;
    const other = r.user1Id === user.id ? u2 : u1;
    return {
      id: r.id as string,
      user1Id: r.user1Id as string,
      user2Id: r.user2Id as string,
      createdAt: r.createdAt as string,
      other: other ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary font-mono">Chat</h1>
        {isModOrAbove(user.role) && (
          <Link
            href="/support/chat/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            New DM
          </Link>
        )}
      </div>
      <p className="text-sm text-text-muted">
        Your direct message conversations. {isModOrAbove(user.role) && "As staff you can start a DM with any user."}
      </p>
      {list.length === 0 ? (
        <div className="rounded-lg border border-border bg-background-secondary/40 px-4 py-8 text-center text-sm text-text-muted">
          No conversations yet.
          {isModOrAbove(user.role) && (
            <>
              {" "}
              <Link href="/support/chat/new" className="text-accent hover:underline">
                Start a DM
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="rounded-lg border border-border bg-background-secondary/40 divide-y divide-border overflow-hidden">
          {list.map((conv) => (
            <li key={conv.id}>
              <Link
                href={`/support/chat/${conv.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-background-secondary/60"
              >
                <span className="font-medium text-text-primary">
                  {conv.other?.name || conv.other?.email || "Unknown"}
                </span>
                <span className="text-text-muted">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
