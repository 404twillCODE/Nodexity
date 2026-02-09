export default function SupportLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <section className="full-width-section relative min-h-[70vh]">
      <div className="section-content mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
