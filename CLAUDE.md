# CLAUDE.md

Project conventions and guidance for Claude Code.

## Project Overview

Minimalist portfolio website for Ali Tayyebi, Design Lead Manager at Meta Superintelligence Labs.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Deployment**: GitHub Pages (static export)

## Project Structure

```
portfolio/
├── src/
│   ├── app/           # Next.js pages (file-based routing)
│   │   ├── page.tsx   # Home
│   │   ├── work/      # Case studies
│   │   ├── paper/     # Research publication
│   │   ├── about/     # Bio
│   │   └── contact/   # Contact info
│   └── components/    # Reusable components
├── public/            # Static assets
└── next.config.ts     # Next.js config (static export + basePath)
```

## Commands

```bash
npm run dev    # Development server
npm run build  # Production build (outputs to /out)
npm run start  # Serve production build
npm run lint   # ESLint
```

## Conventions

### Commits
- Use imperative mood: "Add feature" not "Added feature"
- Keep messages concise but descriptive

### Components
- Functional components with TypeScript
- Props interfaces defined inline or in same file
- Use `className` with Tailwind utilities

### Styling
- Neutral palette defined via CSS custom properties in `globals.css`
- Light mode: off-white (#fafafa), black (#171717), grey (#737373)
- Dark mode: near-black (#0a0a0a), off-white (#ededed), grey (#a1a1a1)
- System dark mode supported via `prefers-color-scheme` media query

### Dark Mode Guidelines
**IMPORTANT**: To prevent dark mode styling issues:
- Always use CSS custom properties (`var(--background)`, `var(--foreground)`, `var(--muted)`, `var(--border)`) for colors
- Never hardcode color values in components
- Do NOT use `@theme inline` blocks in globals.css - use CSS variables directly with Tailwind's arbitrary value syntax (e.g., `text-[var(--muted)]`)
- Test both light and dark modes after making styling changes

### Content
- Tone: Serious, professional, no fluff
- Case studies follow: Context → Role & Process → Outcome
- Confidential work shown via CSS-generated redacted placeholders

## Deployment

The project supports two deployment targets with different configurations:

### GitHub Pages

Configured for deployment at `https://shining44.github.io/26porto/`

- Uses `basePath: "/26porto"` (set via `DEPLOY_TARGET=github-pages`)
- Static export via `output: "export"`
- Deploy workflow in `.github/workflows/deploy.yml`
- Local build folder: `/docs`

**Syncing Changes to /docs:**

```bash
cd portfolio && DEPLOY_TARGET=github-pages npm run build && rm -rf ../docs && cp -r out ../docs
```

### Hostinger

Configured for deployment to Hostinger shared hosting.

- No basePath (root domain deployment)
- FTP deployment via `.github/workflows/deploy-hostinger.yml`
- Server directory: `/public_html/`
- Local build folder: `/public_html`

**Syncing Changes to /public_html:**

```bash
cd portfolio && DEPLOY_TARGET=hostinger npm run build && rm -rf ../public_html && cp -r out ../public_html
```

### Important Notes

- The `/docs` folder contains the GitHub Pages build (with basePath)
- The `/public_html` folder contains the Hostinger build (no basePath)
- Always commit both the source changes and the updated build folders together
- The `next.config.ts` uses `DEPLOY_TARGET` environment variable to toggle basePath
