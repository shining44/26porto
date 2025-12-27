import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devmate — Ali Tayyebi',
  description: 'Case study: AI-powered developer tools for code generation and engineering workflows.',
};

export default function DevmateCaseStudy() {
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
            Developer Tools
          </span>
          <span className="text-xs text-[var(--muted)]">2023–Present</span>
        </div>
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-4">
          Devmate
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl">
          AI-powered developer tools for code generation and engineering workflows.
        </p>
      </header>

      {/* Context Section */}
      <section className="mb-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-6">
          Context
        </h2>
        <div className="prose prose-neutral max-w-none">
          <p className="text-[var(--muted)]">
            Devmate addresses a specific challenge in developer tooling: how to integrate
            AI assistance into the coding workflow without disrupting the concentration
            and flow that makes engineers productive. Unlike general-purpose AI assistants,
            developer tools require deep understanding of code context, language semantics,
            and the specific conventions of large codebases.
          </p>
          <p className="text-[var(--muted)]">
            The project began as an exploration of how LLMs could accelerate common
            engineering tasks — code review, documentation, refactoring, debugging —
            while maintaining the quality standards required in production systems.
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
            My role focused on designing the interaction layer between engineers and
            AI capabilities. This required close collaboration with engineering teams
            to understand their actual workflows — not idealized versions, but the
            messy reality of debugging production issues at 2 AM.
          </p>
          <p className="text-[var(--muted)]">
            Core design principles:
          </p>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2 mt-4">
            <li>Minimal interruption — AI assistance should be available but not intrusive</li>
            <li>Context preservation — understanding the broader codebase, not just the current file</li>
            <li>Confidence calibration — clearly communicating when AI suggestions may be uncertain</li>
            <li>Incremental adoption — allowing engineers to adopt features at their own pace</li>
          </ul>
          <p className="text-[var(--muted)] mt-4">
            We prototyped extensively with internal engineering teams, iterating on
            everything from trigger mechanisms to output formatting to ensure the
            tool felt like a natural extension of existing workflows.
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
            Devmate has been deployed to engineering teams across Meta, with measurable
            impact on development velocity:
          </p>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2 mt-4">
            <li>Code review cycle time reduced significantly</li>
            <li>Documentation coverage improved across projects using the tool</li>
            <li>Bug detection rates increased through AI-assisted code analysis</li>
            <li>High adoption rates among engineers who tried the tool</li>
          </ul>
          <p className="text-[var(--muted)] mt-4">
            The project demonstrated that AI tools for developers require distinct
            design approaches compared to general-purpose AI assistants — respecting
            the cognitive demands of programming while providing genuine productivity gains.
          </p>
        </div>
      </section>

      {/* Navigation */}
      <nav className="pt-8 border-t border-[var(--border)] flex justify-between">
        <Link
          href="/work/metamate"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          &larr; Previous: Metamate
        </Link>
        <Link
          href="/work"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          All Projects &rarr;
        </Link>
      </nav>
    </article>
  );
}
