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
  return (
    <div className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <span className="text-xs text-text-muted">
            © 2024 HexNode
          </span>
        </div>
      </div>
    </div>
  );
}
