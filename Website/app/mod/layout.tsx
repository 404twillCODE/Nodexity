import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isModOrAbove } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ModLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !isModOrAbove(user.role)) {
    redirect("/support");
  }

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link href="/mod" className="text-2xl font-semibold text-text-primary font-mono">
              Moderation
            </Link>
            <p className="mt-1 text-sm text-text-muted">Manage threads and replies. Visible to mods, admins, and owners.</p>
          </div>
          <nav className="flex gap-4">
            <Link href="/mod" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Dashboard
            </Link>
            <Link href="/mod/threads" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Threads
            </Link>
            <Link href="/mod/replies" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Replies
            </Link>
            <Link href="/support" className="text-sm text-text-muted hover:text-accent">
              ← Support
            </Link>
            {user.role === "owner" || user.role === "admin" ? (
              <Link href="/admin" className="text-sm text-accent hover:underline">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>
        {children}
      </div>
    </section>
  );
}
