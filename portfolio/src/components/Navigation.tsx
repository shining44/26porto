'use client';

const navLinks = [
  { href: '#work', label: 'Work' },
  { href: '#research', label: 'Research' },
  { href: '#contact', label: 'Contact' },
];

export default function Navigation() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
      <nav className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
        <a
          href="#"
          onClick={(e) => scrollToSection(e, '#')}
          className="font-medium text-sm tracking-tight hover:text-[var(--muted)] transition-colors"
        >
          Ali Tayyebi
        </a>
        <ul className="flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
