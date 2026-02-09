import { supabase } from "./supabase";

const DEFAULT_CATEGORIES = [
  { slug: "server-manager", name: "Server Manager", description: "Desktop app, setup, and usage", order: 1 },
  { slug: "general", name: "General", description: "General questions and feedback", order: 2 },
];

export async function ensureCategories() {
  const { count } = await supabase.from("Category").select("*", { count: "exact", head: true });
  if (count != null && count > 0) return;
  await supabase.from("Category").insert(DEFAULT_CATEGORIES);
}
