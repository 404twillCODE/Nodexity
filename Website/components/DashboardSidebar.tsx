'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardSidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Servers', href: '/dashboard/servers' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 bg-background border-r border-foreground/10 flex flex-col z-40">
      {/* Brand Section */}
      <div className="p-6 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="HEXNODE Logo"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="text-lg font-semibold text-foreground">
            HEXNODE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-accent/10 text-accent border-l-2 border-accent'
                    : 'text-muted hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-foreground/10">
        <Link
          href="/dashboard/settings"
          className="px-4 py-2.5 rounded-lg transition-all duration-200 text-muted hover:text-foreground hover:bg-foreground/5"
        >
          <span className="text-sm font-medium">Account</span>
        </Link>
      </div>
    </aside>
  );
}

