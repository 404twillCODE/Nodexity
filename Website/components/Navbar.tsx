import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-medium text-text-primary transition-colors hover:text-accent"
          >
            Hexnode
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-text-secondary transition-colors hover:text-accent"
            >
              Home
            </Link>
            <Link
              href="/docs"
              className="text-sm text-text-secondary transition-colors hover:text-accent"
            >
              Docs
            </Link>
            <Link
              href="/status"
              className="text-sm text-text-secondary transition-colors hover:text-accent"
            >
              Status
            </Link>
            <a
              href="https://discord.gg/RVTAEbdDBJ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary transition-colors hover:text-accent"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

