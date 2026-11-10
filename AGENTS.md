<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes for AI assistants

Portfolio + academy for Idayat Ibrahim (AI video creator). Next.js App Router, JS only, Supabase data, Motion (`motion/react`) for UI animation.

## Public site (Nov 2026 redesign)

Three pages share one layout: a fixed intro panel on the left and an image-led stream of work on the right. `/` is the work; `/services` and `/about` open the stream with their own section, then carry every project. Contact closes every stream; `/contact` and `/work` redirect to the homepage (`next.config.mjs`).

| File | Owns |
| --- | --- |
| `lib/content/home.js` | Homepage words: title, headline, subhead, services list, testimonials, how many projects get big case-study frames. Edit copy here. |
| `lib/data/portfolio-page.js` | Shared loader for `/`, `/services`, `/about`: published work + site settings, projects mapped to `{ id, slug, name, client, poster, ratio, orientation, href, preview }`. |
| `app/page.js`, `app/services/page.js`, `app/about/page.js` | Render `HomePortfolio` with `page` set to `work`, `services` or `about`. |
| `Components/home/HomePortfolio.jsx` + `home.css` | Panel (intro, hatched divider, testimonial carousel) and stream (case cards, services, shot tiles, about, contact + "Send a brief" sheet), progressive edge blur. |
| `Components/home/BookButton.jsx` | "Book a call" button: 3-arrow track + canvas particles on hover. |
| `Components/site/TopBar.jsx` + `kit.css` | Shared top bar (avatar, letter-roll name, menu sheet portalled to body) and design tokens. |
| `Components/PublicHeader.jsx` / `PublicFooter.jsx` | Every other public page: TopBar + `site/site-language.css` (scoped to `body:has(.sl-nav)`, so admin and the student area are untouched) + scroll reveal. |
| `lib/video-aspect.js` | Works out a video's real shape (upload metadata, Drive thumbnail, YouTube letterbox, `/shorts/`), admin orientation is the fallback. |

Brand: white, ink `#080808`, hairlines `#e8e8e8`, brand green `#174c38` as the one accent (buttons, avatar, progress, credits). Never pair green with black text. Fonts: Geist (everything), Inter 600 (buttons), Kantumruy Pro (badge/labels).

## Conventions

- Comment style: short, lowercase, practical. Section markers are `// ---- name ----`. No JSDoc blocks, no banner rulers.
- JS only (no TypeScript). Path alias `@/*` → repo root.

## Verify changes

```bash
npm run build
npx eslint Components lib app
npm run dev
```
