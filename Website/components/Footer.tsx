export default function Footer() {
  return (
    <footer className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} Hexnode. All rights reserved.
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
            <a
              href="#"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

