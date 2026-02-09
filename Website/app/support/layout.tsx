import Link from "next/link";
import { ensureCategories } from "@/lib/forum";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SupportLayout({
  children,
}: { children: React.ReactNode }) {
  await ensureCategories();

  const { data: categories } = await supabase
    .from("Category")
    .select("id, slug, name")
    .order("order", { ascending: true });

  const allowedSlugs = ["server-manager", "general"];
  const list = (categories ?? []).filter((c) => allowedSlugs.includes(c.slug));

  return (
    <section className="full-width-section relative min-h-[70vh]">
      <div className="section-content mx-auto flex w-full max-w-6xl gap-0 px-0 py-0 sm:px-4 lg:py-6">
        {/* Discord-style sidebar: channels = categories */}
        <aside className="w-56 shrink-0 border-r border-border bg-background-secondary/80 py-4 pl-4 pr-2">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Categories
          </div>
          <nav className="space-y-0.5">
            <Link
              href="/support"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-background hover:text-text-primary"
            >
              <span className="text-text-muted">#</span>
              All
            </Link>
            {list.map((c) => (
              <Link
                key={c.id}
                href={`/support/category/${c.slug}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-background hover:text-text-primary"
              >
                <span className="text-text-muted">#</span>
                {c.name}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Chat
            </div>
            <Link
              href="/support/chat"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-background hover:text-text-primary"
            >
              DMs
            </Link>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <a
              href="https://discord.gg/RVTAEbdDBJ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-muted hover:bg-background hover:text-accent"
            >
              Discord
            </a>
            <Link href="/faq" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-muted hover:bg-background hover:text-text-secondary">
              FAQ
            </Link>
          </div>
        </aside>

        {/* Main content area */}
        <main className="min-w-0 flex-1 bg-background/50 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </section>
  );
}
