import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Ali Tayyebi',
  description: 'Design Lead Manager at Meta Superintelligence Labs, leading AI product design.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-4">
          About
        </h1>
      </header>

      {/* Bio */}
      <section className="mb-16">
        <div className="prose prose-neutral max-w-none">
          <p className="text-lg text-[var(--muted)] mb-6">
            I&apos;m a Design Lead Manager at Meta Superintelligence Labs, where I lead a
            team focused on AI-powered product experiences. My work sits at the intersection
            of design, product management, and machine learning engineering.
          </p>
          <p className="text-[var(--muted)]">
            Before focusing on AI interfaces, I built products across consumer and enterprise
            domains, developing expertise in complex systems design, design systems, and
            cross-functional leadership. I studied computer science and human-computer
            interaction, which shapes my approach to designing technology that augments
            rather than replaces human capability.
          </p>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="mb-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-8">
          Leadership Responsibilities
        </h2>
        <div className="grid gap-8">
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="font-medium mb-2">Team Leadership</h3>
            <p className="text-sm text-[var(--muted)]">
              Managing a team of coding product-designers who work across the full stack —
              from user research to production implementation. Building a culture of craft,
              technical excellence, and user advocacy.
            </p>
          </div>
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="font-medium mb-2">Product Strategy</h3>
            <p className="text-sm text-[var(--muted)]">
              Bridging design and product management for AI initiatives. Defining product
              vision, prioritizing features, and ensuring design decisions align with
              business objectives and user needs.
            </p>
          </div>
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="font-medium mb-2">Cross-Functional Collaboration</h3>
            <p className="text-sm text-[var(--muted)]">
              Working with ML researchers, engineers, and product managers to translate
              model capabilities into user-facing features. Ensuring technical constraints
              and opportunities inform design decisions from the start.
            </p>
          </div>
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="font-medium mb-2">Design Systems</h3>
            <p className="text-sm text-[var(--muted)]">
              Establishing patterns and components for AI interfaces that scale across
              products. Creating guidelines that help teams make consistent decisions
              while allowing appropriate flexibility.
            </p>
          </div>
        </div>
      </section>

      {/* Focus Areas */}
      <section className="mb-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-8">
          Focus Areas
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            'Conversational AI',
            'LLM Interface Design',
            'Enterprise Tools',
            'Developer Experience',
            'Design Leadership',
            'Product Management',
            'Human-AI Interaction',
            'Trust & Transparency',
          ].map((skill) => (
            <span
              key={skill}
              className="text-sm text-[var(--muted)] border border-[var(--border)] px-3 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Navigation */}
      <nav className="pt-8 border-t border-[var(--border)]">
        <Link
          href="/contact"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Get in touch &rarr;
        </Link>
      </nav>
    </div>
  );
}
