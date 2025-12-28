import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research — Ali Tayyebi',
  description: 'CodeCompose: Multi-line AI-assisted code authoring at Meta.',
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
          Peer-reviewed research on AI-assisted developer tools at scale.
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

        {/* Abstract */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Abstract
          </h3>
          <p className="text-[var(--muted)] leading-relaxed">
            CodeCompose is an AI-assisted code authoring tool powered by large language models
            that provides inline suggestions to tens of thousands of developers at Meta.
            This paper presents how we scaled the product from displaying single-line suggestions
            to multi-line suggestions — an evolution that required overcoming several unique
            challenges in improving usability for developers working across diverse codebases
            and programming languages.
          </p>
        </section>

        {/* Challenges */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Key Challenges
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">The Jarring Effect</h4>
              <p className="text-[var(--muted)] leading-relaxed">
                Multi-line suggestions can create a disruptive experience when the LLM&apos;s
                suggestions constantly move around the developer&apos;s existing code. We designed
                interaction patterns that minimize cognitive disruption while maintaining
                the visibility needed for developers to evaluate suggestions effectively.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Latency Optimization</h4>
              <p className="text-[var(--muted)] leading-relaxed">
                Multi-line suggestions take significantly longer to generate than single-line
                completions. We implemented model-hosting optimizations that reduced multi-line
                suggestion latency by 2.5×, making the experience feel responsive despite
                the increased computational complexity.
              </p>
            </div>
          </div>
        </section>

        {/* Contribution */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            My Contribution
          </h3>
          <p className="text-[var(--muted)] leading-relaxed">
            As part of the CodeCompose team, I contributed to the product design and user
            experience strategy for multi-line suggestions. This involved defining when to
            surface multi-line vs single-line completions, designing visual presentation
            of code blocks, enabling partial acceptance workflows, and ensuring consistent
            usability across programming languages and editor contexts.
          </p>
        </section>

        {/* Impact */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Impact
          </h3>
          <ul className="text-[var(--muted)] list-disc pl-5 space-y-2">
            <li>Deployed to tens of thousands of developers at Meta</li>
            <li>2.5× reduction in multi-line suggestion latency through model-hosting optimizations</li>
            <li>Increased code acceptance rates with improved suggestion presentation</li>
            <li>Established scalable design patterns for AI-assisted code authoring</li>
          </ul>
        </section>

        {/* Authors */}
        <section className="mb-12">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-4">
            Authors
          </h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Omer Dunay, Daniel Cheng, Adam Tait, Parth Thakkar, Peter C. Rigby, Andy Chiu,
            Imad Ahmad, Arun Ganesan, Chandra Maddila, Vijayaraghavan Murali,{' '}
            <span className="text-[var(--foreground)] font-medium">Ali Tayyebi</span>,
            Nachiappan Nagappan
          </p>
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
          <pre className="text-xs text-[var(--muted)] font-mono leading-relaxed whitespace-pre-wrap">
{`@article{dunay2024multiline,
  title={Multi-line AI-assisted Code Authoring},
  author={Dunay, Omer and Cheng, Daniel and Tait, Adam and Thakkar, Parth
          and Rigby, Peter C. and Chiu, Andy and Ahmad, Imad and Ganesan, Arun
          and Maddila, Chandra and Murali, Vijayaraghavan and Tayyebi, Ali
          and Nagappan, Nachiappan},
  journal={arXiv preprint arXiv:2402.04141},
  year={2024}
}`}
          </pre>
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
