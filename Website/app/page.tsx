import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-text-primary sm:text-6xl md:text-7xl">
            HexNode
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-xl text-text-secondary">
            Infrastructure management reimagined. Powerful, minimal, and built
            for developers who demand precision.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded border border-accent/30 bg-accent/10 px-8 py-3 text-sm font-medium text-accent transition-all hover:border-accent/50 hover:bg-accent/20"
            >
              Get Started
            </Link>
            <Link
              href="/docs"
              className="rounded border border-border px-8 py-3 text-sm font-medium text-text-secondary transition-all hover:border-border-hover hover:text-text-primary"
            >
              Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Software Overview Section */}
      <section className="border-y border-border bg-background-secondary">
        <div className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                Software
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                Deploy and manage your applications with ease. Our platform
                provides the tools you need to run your software stack
                efficiently, with monitoring, scaling, and management all in
                one place.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Automated deployment pipelines
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Real-time monitoring and alerts
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Resource scaling and optimization
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded border border-border bg-background p-8">
              <div className="space-y-4">
                <div className="h-4 w-3/4 rounded bg-border"></div>
                <div className="h-4 w-full rounded bg-border"></div>
                <div className="h-4 w-5/6 rounded bg-border"></div>
                <div className="mt-6 flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent"></div>
                  <div className="h-2 w-2 rounded-full bg-border"></div>
                  <div className="h-2 w-2 rounded-full bg-border"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hosting Overview Section */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded border border-border bg-background p-8 opacity-50">
                <div className="space-y-4">
                  <div className="h-4 w-3/4 rounded bg-border"></div>
                  <div className="h-4 w-full rounded bg-border"></div>
                  <div className="h-4 w-5/6 rounded bg-border"></div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-block rounded border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                Coming Soon
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                Hosting
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                Enterprise-grade hosting infrastructure designed for
                performance and reliability. Deploy your applications on our
                global network with automatic scaling and redundancy.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Global edge network deployment
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Automatic failover and redundancy
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Built-in CDN and DDoS protection
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* USB Server Overview Section */}
      <section className="border-b border-border bg-background-secondary">
        <div className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
                USB Server
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                Remotely access and manage USB devices over the network. Share
                USB peripherals across your infrastructure with secure,
                low-latency connections.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Network-based USB device sharing
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Low-latency remote access
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-accent">→</span>
                  <span className="text-text-secondary">
                    Secure device management
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded border border-border bg-background p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-3 w-3 rounded-full bg-accent"></div>
                  <div className="h-4 flex-1 rounded bg-border"></div>
                </div>
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="h-3 w-3 rounded-full bg-border"></div>
                  <div className="h-4 flex-1 rounded bg-border"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-border"></div>
                  <div className="h-4 flex-1 rounded bg-border"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision / Philosophy Section */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-4xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              Built for Developers
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-text-secondary">
              HexNode is built on the principle that infrastructure management
              should be powerful yet simple. We believe in minimal interfaces,
              clear abstractions, and giving developers the control they need
              without the complexity they don't.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              Every feature is designed with precision and purpose. No bloat, no
              unnecessary complexity—just the tools you need to build and deploy
              with confidence.
            </p>
            <div className="mt-12 flex items-center justify-center gap-8 border-t border-border pt-12">
              <div className="text-center">
                <div className="text-3xl font-semibold text-accent">99.9%</div>
                <div className="mt-2 text-sm text-text-muted">Uptime SLA</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-semibold text-accent">24/7</div>
                <div className="mt-2 text-sm text-text-muted">Monitoring</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-semibold text-accent">API</div>
                <div className="mt-2 text-sm text-text-muted">First Design</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
