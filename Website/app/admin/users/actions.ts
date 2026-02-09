"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdminRole } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/supabase/server";

export async function setUserRole(userId: string, newRole: UserRole) {
  const current = await getCurrentUser();
  if (!current || !isAdminRole(current.role)) {
    return { error: "Forbidden." };
  }
  // Only owner can assign owner or change an owner's role
  const { data: target } = await supabase
    .from("User")
    .select("role")
    .eq("id", userId)
    .single();

  if (target?.role === "owner" && current.role !== "owner") {
    return { error: "Only the owner can change an owner's role." };
  }
  if (newRole === "owner" && current.role !== "owner") {
    return { error: "Only the owner can assign the owner role." };
  }

  const { error } = await supabase
    .from("User")
    .update({ role: newRole, updatedAt: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("setUserRole:", error);
    return { error: "Failed to update role." };
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}
