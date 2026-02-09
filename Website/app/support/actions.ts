"use server";

import { revalidatePath } from "next/cache";
import { getSession, getCurrentUser, isModOrAbove } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

export async function createThread(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.email) return { error: "You must be logged in to create a thread." };

  const title = formData.get("title") as string | null;
  const body = formData.get("body") as string | null;
  const categorySlug = formData.get("categorySlug") as string | null;

  if (!title?.trim() || !body?.trim() || !categorySlug?.trim()) {
    return { error: "Title, body, and category are required." };
  }

  const { data: category } = await supabase
    .from("Category")
    .select("id, slug")
    .eq("slug", categorySlug)
    .single();
  if (!category) return { error: "Category not found." };

  await supabase.from("Thread").insert({
    title: title.trim().slice(0, 500),
    body: body.trim().slice(0, 10000),
    categoryId: category.id,
    authorId: session.user.id,
  });

  revalidatePath("/support");
  revalidatePath(`/support/category/${categorySlug}`);
  revalidatePath("/profile");
  return { ok: true };
}

export async function createReply(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.email) return { error: "You must be logged in to reply." };

  const threadId = formData.get("threadId") as string | null;
  const body = formData.get("body") as string | null;

  if (!threadId?.trim() || !body?.trim()) return { error: "Thread and body are required." };

  const { data: thread } = await supabase
    .from("Thread")
    .select("id, Category(slug)")
    .eq("id", threadId)
    .single();
  if (!thread) return { error: "Thread not found." };

  const cat = (thread as Record<string, { slug: string } | null>).Category ?? (thread as Record<string, { slug: string } | null>).category;
  const categorySlug = cat?.slug;

  await supabase.from("Reply").insert({
    threadId: thread.id,
    authorId: session.user.id,
    body: body.trim().slice(0, 10000),
  });

  await supabase.from("Thread").update({ updatedAt: new Date().toISOString() }).eq("id", thread.id);

  revalidatePath("/support");
  if (categorySlug) revalidatePath(`/support/category/${categorySlug}`);
  revalidatePath(`/support/thread/${threadId}`);
  revalidatePath("/profile");
  return { ok: true };
}

// ——— Chat / DMs (mod+ can start a conversation with any user) ———

export async function createConversation(otherUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (!isModOrAbove(user.role)) return { error: "Only staff (mod, admin, owner) can start a DM." };
  if (otherUserId === user.id) return { error: "You cannot start a DM with yourself." };

  const user1Id = user.id < otherUserId ? user.id : otherUserId;
  const user2Id = user.id < otherUserId ? otherUserId : user.id;

  const { data: existing } = await supabase
    .from("Conversation")
    .select("id")
    .eq("user1Id", user1Id)
    .eq("user2Id", user2Id)
    .single();

  if (existing) {
    revalidatePath("/support/chat");
    return { ok: true, conversationId: existing.id };
  }

  const { data: inserted, error } = await supabase
    .from("Conversation")
    .insert({ user1Id, user2Id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/support/chat");
  return { ok: true, conversationId: inserted!.id };
}

export async function sendDirectMessage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const conversationId = formData.get("conversationId") as string | null;
  const body = formData.get("body") as string | null;
  if (!conversationId?.trim() || !body?.trim()) return { error: "Conversation and message are required." };

  const { data: conv } = await supabase
    .from("Conversation")
    .select("id, user1Id, user2Id")
    .eq("id", conversationId)
    .single();
  if (!conv || (conv.user1Id !== user.id && conv.user2Id !== user.id)) {
    return { error: "Conversation not found or access denied." };
  }

  await supabase.from("DirectMessage").insert({
    conversationId: conv.id,
    senderId: user.id,
    body: body.trim().slice(0, 10000),
  });

  revalidatePath("/support/chat");
  revalidatePath(`/support/chat/${conversationId}`);
  return { ok: true };
}
