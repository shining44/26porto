export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-24">
      <div className="max-w-[540px] mx-auto w-full">
        {/* Identity */}
        <header className="mb-20">
          <h1 className="text-4xl font-medium tracking-tight mb-3">
            Ali Tayyebi
          </h1>
          <p className="text-muted">
            Design Lead Manager, Meta Superintelligence Labs
          </p>
        </header>

        {/* About */}
        <section className="mb-20">
          <p className="text-muted leading-relaxed">
            I lead a team building AI-powered interfaces for billions of users.
            Our work spans conversational AI, intelligent suggestions, and
            developer tooling — translating complex language models into
            intuitive experiences.
          </p>
        </section>

        {/* Work */}
        <section className="mb-20">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-8">
            Work
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium">Meta AI</h3>
              <p className="text-sm text-muted">
                Consumer AI assistant across Meta platforms
              </p>
            </div>
            <div>
              <h3 className="font-medium">Metamate</h3>
              <p className="text-sm text-muted">
                Enterprise LLM for internal productivity
              </p>
            </div>
            <div>
              <h3 className="font-medium">Devmate</h3>
              <p className="text-sm text-muted">
                AI-powered code generation tools
              </p>
            </div>
          </div>
        </section>

        {/* Research */}
        <section className="mb-20">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-8">
            Research
          </h2>
          <div>
            <a
              href="https://arxiv.org/abs/2402.04141"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <h3 className="font-medium group-hover:underline">
                Multi-line AI-assisted Code Authoring
              </h3>
              <p className="text-sm text-muted">arXiv 2024 · Co-author</p>
            </a>
          </div>
        </section>

        {/* Contact */}
        <footer className="pt-12 border-t border-border">
          <div className="flex gap-8 text-sm">
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
