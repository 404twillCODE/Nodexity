import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile | Nodexity",
  description: "Your profile and support threads",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });
  if (!user) redirect("/login");

  const myThreads = await prisma.thread.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      category: { select: { slug: true, name: true } },
      _count: { select: { replies: true } },
    },
  });

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
            PROFILE
          </h1>
          <p className="mt-2 text-text-secondary">
            {user.name || user.email}
            {user.name && <span className="text-text-muted"> · {user.email}</span>}
          </p>
        </div>

        <div className="space-y-8 border-t border-border pt-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-text-primary">My threads</h2>
            {myThreads.length === 0 ? (
              <p className="text-sm text-text-muted">You haven’t started any support threads yet.</p>
            ) : (
              <ul className="space-y-2">
                {myThreads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/support/thread/${t.id}`}
                      className="block rounded border border-border bg-background-secondary/50 px-4 py-3 text-text-primary hover:border-accent/30 hover:bg-background-secondary transition-colors"
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className="ml-2 text-xs text-text-muted">
                        {t.category.name} · {t._count.replies} replies
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3">
              <Link href="/support" className="text-sm text-accent hover:underline">
                Go to Support forum →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8">
          <Link href="/support" className="btn-secondary">
            <span className="relative z-20 font-mono">SUPPORT</span>
          </Link>
          <Link href="/" className="btn-secondary">
            <span className="relative z-20 font-mono">BACK HOME</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
