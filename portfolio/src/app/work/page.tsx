import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work — Ali Tayyebi',
  description: 'Selected case studies from Meta Superintelligence Labs including Meta AI, Metamate, and Devmate.',
};

const projects = [
  {
    title: 'Meta AI',
    category: 'Consumer AI',
    description: 'Consumer-facing AI assistant powering conversational experiences across Meta platforms. Designing intuitive chat interfaces that feel natural and accessible to billions of users.',
    href: '/work/meta-ai',
    year: '2023–Present',
  },
  {
    title: 'Metamate',
    category: 'Enterprise AI',
    description: 'Enterprise LLM solution enabling internal productivity and knowledge management across Meta. Streamlining workflows for tens of thousands of employees.',
    href: '/work/metamate',
    year: '2022–Present',
  },
  {
    title: 'Devmate',
    category: 'Developer Tools',
    description: 'AI-powered developer tools for code generation, review, and engineering workflows. Accelerating development velocity across engineering teams.',
    href: '/work/devmate',
    year: '2023–Present',
  },
];

const otherProjects = [
  {
    title: 'Design System for AI Interfaces',
    description: 'Component library and guidelines for LLM-based product surfaces.',
    year: '2023',
  },
  {
    title: 'Conversational UX Patterns',
    description: 'Research initiative documenting best practices for chat-based AI interactions.',
    year: '2022',
  },
];

export default function WorkPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-[2.75rem] font-medium tracking-tight mb-4">
          Selected Work
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-xl">
          Case studies from my time leading AI product design at Meta Superintelligence Labs.
        </p>
      </header>

      {/* Featured Projects */}
      <section className="mb-20">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-8">
          Featured Projects
        </h2>
        <div className="grid gap-1">
          {projects.map((project) => (
            <Link
              key={project.title}
              href={project.href}
              className="group py-8 border-t border-[var(--border)] hover:bg-neutral-50 -mx-4 px-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium group-hover:text-[var(--accent)] transition-colors">
                      {project.title}
                    </h3>
                    <span className="text-xs text-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded">
                      {project.category}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)] max-w-lg">
                    {project.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--muted)]">{project.year}</span>
                  <span
                    aria-hidden="true"
                    className="text-[var(--muted)] group-hover:text-[var(--foreground)] group-hover:translate-x-1 transition-all"
                  >
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
          <div className="border-t border-[var(--border)]"></div>
        </div>
      </section>

      {/* Other Projects */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)] mb-8">
          Other Projects
        </h2>
        <div className="grid gap-6">
          {otherProjects.map((project) => (
            <div
              key={project.title}
              className="py-4 border-t border-[var(--border)] first:border-t-0"
            >
              <div className="flex items-start justify-between gap-8">
                <div>
                  <h3 className="font-medium mb-1">{project.title}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {project.description}
                  </p>
                </div>
                <span className="text-sm text-[var(--muted)]">{project.year}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
