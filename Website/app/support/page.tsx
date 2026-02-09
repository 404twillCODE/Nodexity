import Link from "next/link";

export const metadata = {
  title: "Support | Nodexity",
  description: "Get help and join the community on Discord",
};

const DISCORD_URL = "https://discord.gg/RVTAEbdDBJ";

export default function SupportPage() {
  return (
    <section className="full-width-section relative min-h-[50vh]">
      <div className="section-content mx-auto max-w-xl px-4 py-24 sm:px-6 lg:py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl font-mono">
          SUPPORT
        </h1>
        <p className="mt-4 text-text-secondary">
          Get help, ask questions, and join the community on Discord. No extra accounts—just use Discord.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center justify-center"
          >
            <span className="relative z-20 font-mono">JOIN DISCORD</span>
          </a>
          <Link href="/faq" className="btn-secondary inline-flex items-center justify-center">
            <span className="relative z-20 font-mono">FAQ</span>
          </Link>
        </div>
        <p className="mt-8 text-sm text-text-muted">
          <Link href="/" className="text-accent hover:underline">← Back home</Link>
        </p>
      </div>
    </section>
  );
}
