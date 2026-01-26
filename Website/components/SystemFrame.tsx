"use client";

export function SystemTopBar() {
  return (
    <div className="border-b border-border bg-background-secondary">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-text-primary">
            HexNode
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <a
            href="/"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Overview
          </a>
          <a
            href="/docs"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Docs
          </a>
        </nav>
      </div>
    </div>
  );
}

export function SystemFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-text-muted">
            © {currentYear} Hexnode. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="https://discord.gg/RVTAEbdDBJ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Discord
            </a>
            <a
              href="/faq"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              FAQ
            </a>
            <a
              href="https://discord.gg/RVTAEbdDBJ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Support
            </a>
            <a
              href="/donate"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Donate
            </a>
            <a
              href="#"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
