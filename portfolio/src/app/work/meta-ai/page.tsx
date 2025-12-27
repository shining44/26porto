import Link from 'next/link';
import type { Metadata } from 'next';
import RedactedImage from '@/components/RedactedImage';

export const metadata: Metadata = {
  title: 'Meta AI — Ali Tayyebi',
  description: 'Case study: Designing the consumer-facing AI assistant powering conversational experiences across Meta platforms.',
};

export default function MetaAICaseStudy() {
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
            Consumer AI
          </span>
          <span className="text-xs text-[var(--muted)]">2023–Present</span>
        </div>
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-4">
          Meta AI
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl">
          Consumer-facing AI assistant powering conversational experiences across Meta platforms.
        </p>
      </header>

      {/* Redacted Image */}
      <RedactedImage caption="Internal concept explorations — details redacted" />

      {/* Context Section */}
      <section className="mb-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-6">
          Context
        </h2>
        <div className="prose prose-neutral max-w-none">
          <p className="text-[var(--muted)]">
            Meta AI represents the company&apos;s flagship consumer AI initiative — an assistant
            designed to be helpful, harmless, and honest across messaging platforms, social
            feeds, and standalone experiences. The challenge was creating conversational
            interfaces that feel natural to billions of users with diverse expectations,
            technical literacy, and cultural contexts.
          </p>
          <p className="text-[var(--muted)]">
            As the complexity of LLM capabilities expanded rapidly, the design team faced
            the challenge of making advanced AI feel approachable without sacrificing
            power. Users needed to understand what the AI could do, when to trust its
            responses, and how to course-correct when needed.
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
            I led the product design team responsible for the core conversational
            experience. This included defining interaction patterns for multi-turn
            dialogues, designing feedback mechanisms for uncertain AI responses,
            and establishing visual language for AI-generated content.
          </p>
          <p className="text-[var(--muted)]">
            Key design decisions focused on:
          </p>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2 mt-4">
            <li>Transparent attribution — clearly distinguishing AI-generated content</li>
            <li>Graceful degradation — providing useful experiences even when model confidence is low</li>
            <li>Progressive disclosure — revealing complexity only when users need it</li>
            <li>Accessible patterns — ensuring the interface works across abilities and contexts</li>
          </ul>
          <p className="text-[var(--muted)] mt-4">
            Working closely with ML researchers, we developed novel patterns for presenting
            citations, acknowledging limitations, and enabling users to refine their queries
            iteratively.
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
            The design system and interaction patterns developed for Meta AI have been
            deployed across multiple surfaces, reaching hundreds of millions of users.
            Key metrics improved significantly:
          </p>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2 mt-4">
            <li>User satisfaction scores increased measurably after design iterations</li>
            <li>Session length and return usage demonstrated strong engagement patterns</li>
            <li>Trust indicators showed users developed appropriate mental models for AI capabilities</li>
          </ul>
          <p className="text-[var(--muted)] mt-4">
            The patterns established in this project now serve as the foundation for
            AI interfaces across Meta&apos;s product ecosystem.
          </p>
        </div>
      </section>

      {/* Navigation */}
      <nav className="pt-8 border-t border-[var(--border)] flex justify-between">
        <Link
          href="/work"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          &larr; All Projects
        </Link>
        <Link
          href="/work/metamate"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Next: Metamate &rarr;
        </Link>
      </nav>
    </article>
  );
}
