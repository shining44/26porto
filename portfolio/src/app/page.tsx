import Link from 'next/link';

const featuredProjects = [
  {
    title: 'Meta AI',
    description: 'Consumer-facing AI assistant powering conversational experiences across Meta platforms.',
    href: '/work/meta-ai',
  },
  {
    title: 'Metamate',
    description: 'Enterprise LLM solution enabling internal productivity and knowledge management.',
    href: '/work/metamate',
  },
  {
    title: 'Devmate',
    description: 'AI-powered developer tools for code generation and engineering workflows.',
    href: '/work/devmate',
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      {/* Hero Section */}
      <section className="mb-24">
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-6">
          Director of AI-Driven Product Design
        </h1>
        <p className="text-xl text-[var(--muted)] max-w-2xl mb-8 leading-relaxed">
          Leading a cross-functional design team at Meta Superintelligence Labs —
          innovators of LLM-driven enterprise and consumer products.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-[var(--accent)] transition-colors"
          >
            View selected work
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link
            href="/contact"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>

      {/* Overview */}
      <section className="mb-24">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-6">
          Overview
        </h2>
        <div className="grid gap-6 text-[var(--muted)]">
          <p>
            I lead a small team of coding product-designers building AI-powered
            interfaces that serve billions of users. Our work spans conversational
            AI, intelligent suggestions, and developer tooling — bridging the gap
            between cutting-edge language models and intuitive user experiences.
          </p>
          <p>
            My role combines design leadership with product management, ensuring
            our team delivers solutions that are both technically sound and
            deeply human-centered. I specialize in translating complex AI
            capabilities into clear, usable design patterns.
          </p>
        </div>
      </section>

      {/* Featured Projects */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-8">
          Featured Projects
        </h2>
        <div className="grid gap-1">
          {featuredProjects.map((project) => (
            <Link
              key={project.title}
              href={project.href}
              className="group py-6 border-t border-[var(--border)] flex items-start justify-between gap-8 hover:bg-neutral-50 -mx-4 px-4 transition-colors"
            >
              <div>
                <h3 className="font-medium mb-2 group-hover:text-[var(--accent)] transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  {project.description}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="text-[var(--muted)] group-hover:text-[var(--foreground)] group-hover:translate-x-1 transition-all mt-1"
              >
                &rarr;
              </span>
            </Link>
          ))}
        </div>
        <div className="pt-6 border-t border-[var(--border)]">
          <Link
            href="/work"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            View all projects &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
