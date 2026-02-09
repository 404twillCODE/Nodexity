"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Replace with your real donation links
const donationOptions = [
  {
    id: "paypal",
    name: "PayPal",
    description: "Send a one-time or recurring tip via PayPal.",
    href: "https://paypal.me/YourUsername",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.646h6.238c2.572 0 4.578.543 5.921 1.593 1.288 1.006 1.873 2.388 1.873 4.146 0 .98-.203 1.846-.609 2.597-.614 1.168-1.435 1.95-2.484 2.36-.968.38-2.126.57-3.474.57H9.22a.77.77 0 0 0-.76.646l-.61 3.882-.362 2.296-.024.152a.641.641 0 0 1-.633.54zm.61-14.02l-.61 3.882a.77.77 0 0 1-.76.646H4.58a.641.641 0 0 1-.633-.54l-.61-3.882-.362-2.296-.024-.152a.641.641 0 0 1 .633-.74h4.606a.77.77 0 0 1 .76.646z" />
      </svg>
    ),
    color: "text-[#0070ba]",
    borderHover: "hover:border-[#0070ba]/40 hover:bg-[#0070ba]/5",
  },
  {
    id: "cashapp",
    name: "Cash App",
    description: "Quick support with Cash App.",
    href: "https://cash.app/$YourCashtag",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.59 12.41a.96.96 0 0 0 0-1.36L12.41.23a.96.96 0 0 0-1.36 0L.23 11.05a.96.96 0 0 0 0 1.36l11.18 11.18a.96.96 0 0 0 1.36 0L23.59 12.41zM12 14.47l-2.47-2.47-1.06 1.06 3.53 3.53 5.3-5.3-1.06-1.06L12 14.47z" />
      </svg>
    ),
    color: "text-[#00D54B]",
    borderHover: "hover:border-[#00D54B]/40 hover:bg-[#00D54B]/5",
  },
  {
    id: "kofi",
    name: "Ko-fi",
    description: "Buy me a coffee or leave a tip on Ko-fi.",
    href: "https://ko-fi.com/yourusername",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.592 2.586 2.592s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.424 6.422-2.547 6.648-4.267.263-2.024-.316-3.011-2.401-4.169zM11.89 17.58c-1.721-.052-3.387-.105-3.387-.105s-.251-.024-.365-.126c-.115-.101-.132-.303-.132-.303s-.01-2.582.001-3.848c.012-1.266.084-2.159.084-2.159s.024-.201.158-.302c.134-.1.382-.126.382-.126s2.849-.052 4.515-.105c1.666-.052 2.024.134 2.259.435.235.301.235 1.719.235 1.719s-.012 1.448-.235 1.883c-.224.435-.592.551-2.259.551z" />
      </svg>
    ),
    color: "text-[#FF5E5B]",
    borderHover: "hover:border-[#FF5E5B]/40 hover:bg-[#FF5E5B]/5",
  },
  {
    id: "buymeacoffee",
    name: "Buy Me a Coffee",
    description: "One-time coffee or monthly support.",
    href: "https://buymeacoffee.com/yourusername",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.216 5.415A.81.81 0 0 0 19.41 5h-.017V4a2.598 2.598 0 0 0-2.598-2.598h-2.577A.81.81 0 0 0 13.41 2.41v.017h-2.803V2.41A.81.81 0 0 0 9.798 1.402H7.221A2.598 2.598 0 0 0 4.623 4v1h-.017a.81.81 0 0 0-.806.815v.017c0 .666.54 1.206 1.206 1.206h.017v9.628a2.598 2.598 0 0 0 2.598 2.598h8.434a2.598 2.598 0 0 0 2.598-2.598V6.655h.017c.666 0 1.206-.54 1.206-1.206V5.415zM6.036 4c0-.544.443-.987.987-.987h2.577a.27.27 0 0 1 .27.27v.017h3.246v-.017a.27.27 0 0 1 .27-.27h2.577c.544 0 .987.443.987.987v1h-10.914V4zm10.914 14.434a.987.987 0 0 1-.987.987H7.221a.987.987 0 0 1-.987-.987V6.655h10.914v11.779zm-2.598-6.036a.81.81 0 0 0-.806-.807h-.017a.81.81 0 0 0-.806.807v3.226a.81.81 0 0 0 .806.806h.017a.81.81 0 0 0 .806-.806v-3.226z" />
      </svg>
    ),
    color: "text-[#FFDD00]",
    borderHover: "hover:border-[#FFDD00]/40 hover:bg-[#FFDD00]/5",
  },
];

export default function DonatePage() {
  return (
    <section className="full-width-section relative min-h-[80vh] bg-background">
      <div className="section-content mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-mono text-text-secondary transition-colors hover:text-accent"
        >
          ← Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h1 className="font-mono text-3xl font-semibold uppercase tracking-wider text-text-primary sm:text-4xl lg:text-5xl">
            Support Nodexity
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
            I&apos;m a single developer building the app, website, and everything around it. 
            Any support helps keep this project going — and if you can&apos;t donate, that&apos;s okay too. 
            Starring the repo or joining Discord means a lot.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {donationOptions.map((option, i) => (
            <motion.a
              key={option.id}
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className={`group flex flex-col gap-4 rounded-xl border border-border bg-background-secondary/80 p-6 transition-all duration-200 ${option.borderHover}`}
            >
              <div className={`flex items-center gap-3 ${option.color}`}>
                {option.icon}
                <span className="font-mono text-lg font-medium uppercase tracking-wider text-text-primary">
                  {option.name}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                {option.description}
              </p>
              <span className="mt-auto font-mono text-xs uppercase tracking-wider text-accent opacity-80 group-hover:opacity-100">
                Open {option.name} →
              </span>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-8"
        >
          <span className="text-sm text-text-muted">Other ways to help:</span>
          <a
            href="https://github.com/404twillCODE/Nodexity"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-background-secondary/80 px-4 py-2 text-sm font-mono text-text-secondary transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
          >
            Star on GitHub
          </a>
          <a
            href="https://discord.gg/RVTAEbdDBJ"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-background-secondary/80 px-4 py-2 text-sm font-mono text-text-secondary transition-colors hover:border-[#5865F2]/40 hover:bg-[#5865F2]/10 hover:text-white"
          >
            Join Discord
          </a>
        </motion.div>
      </div>
    </section>
  );
}
