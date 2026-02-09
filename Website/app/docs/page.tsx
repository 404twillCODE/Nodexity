import Link from "next/link";

export default function DocsPage() {
  return (
    <section className="full-width-section relative bg-background-secondary">
      <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10">
          <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-mono text-accent">Early access</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl font-mono">
            Documentation
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            Nodexity is in early access. This page covers what’s available now, how to get started, and where to get help.
          </p>
        </div>

        <div className="space-y-10 border-t border-border pt-8 text-sm text-text-secondary sm:text-base">
          <section>
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              What’s available now
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
              <li><span className="text-text-primary">Server Manager (desktop app)</span> — Create and manage Minecraft servers locally (Electron + React).</li>
              <li><span className="text-text-primary">This website</span> — Docs, support (via Discord), and settings. No account required.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              Getting started
            </h2>
            <h3 className="mt-3 text-sm font-medium text-text-primary">Desktop app (development)</h3>
            <p className="mt-1 text-text-muted">Prerequisites: Node.js v20+, npm, Java (for Minecraft servers).</p>
            <pre className="mt-2 overflow-x-auto rounded border border-border bg-background px-4 py-3 font-mono text-xs text-text-primary">
{`git clone https://github.com/404twillCODE/Nodexity.git
cd Nodexity/App
npm install
npm run dev`}
            </pre>
            <h3 className="mt-4 text-sm font-medium text-text-primary">Website (development)</h3>
            <pre className="mt-1 overflow-x-auto rounded border border-border bg-background px-4 py-3 font-mono text-xs text-text-primary">
{`cd Nodexity/Website
npm install
npm run dev`}
            </pre>
            <p className="mt-1 text-text-muted">Runs at http://localhost:4000</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              Known limitations (early access)
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed text-text-muted">
              <li>Features and APIs may change without notice.</li>
              <li>Launcher and hosting are not yet available.</li>
              <li>No automated backups or SLAs; use at your own risk.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              Get help and give feedback
            </h2>
            <ul className="mt-2 space-y-2 leading-relaxed">
              <li>
                <Link href="/support" className="text-accent hover:underline">Support</Link>
                {" — Get help and join the community on Discord (no extra account)."}
              </li>
              <li>
                <a href="https://discord.gg/RVTAEbdDBJ" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Discord</a>
                {" — Chat and quick help."}
              </li>
              <li>
                <a href="https://github.com/404twillCODE/Nodexity" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">GitHub</a>
                {" — Source code, issues, and README."}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              Project structure
            </h2>
            <div className="mt-2 space-y-1">
              <div><span className="text-text-primary">/App</span> — Desktop app (Electron + React)</div>
              <div><span className="text-text-primary">/Website</span> — This site (Next.js)</div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              Licenses
            </h2>
            <div className="mt-2 space-y-1">
              <div><span className="text-text-primary">App:</span> AGPL-3.0</div>
              <div><span className="text-text-primary">Website:</span> MIT</div>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/support" className="btn-primary">
            <span className="relative z-20 font-mono">SUPPORT</span>
          </Link>
          <a href="https://discord.gg/RVTAEbdDBJ" target="_blank" rel="noopener noreferrer" className="btn-discord">
            <span className="relative z-20 font-mono">DISCORD</span>
          </a>
          <a href="https://github.com/404twillCODE/Nodexity" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <span className="relative z-20 font-mono">GITHUB</span>
          </a>
          <Link href="/" className="btn-secondary">
            <span className="relative z-20 font-mono">HOME</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
