"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isModOrAbove } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

export async function deleteThread(threadId: string) {
  const user = await getCurrentUser();
  if (!user || !isModOrAbove(user.role)) return { error: "Forbidden." };

  const { error } = await supabase.from("Thread").delete().eq("id", threadId);
  if (error) {
    console.error("deleteThread:", error);
    return { error: "Failed to delete thread." };
  }
  revalidatePath("/mod");
  revalidatePath("/mod/threads");
  revalidatePath("/support");
  revalidatePath("/profile");
  return { ok: true };
}

export async function deleteReply(replyId: string) {
  const user = await getCurrentUser();
  if (!user || !isModOrAbove(user.role)) return { error: "Forbidden." };

  const { error } = await supabase.from("Reply").delete().eq("id", replyId);
  if (error) {
    console.error("deleteReply:", error);
    return { error: "Failed to delete reply." };
  }
  revalidatePath("/mod");
  revalidatePath("/mod/replies");
  revalidatePath("/support");
  return { ok: true };
}
