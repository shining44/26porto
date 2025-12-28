export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-24">
      <div className="max-w-[540px] mx-auto w-full">
        {/* Identity */}
        <header className="mb-16">
          <h1 className="text-4xl font-medium tracking-tight mb-3">
            Ali Tayyebi
          </h1>
          <p className="text-muted">
            Design Lead Manager, Meta Superintelligence Labs
          </p>
        </header>

        {/* About */}
        <section className="mb-16">
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              I lead a team building AI-powered interfaces for billions of
              users. Our work spans conversational AI, intelligent suggestions,
              and developer tooling — translating complex language models into
              intuitive experiences.
            </p>
            <p>
              My focus is on the intersection of design leadership and product
              strategy: defining interaction patterns for LLM-driven products,
              establishing trust through transparency, and building systems that
              scale across consumer and enterprise contexts.
            </p>
          </div>
        </section>

        {/* Work */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-8">
            Work
          </h2>
          <div className="space-y-8">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-medium">Meta AI</h3>
                <span className="text-xs text-muted">2023–Present</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Consumer AI assistant reaching hundreds of millions across
                Instagram, WhatsApp, and Messenger. Led design for
                conversational experiences, transparent attribution, and
                graceful degradation patterns.
              </p>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-medium">Metamate</h3>
                <span className="text-xs text-muted">2022–Present</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Enterprise LLM for internal productivity and knowledge
                management. Designed integration patterns for existing
                workflows, context-aware responses, and verifiable answers with
                source citations.
              </p>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-medium">Devmate</h3>
                <span className="text-xs text-muted">2023–Present</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                AI-powered code generation and engineering workflows. Focused on
                minimal interruption patterns, preserving developer flow state,
                and confidence calibration for suggestions.
              </p>
            </div>
          </div>
        </section>

        {/* Research */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-8">
            Research
          </h2>
          <a
            href="https://arxiv.org/abs/2402.04141"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="font-medium group-hover:underline">
                Multi-line AI-assisted Code Authoring
              </h3>
              <span className="text-xs text-muted">2024</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Co-authored research on CodeCompose, deployed to tens of thousands
              of developers at Meta. Contributed product design for multi-line
              suggestions — interaction patterns for reviewing, accepting, and
              modifying AI-generated code blocks.
            </p>
          </a>
        </section>

        {/* Contact */}
        <footer className="pt-10 border-t border-border">
          <p className="text-sm text-muted mb-4">San Francisco Bay Area</p>
          <div className="flex gap-6 text-sm">
            <a
              href="mailto:ali@example.com"
              className="text-muted hover:text-foreground transition-colors"
            >
              Email
            </a>
            <a
              href="https://linkedin.com/in/alitayyebi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
