import Link from 'next/link';
import type { Metadata } from 'next';
import RedactedImage from '@/components/RedactedImage';

export const metadata: Metadata = {
  title: 'Metamate — Ali Tayyebi',
  description: 'Case study: Enterprise LLM solution enabling internal productivity and knowledge management at Meta.',
};

export default function MetamateCaseStudy() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-24">
      {/* Back Link */}
      <Link
        href="/work"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-12"
      >
        <span aria-hidden="true">&larr;</span>
        Back to Work
      </Link>

      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded">
            Enterprise AI
          </span>
          <span className="text-xs text-[var(--muted)]">2022–Present</span>
        </div>
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-4">
          Metamate
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl">
          Enterprise LLM solution enabling internal productivity and knowledge management.
        </p>
      </header>

      {/* Redacted Image */}
      <RedactedImage caption="Internal interface design — details redacted" />

      {/* Context Section */}
      <section className="mb-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-6">
          Context
        </h2>
        <div className="prose prose-neutral max-w-none">
          <p className="text-[var(--muted)]">
            Metamate is Meta&apos;s internal AI assistant, designed to augment employee
            productivity across the organization. Unlike consumer-facing products, enterprise
            tools carry distinct challenges: integration with existing workflows, handling
            sensitive information appropriately, and serving users with vastly different
            technical backgrounds.
          </p>
          <p className="text-[var(--muted)]">
            The project emerged from the need to make institutional knowledge accessible —
            employees spend significant time searching for information scattered across
            documentation, code repositories, and tribal knowledge. An AI assistant could
            dramatically reduce this friction.
          </p>
        </div>
      </section>

      {/* Role & Process Section */}
      <section className="mb-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-6">
          Role & Process
        </h2>
        <div className="prose prose-neutral max-w-none">
          <p className="text-[var(--muted)]">
            My team owned the end-to-end design of Metamate&apos;s interface, from initial
            research through launch and iteration. We conducted extensive research with
            employees across different roles — engineers, product managers, researchers,
            operations staff — to understand their workflows and pain points.
          </p>
          <p className="text-[var(--muted)]">
            Design priorities included:
          </p>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2 mt-4">
            <li>Deep integration with existing tools — fitting into established workflows rather than replacing them</li>
            <li>Context-aware responses — understanding the user&apos;s role, current project, and organizational context</li>
            <li>Verifiable answers — always providing sources and enabling users to check AI outputs</li>
            <li>Actionable suggestions — moving beyond information retrieval to workflow automation</li>
          </ul>
          <p className="text-[var(--muted)] mt-4">
            We iterated rapidly based on internal feedback, shipping updates weekly and
            measuring impact through both quantitative metrics and qualitative interviews.
          </p>
        </div>
      </section>

      {/* Outcome Section */}
      <section className="mb-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-6">
          Outcome
        </h2>
        <div className="prose prose-neutral max-w-none">
          <p className="text-[var(--muted)]">
            Metamate has been adopted widely across Meta, fundamentally changing how
            employees access information and complete routine tasks:
          </p>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2 mt-4">
            <li>Time spent on information retrieval decreased significantly</li>
            <li>Onboarding velocity for new employees improved measurably</li>
            <li>High engagement rates with strong daily active usage</li>
            <li>Positive sentiment in employee surveys regarding productivity tools</li>
          </ul>
          <p className="text-[var(--muted)] mt-4">
            The project established patterns for enterprise AI deployment that have
            influenced product strategy across the organization.
          </p>
        </div>
      </section>

      {/* Navigation */}
      <nav className="pt-8 border-t border-[var(--border)] flex justify-between">
        <Link
          href="/work/meta-ai"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          &larr; Previous: Meta AI
        </Link>
        <Link
          href="/work/devmate"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Next: Devmate &rarr;
        </Link>
      </nav>
    </article>
  );
}
