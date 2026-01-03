const projects = [
  {
    title: 'Meta AI',
    category: 'Consumer AI',
    year: '2023–Present',
    description:
      "Led design for Meta's flagship AI assistant across messaging, social, and hardware surfaces. Defined conversational patterns and multimodal input flows for a team shipping to WhatsApp, Messenger, Instagram, and Ray-Ban Meta glasses. Scaled the experience from zero to hundreds of millions of monthly users.",
  },
  {
    title: 'Metamate',
    category: 'Enterprise AI',
    year: '2023–Present',
    description:
      "Designed Meta's internal AI assistant used company-wide for knowledge retrieval, document synthesis, and workflow automation. Established design patterns for enterprise AI interactions—balancing power-user depth with broad accessibility across engineering, legal, and operations teams.",
  },
  {
    title: 'Devmate',
    category: 'Developer Tools',
    year: '2024–Present',
    description:
      'Led design for an autonomous coding agent that diagnoses, fixes, and ships code changes without human intervention. Defined the interaction model for developer trust and control in agentic workflows. Reduced complex task completion time by 50% in internal deployment.',
  },
];

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6">
      {/* Hero */}
      <section className="pt-32 pb-24">
        <p className="text-sm text-[var(--muted)] mb-4 tracking-wide">
          Design Lead Manager, Meta Superintelligence Labs
        </p>
        <h1 className="text-[2.5rem] font-medium tracking-tight leading-[1.1] mb-8">
          Building AI-powered interfaces
          <br />
          <span className="text-[var(--muted)]">for billions of users.</span>
        </h1>
        <p className="text-[var(--muted)] max-w-xl leading-relaxed">
          I lead a team of product designers creating conversational AI,
          ambient computing, and productivity & developer tooling — translating
          complex language models into intuitive experiences.
        </p>
      </section>

      {/* Work */}
      <section id="work" className="py-24 border-t border-[var(--border)]">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--muted)] mb-12">
          Selected Work
        </h2>
        <div className="space-y-0">
          {projects.map((project, index) => (
            <article
              key={project.title}
              className={`py-8 ${index !== 0 ? 'border-t border-[var(--border)]' : ''}`}
            >
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-xl font-medium tracking-tight">
                  {project.title}
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  {project.year}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] mb-2">
                {project.category}
              </p>
              <p className="text-[var(--muted)] leading-relaxed">
                {project.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Research */}
      <section id="research" className="py-24 border-t border-[var(--border)]">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--muted)] mb-12">
          Research
        </h2>
        <article>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-xs text-[var(--muted)] border border-[var(--border)] px-2 py-0.5">
              arXiv 2024
            </span>
            <span className="text-xs text-[var(--muted)]">Co-author</span>
          </div>
          <h3 className="text-xl font-medium tracking-tight mb-4">
            Multi-line AI-assisted Code Authoring
          </h3>
          <p className="text-[var(--muted)] leading-relaxed mb-6 max-w-xl">
            CodeCompose is an AI-assisted code authoring tool deployed to
            tens of thousands of developers at Meta. This paper presents
            scaling from single-line to multi-line suggestions.
          </p>
          <a
            href="https://arxiv.org/abs/2402.04141"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-[var(--muted)] transition-colors"
          >
            Read paper
            <span aria-hidden="true" className="text-xs">↗</span>
          </a>
        </article>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 border-t border-[var(--border)]">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--muted)] mb-12">
          Contact
        </h2>
        <div className="space-y-4">
          <a
            href="mailto:satjazayeri@gmail.com"
            className="block text-lg hover:text-[var(--muted)] transition-colors"
          >
            satjazayeri@gmail.com
          </a>
          <a
            href="https://linkedin.com/in/alitayyebi"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-lg hover:text-[var(--muted)] transition-colors"
          >
            LinkedIn
          </a>
        </div>
        <p className="text-sm text-[var(--muted)] mt-8">
          San Francisco Bay Area
        </p>
      </section>
    </div>
  );
}
