import { getCurrentUser, isModOrAbove } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StartConversationForm } from "./StartConversationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New DM | Support | Nodexity",
  description: "Start a direct message with a user",
};

type Props = { searchParams: Promise<{ userId?: string }> };

export default async function SupportChatNewPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/support/chat/new");
  if (!isModOrAbove(user.role)) redirect("/support/chat");

  const { userId: queryUserId } = await searchParams;

  const { data: users } = await supabase
    .from("User")
    .select("id, email, name")
    .neq("id", user.id)
    .order("name", { ascending: true });

  let userList = users ?? [];
  if (queryUserId) {
    const idx = userList.findIndex((u) => u.id === queryUserId);
    if (idx > 0) {
      const [target] = userList.splice(idx, 1);
      userList = [target, ...userList];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/support/chat" className="text-sm text-text-muted hover:text-accent">← Back to Chat</Link>
        <h1 className="mt-2 text-xl font-semibold text-text-primary font-mono">New DM</h1>
        <p className="mt-0.5 text-sm text-text-muted">Choose a user to start a direct message (staff only).</p>
      </div>
      <StartConversationForm users={userList} preselectedUserId={queryUserId ?? undefined} />
    </div>
  );
}
