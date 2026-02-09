"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

export async function updateDisplayName(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Not signed in." };

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 1) return { error: "Display name is required." };
  if (name.length > 100) return { error: "Display name is too long." };

  const { error } = await supabase
    .from("User")
    .update({ name, updatedAt: new Date().toISOString() })
    .eq("id", session.user.id);

  if (error) {
    console.error("updateDisplayName:", error);
    return { error: "Failed to update name." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { ok: true };
}
