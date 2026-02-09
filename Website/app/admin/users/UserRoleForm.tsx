"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/supabase/server";
import { setUserRole } from "./actions";

const ROLES: UserRole[] = ["user", "mod", "admin", "owner"];

type Props = {
  userId: string;
  currentRole: UserRole;
  isOwner: boolean;
  canAssignOwner: boolean;
  isSelf: boolean;
};

export function UserRoleForm({ userId, currentRole, isOwner, canAssignOwner, isSelf }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const options = ROLES.filter((r) => {
    if (r === "owner" && !canAssignOwner) return false;
    return true;
  });

  // Another owner (only owner can change them)
  if (isOwner && !isSelf && !canAssignOwner) {
    return <span className="text-xs text-text-muted">(owner)</span>;
  }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as UserRole;
    if (newRole === currentRole) return;
    setLoading(true);
    setMessage(null);
    const result = await setUserRole(userId, newRole);
    setLoading(false);
    if (result.error) setMessage(result.error);
    else setMessage("Saved.");
  }

  if (isOwner && isSelf) {
    return <span className="text-xs text-text-muted">(you)</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={loading}
        className="rounded border border-border bg-background-secondary px-2 py-1.5 text-sm text-text-primary disabled:opacity-50"
      >
        {options.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {message && (
        <span className={`text-xs ${message === "Saved." ? "text-green-500" : "text-red-400"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
