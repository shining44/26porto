# Ali Tayyebi — Portfolio

A minimalist portfolio website for Ali Tayyebi, Design Lead Manager at Meta Superintelligence Labs.

## Overview

This portfolio showcases AI-driven product design work including:
- **Meta AI** — Consumer-facing AI assistant
- **Metamate** — Enterprise LLM solution
- **Devmate** — AI-powered developer tools
- Research publications on human-AI interaction

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Fonts**: Geist Sans & Mono

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
# Create production build
npm run build

# Run production server
npm start
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page
│   ├── layout.tsx        # Root layout with navigation
│   ├── globals.css       # Global styles
│   ├── work/
│   │   ├── page.tsx      # Work listing
│   │   ├── meta-ai/      # Meta AI case study
│   │   ├── metamate/     # Metamate case study
│   │   └── devmate/      # Devmate case study
│   ├── paper/            # Research publication
│   ├── about/            # About page
│   └── contact/          # Contact page
└── components/
    ├── Navigation.tsx    # Header navigation
    ├── Footer.tsx        # Footer component
    └── RedactedImage.tsx # Pixelated placeholder images
```

## Customization

### Replacing Redacted Images

The portfolio uses CSS-generated placeholder images to represent confidential work. To replace with actual images:

1. Add your images to `public/images/`
2. Update the `RedactedImage` component or replace with standard `<Image>` components
3. Apply pixelation effects using the `.pixelated` CSS class if desired

### Content Updates

- Update personal information in `src/app/about/page.tsx`
- Modify case study content in `src/app/work/[project]/page.tsx`
- Edit contact details in `src/app/contact/page.tsx`

### Styling

- Color palette defined in `src/app/globals.css` using CSS custom properties
- Typography uses Geist font family via Next.js font optimization

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
npx vercel
```

### GitHub Pages / Static Export

```bash
# Add to next.config.ts:
# output: 'export'

npm run build
# Deploy the 'out' directory
```

## Performance

- Optimized fonts with `next/font`
- Minimal CSS with Tailwind
- No external images by default
- Static generation for all pages

## License

Private portfolio project.
