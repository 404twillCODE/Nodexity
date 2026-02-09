"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/support";

    async function finish() {
      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
        // If no code, Supabase may have put tokens in the URL hash; the client
        // will have picked them up when the page loaded.
        setStatus("done");
        router.replace(next);
      } catch {
        setStatus("error");
      }
    }

    finish();
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <section className="full-width-section relative">
        <div className="section-content mx-auto max-w-md px-4 py-24 text-center">
          <p className="text-text-secondary">Something went wrong signing you in.</p>
          <a href="/login" className="mt-4 inline-block text-accent hover:underline">Back to log in</a>
        </div>
      </section>
    );
  }

  return (
    <section className="full-width-section relative">
      <div className="section-content mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-text-muted">Signing you in…</p>
      </div>
    </section>
  );
}
