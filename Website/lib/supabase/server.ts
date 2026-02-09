import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Ignore in Server Component context
        }
      },
    },
  });
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export type UserRole = "user" | "mod" | "admin" | "owner";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const { supabase } = await import("@/lib/supabase");
  const { data: user } = await supabase
    .from("User")
    .select("id, email, name, image, role")
    .eq("id", session.user.id)
    .single();
  return user as { id: string; email: string; name: string | null; image: string | null; role: UserRole } | null;
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function isModOrAbove(role: UserRole | null | undefined): boolean {
  return role === "owner" || role === "admin" || role === "mod";
}
