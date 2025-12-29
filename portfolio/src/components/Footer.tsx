export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-3xl mx-auto px-6 py-8 text-sm text-[var(--muted)]">
        <span>&copy; {new Date().getFullYear()} Ali Tayyebi</span>
      </div>
    </footer>
  );
}
