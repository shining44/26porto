import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research — Ali Tayyebi',
  description: 'Research publication on multi-line AI-assisted code authoring at scale.',
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
          Academic contributions to AI-assisted developer tooling.
        </p>
      </header>

      {/* Paper Section */}
      <article className="border-t border-[var(--border)] pt-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded">
              arXiv 2024
            </span>
            <span className="text-xs text-[var(--muted)]">Co-author</span>
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-3">
            Multi-line AI-assisted Code Authoring
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            arXiv:2402.04141 · February 2024
          </p>
        </div>

        {/* Problem */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Problem
          </h3>
          <p className="text-[var(--muted)]">
            AI-assisted code authoring tools powered by large language models have transformed
            developer workflows, but scaling from single-line to multi-line suggestions introduces
            unique challenges. Developers need inline suggestions that are contextually relevant,
            non-disruptive, and accurate enough to trust — all while maintaining the flow state
            essential to productive coding. The research addresses how to design and deploy
            multi-line code suggestions at scale to tens of thousands of developers.
          </p>
        </section>

        {/* Contribution */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Contribution
          </h3>
          <p className="text-[var(--muted)] mb-4">
            This paper presents CodeCompose, an AI-assisted code authoring tool deployed at Meta.
            My contribution focused on the product design and user experience of multi-line
            suggestions — defining interaction patterns that help developers efficiently review,
            accept, or modify AI-generated code blocks.
          </p>
          <p className="text-[var(--muted)]">
            Key challenges addressed include: determining when to show multi-line vs single-line
            suggestions, designing clear visual presentation of multi-line code blocks, handling
            partial acceptance of suggestions, and maintaining usability across different
            programming languages and editor contexts.
          </p>
        </section>

        {/* Outcomes */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Outcomes
          </h3>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2">
            <li>CodeCompose deployed to tens of thousands of developers at Meta</li>
            <li>Multi-line suggestions significantly increased code acceptance rates</li>
            <li>Established design patterns for AI code assistance adopted across the organization</li>
            <li>Research contributed to the broader understanding of LLM-powered developer tools</li>
          </ul>
        </section>

        {/* Link */}
        <section className="mb-12">
          <a
            href="https://arxiv.org/abs/2402.04141"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            Read the full paper on arXiv
            <span aria-hidden="true">&rarr;</span>
          </a>
        </section>

        {/* Citation */}
        <section className="bg-neutral-50 p-6 rounded-lg">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Citation
          </h3>
          <p className="text-sm text-[var(--muted)] font-mono leading-relaxed">
            Dunay, O., Cheng, D., Tait, A., Thakkar, P., Rigby, P.C., Chiu, A., Ahmad, I.,
            Ganesan, A., Maddila, C., Murali, V., Tayyebi, A., &amp; Nagappan, N. (2024).
            Multi-line AI-assisted Code Authoring. arXiv:2402.04141.
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
