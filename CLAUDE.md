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
- Neutral palette: off-white (#fafafa), black (#171717), grey (#737373)
- CSS custom properties defined in `globals.css`
- No dark mode (single light theme)

### Content
- Tone: Serious, professional, no fluff
- Case studies follow: Context → Role & Process → Outcome
- Confidential work shown via CSS-generated redacted placeholders

## GitHub Pages

Configured for deployment at `https://shining44.github.io/26porto/`

- `basePath: "/26porto"` in next.config.ts
- Static export via `output: "export"`
- Deploy workflow in `.github/workflows/deploy.yml`
