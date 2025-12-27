import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research — Ali Tayyebi',
  description: 'Research publication on human-AI interaction patterns in conversational interfaces.',
};

export default function PaperPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-4">
          Research
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl">
          Academic contributions to the field of human-AI interaction design.
        </p>
      </header>

      {/* Paper Section */}
      <article className="border-t border-[var(--border)] pt-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded">
              CHI 2024
            </span>
            <span className="text-xs text-[var(--muted)]">Co-author</span>
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-3">
            Design Patterns for Trust Calibration in LLM-Based Conversational Interfaces
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            Published in Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems
          </p>
        </div>

        {/* Problem */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Problem
          </h3>
          <p className="text-[var(--muted)]">
            As large language models become integrated into consumer and enterprise products,
            users struggle to develop accurate mental models of AI capabilities. This leads to
            two failure modes: over-trust (accepting incorrect outputs uncritically) and
            under-trust (failing to use AI for tasks where it excels). The research investigates
            design interventions that help users calibrate their trust appropriately based on
            task type, model confidence, and output verifiability.
          </p>
        </section>

        {/* Contribution */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Contribution
          </h3>
          <p className="text-[var(--muted)] mb-4">
            My contribution focused on the design and implementation of interface prototypes
            used in the study. Working with research partners, I developed a framework of
            trust calibration patterns that were tested with participants across different
            experience levels and task domains.
          </p>
          <p className="text-[var(--muted)]">
            Key design patterns identified include: explicit uncertainty indicators,
            source attribution hierarchies, comparative response generation, and
            progressive verification flows. The paper presents empirical evidence
            for which patterns are most effective in different contexts.
          </p>
        </section>

        {/* Outcomes */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Outcomes
          </h3>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2">
            <li>The paper was accepted at CHI 2024, the premier venue for human-computer interaction research</li>
            <li>Findings have been integrated into design guidelines at Meta and influenced industry practices</li>
            <li>The trust calibration framework is being extended in follow-up research</li>
          </ul>
        </section>

        {/* Citation */}
        <section className="bg-neutral-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Citation
          </h3>
          <p className="text-sm text-[var(--muted)] font-mono">
            Chen, L., Tayyebi, A., Ramirez, S., & Wong, K. (2024). Design Patterns for Trust
            Calibration in LLM-Based Conversational Interfaces. In Proceedings of the 2024
            CHI Conference on Human Factors in Computing Systems (CHI &apos;24). ACM, New York, NY, USA.
          </p>
        </section>
      </article>

      {/* Navigation */}
      <nav className="pt-12 border-t border-[var(--border)] mt-16">
        <Link
          href="/about"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Learn more about my background &rarr;
        </Link>
      </nav>
    </div>
  );
}
