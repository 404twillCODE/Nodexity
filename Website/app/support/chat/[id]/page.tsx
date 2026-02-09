import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { RoleBadge } from "@/components/RoleBadge";
import { DMMessageForm } from "./DMMessageForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SupportChatConversationPage({ params }: Props) {
  const { id: conversationId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/support/chat/" + conversationId);

  const { data: conv, error: convError } = await supabase
    .from("Conversation")
    .select(`
      id,
      user1Id,
      user2Id,
      user1:User!user1Id(id, name, email, role),
      user2:User!user2Id(id, name, email, role)
    `)
    .eq("id", conversationId)
    .single();

  if (convError || !conv) notFound();

  const c = conv as Record<string, unknown>;
  const user1Id = c.user1Id as string;
  const user2Id = c.user2Id as string;
  if (user.id !== user1Id && user.id !== user2Id) notFound();

  const u1 = c.user1 as { id: string; name: string | null; email: string; role?: string } | undefined;
  const u2 = c.user2 as { id: string; name: string | null; email: string; role?: string } | undefined;
  const other = user.id === user1Id ? u2 : u1;

  const { data: messages } = await supabase
    .from("DirectMessage")
    .select(`
      id,
      body,
      createdAt,
      sender:User!senderId(id, name, email, role)
    `)
    .eq("conversationId", conversationId)
    .order("createdAt", { ascending: true });

  const messageList = (messages ?? []).map((m: Record<string, unknown>) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    sender: m.sender as { id: string; name: string | null; email: string; role?: string } | null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/support/chat" className="text-sm text-text-muted hover:text-accent">← Back to Chat</Link>
        <h1 className="mt-2 text-xl font-semibold text-text-primary font-mono">
          DM with {other?.name || other?.email || "Unknown"}
          {other && <RoleBadge role={other.role as "user" | "mod" | "admin" | "owner" | undefined} size="sm" className="ml-2" />}
        </h1>
      </div>

      <div className="rounded-lg border border-border bg-background-secondary/40 flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messageList.length === 0 ? (
            <p className="text-sm text-text-muted">No messages yet. Send one below.</p>
          ) : (
            messageList.map((msg) => (
              <div
                key={msg.id as string}
                className={msg.sender?.id === user.id ? "flex justify-end" : ""}
              >
                <div
                  className={
                    msg.sender?.id === user.id
                      ? "max-w-[80%] rounded-lg bg-accent/20 px-3 py-2 text-sm text-text-primary"
                      : "max-w-[80%] rounded-lg bg-background-secondary/80 px-3 py-2 text-sm text-text-primary"
                  }
                >
                  {msg.sender?.id !== user.id && (
                    <p className="text-xs font-medium text-text-muted mb-0.5">
                      {msg.sender?.name || msg.sender?.email}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.body as string}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(msg.createdAt as string).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border p-4">
          <DMMessageForm conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
