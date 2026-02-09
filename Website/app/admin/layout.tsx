import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAdminRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link href="/admin" className="text-2xl font-semibold text-text-primary font-mono">
              Admin
            </Link>
            <p className="mt-1 text-sm text-text-muted">Manage users, view support threads, and more.</p>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/admin"
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/threads"
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              Threads
            </Link>
            <Link
              href="/admin/users"
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              Users
            </Link>
            <Link href="/support" className="text-sm text-text-muted hover:text-accent">
              ← Support
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </section>
  );
}
