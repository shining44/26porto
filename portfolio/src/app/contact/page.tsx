import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Ali Tayyebi',
  description: 'Get in touch to discuss AI-powered design collaboration.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-4">
          Get in Touch
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl">
          Interested in discussing AI-powered design or exploring collaboration opportunities.
        </p>
      </header>

      {/* Contact Section */}
      <section className="mb-16">
        <div className="grid gap-8 max-w-lg">
          {/* Email */}
          <div className="border-t border-[var(--border)] pt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
              Email
            </h2>
            <a
              href="mailto:ali@example.com"
              className="text-lg hover:text-[var(--accent)] transition-colors"
            >
              ali@example.com
            </a>
          </div>

          {/* LinkedIn */}
          <div className="border-t border-[var(--border)] pt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
              LinkedIn
            </h2>
            <a
              href="https://linkedin.com/in/alitayyebi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg hover:text-[var(--accent)] transition-colors"
            >
              linkedin.com/in/alitayyebi
            </a>
          </div>

          {/* Location */}
          <div className="border-t border-[var(--border)] pt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
              Location
            </h2>
            <p className="text-lg text-[var(--muted)]">
              San Francisco Bay Area
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-50 p-8 rounded-lg">
        <h2 className="font-medium mb-3">Let&apos;s collaborate on AI-powered design</h2>
        <p className="text-sm text-[var(--muted)] mb-6 max-w-lg">
          Whether you&apos;re working on conversational AI, enterprise tools, or exploring
          how LLMs can enhance user experiences — I&apos;m interested in connecting with
          practitioners and researchers in this space.
        </p>
        <a
          href="mailto:ali@example.com"
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
        >
          Send an email
          <span aria-hidden="true">&rarr;</span>
        </a>
      </section>
    </div>
  );
}
