import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ProfileSettingsForm } from "./ProfileSettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile settings | Nodexity",
  description: "Update your display name, email, and password",
};

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile/settings");
  }

  const { data: user } = await supabase
    .from("User")
    .select("id, name, email")
    .eq("id", session.user.id)
    .single();

  if (!user) redirect("/login");

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto w-full max-w-xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10">
          <Link href="/profile" className="text-sm text-text-muted hover:text-accent mb-2 inline-block">
            ← Profile
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
            PROFILE SETTINGS
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Update your display name, email, or password.
          </p>
        </div>

        <ProfileSettingsForm user={user} />

        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8">
          <Link href="/profile" className="btn-secondary">
            <span className="relative z-20 font-mono">← PROFILE</span>
          </Link>
          <Link href="/" className="btn-secondary">
            <span className="relative z-20 font-mono">HOME</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
