'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-foreground/10">
      <div className="flex items-center justify-between h-full max-w-7xl mx-auto px-6">
        {/* Left side - Logo */}
        <Link href="/" className="flex items-center h-full">
          <Image
            src="/logo.png"
            alt="HEXNODE Logo"
            width={120}
            height={30}
            priority
            className="object-contain h-7"
          />
        </Link>

        {/* Right side - Navigation links */}
        <div className="flex items-center gap-8">
          <motion.div
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href="/pricing"
              className="text-muted hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href="/docs"
              className="text-muted hover:text-foreground transition-colors"
            >
              Docs
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href="/login"
              className="text-muted hover:text-accent transition-colors"
            >
              Login
            </Link>
          </motion.div>
        </div>
      </div>
    </nav>
  );
}

