import Link from "next/link";
import { getCurrentUser, isAdminRole } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";
import { RoleBadge } from "@/components/RoleBadge";
import type { UserRole } from "@/lib/supabase/server";
import { UserRoleForm } from "./UserRoleForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Users | Admin | Nodexity",
  description: "Manage user roles",
};

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminRole(currentUser.role)) return null;

  const { data: users } = await supabase
    .from("User")
    .select("id, email, name, role, createdAt")
    .order("createdAt", { ascending: false });

  const list = users ?? [];
  const canAssignOwner = currentUser.role === "owner";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Users</h1>
      <p className="text-sm text-text-muted">
        Assign roles: <strong>user</strong> (default), <strong>mod</strong>, <strong>admin</strong>, <strong>owner</strong> (only existing owner can assign).
      </p>

      <div className="rounded border border-border bg-background-secondary/30 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background-secondary/50">
              <th className="p-3 font-medium text-text-primary">User</th>
              <th className="p-3 font-medium text-text-primary">Role</th>
              <th className="p-3 font-medium text-text-primary">Joined</th>
              {isAdminRole(currentUser.role) && <th className="p-3 font-medium text-text-primary">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <span className="font-medium text-text-primary">{u.name || u.email}</span>
                  {u.name && <span className="ml-1 text-text-muted">({u.email})</span>}
                </td>
                <td className="p-3">
                  <RoleBadge role={u.role as UserRole} size="md" />
                  {(!u.role || u.role === "user") && <span className="text-text-muted">user</span>}
                </td>
                <td className="p-3 text-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                {isAdminRole(currentUser.role) && (
                  <td className="p-3 flex items-center gap-3">
                    {u.id !== currentUser.id && (
                      <Link
                        href={`/support/chat/new?userId=${u.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Message
                      </Link>
                    )}
                    <UserRoleForm
                      userId={u.id}
                      currentRole={u.role as UserRole}
                      isOwner={u.role === "owner"}
                      canAssignOwner={canAssignOwner}
                      isSelf={u.id === currentUser.id}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
