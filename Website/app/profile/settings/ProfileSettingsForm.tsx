"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName } from "./actions";
import { createClient } from "@/lib/supabase/client";

type Props = { user: { id: string; name: string | null; email: string } };

export function ProfileSettingsForm({ user }: Props) {
  const router = useRouter();
  const [nameMessage, setNameMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameMessage(null);
    setLoading("name");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await updateDisplayName(formData);
    if (result.error) {
      setLoading(null);
      setNameMessage({ type: "error", text: result.error });
      return;
    }
    const name = (formData.get("name") as string)?.trim();
    if (name) {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { name } });
    }
    setLoading(null);
    setNameMessage({ type: "ok", text: "Display name updated." });
    router.refresh();
  }

  async function handleChangeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailMessage(null);
    const form = e.currentTarget;
    const newEmail = (form.querySelector('input[name="newEmail"]') as HTMLInputElement)?.value?.trim().toLowerCase();
    if (!newEmail) {
      setEmailMessage({ type: "error", text: "Enter a new email." });
      return;
    }
    setLoading("email");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        setEmailMessage({ type: "error", text: error.message });
        setLoading(null);
        return;
      }
      setEmailMessage({ type: "ok", text: "Check your new email to confirm the change." });
      router.refresh();
    } catch {
      setEmailMessage({ type: "error", text: "Something went wrong." });
    }
    setLoading(null);
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMessage(null);
    const form = e.currentTarget;
    const currentPassword = (form.querySelector('input[name="currentPassword"]') as HTMLInputElement)?.value;
    const newPassword = (form.querySelector('input[name="newPassword"]') as HTMLInputElement)?.value;
    if (!currentPassword) {
      setPasswordMessage({ type: "error", text: "Enter your current password." });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setLoading("password");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordMessage({ type: "error", text: "Current password is incorrect." });
        setLoading(null);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage({ type: "error", text: error.message });
        setLoading(null);
        return;
      }
      setPasswordMessage({ type: "ok", text: "Password updated." });
      form.reset();
    } catch {
      setPasswordMessage({ type: "error", text: "Something went wrong." });
    }
    setLoading(null);
  }

  const inputClass = "w-full rounded border border-border bg-background-secondary px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  const labelClass = "mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-muted";

  return (
    <div className="space-y-8">
      {/* Display name */}
      <section className="rounded border border-border bg-background-secondary/50 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Display name</h2>
        <form onSubmit={handleNameSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            defaultValue={user.name ?? ""}
            required
            minLength={1}
            maxLength={100}
            className={inputClass}
            placeholder="Your display name"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading !== null} className="btn-primary disabled:opacity-50">
              <span className="relative z-20 font-mono">Save name</span>
            </button>
            {nameMessage && (
              <span className={nameMessage.type === "ok" ? "text-green-500 text-sm" : "text-red-400 text-sm"}>{nameMessage.text}</span>
            )}
          </div>
        </form>
      </section>

      {/* Email */}
      <section className="rounded border border-border bg-background-secondary/50 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Email</h2>
        <p className="text-sm text-text-muted mb-4">Current: {user.email}</p>
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <label htmlFor="newEmail" className={labelClass}>New email</label>
          <input
            id="newEmail"
            type="email"
            name="newEmail"
            className={inputClass}
            placeholder="new@example.com"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading !== null} className="btn-primary disabled:opacity-50">
              <span className="relative z-20 font-mono">{loading === "email" ? "Sending…" : "Change email"}</span>
            </button>
            {emailMessage && (
              <span className={emailMessage.type === "ok" ? "text-green-500 text-sm" : "text-red-400 text-sm"}>{emailMessage.text}</span>
            )}
          </div>
        </form>
        <p className="mt-2 text-xs text-text-muted">You’ll receive a confirmation link at the new address.</p>
      </section>

      {/* Password */}
      <section className="rounded border border-border bg-background-secondary/50 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <label htmlFor="currentPassword" className={labelClass}>Current password</label>
          <input
            id="currentPassword"
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            className={inputClass}
            placeholder="••••••••"
          />
          <label htmlFor="newPassword" className={labelClass}>New password (min 8 characters)</label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
            placeholder="••••••••"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading !== null} className="btn-primary disabled:opacity-50">
              <span className="relative z-20 font-mono">{loading === "password" ? "Updating…" : "Update password"}</span>
            </button>
            {passwordMessage && (
              <span className={passwordMessage.type === "ok" ? "text-green-500 text-sm" : "text-red-400 text-sm"}>{passwordMessage.text}</span>
            )}
          </div>
        </form>
        <p className="mt-3 text-sm text-text-muted">
          Forgot your password? <a href="/forgot-password" className="text-accent hover:underline">Reset it here</a>.
        </p>
      </section>
    </div>
  );
}
