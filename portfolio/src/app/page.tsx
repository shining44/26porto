const projects = [
  {
    title: 'Meta AI',
    category: 'Consumer AI',
    year: '2023–Present',
    description:
      'Generative AI assistant integrated across WhatsApp, Messenger, Instagram, and Meta devices. Features real-time web search, image generation, voice interaction with full-duplex dialogue, and personalized responses. Reached hundreds of millions of users through the standalone Meta AI app and Ray-Ban Meta smart glasses.',
  },
  {
    title: 'Metamate',
    category: 'Enterprise AI',
    year: '2023–Present',
    description:
      "Internal AI assistant trained on Meta's proprietary data, serving as the company's enterprise AI solution. Enables employees to query internal documentation, summarize documents and meetings, draft communications, and build custom AI agents via scripting.",
  },
  {
    title: 'Devmate',
    category: 'Developer Tools',
    year: '2024–Present',
    description:
      "Autonomous AI coding assistant with multi-agent architecture coordinating Meta's Llama, Anthropic Claude, and OpenAI models. Generates, refactors, and debugs code across entire codebases. Can diagnose failing tests, fix bugs, and submit code changes autonomously—reducing complex task completion time by half.",
  },
];

const focusAreas = [
  'Conversational AI',
  'LLM Interface Design',
  'Developer Experience',
  'Design Leadership',
  'Human-AI Interaction',
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
          ambient computing, and developer tooling — translating
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

      {/* About */}
      <section className="py-24 border-t border-[var(--border)]">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--muted)] mb-12">
          Focus
        </h2>
        <div className="flex flex-wrap gap-2">
          {focusAreas.map((area) => (
            <span
              key={area}
              className="text-sm text-[var(--muted)] border border-[var(--border)] px-3 py-1.5"
            >
              {area}
            </span>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 border-t border-[var(--border)]">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[var(--muted)] mb-12">
          Contact
        </h2>
        <div className="space-y-4">
          <a
            href="mailto:ali@example.com"
            className="block text-lg hover:text-[var(--muted)] transition-colors"
          >
            ali@example.com
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
