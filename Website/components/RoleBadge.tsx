type UserRole = "user" | "mod" | "admin" | "owner";

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  owner: { label: "Owner", className: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  admin: { label: "Admin", className: "bg-red-500/20 text-red-400 border-red-500/40" },
  mod: { label: "Mod", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  user: { label: "", className: "" },
};

type Props = { role: UserRole | null | undefined; size?: "sm" | "md" };

export function RoleBadge({ role, size = "sm" }: Props) {
  if (!role || role === "user") return null;
  const config = roleConfig[role];
  if (!config.label) return null;

  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium ${config.className} ${sizeClass}`}
      title={config.label}
    >
      {config.label}
    </span>
  );
}
