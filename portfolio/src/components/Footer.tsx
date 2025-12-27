export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-24">
      <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-[var(--muted)]">
        <span>&copy; {new Date().getFullYear()} Ali Tayyebi</span>
        <div className="flex items-center gap-6">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
