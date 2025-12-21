'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { fadeUp, fadeUpTransition } from "@/components/motionVariants";

export default function DashboardSidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Servers', href: '/dashboard/servers' },
    { name: 'Billing', href: '/dashboard/billing' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <motion.aside
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 bg-[#080A0F] border-r border-foreground/10 flex flex-col"
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={fadeUpTransition}
    >
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
      <nav className="flex-1 p-4">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </motion.aside>
  );
}

