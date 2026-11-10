# AI Video Creator · Idayat Ibrahim

Portfolio and academy for Idayat Ibrahim, an AI video creator in Nigeria: a one-page portfolio (fixed intro panel + a stream of work), case-study pages, and a paid course academy with checkout, certificates and an admin.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in Supabase (and payment / email) keys. Without Supabase the homepage shows demo projects in development only.

## Where things live

- `lib/content/home.js`: homepage copy (headline, services, testimonials)
- `Components/home/`: the homepage
- `Components/site/`: shared top bar, tokens, page style layer
- `app/work/[slug]`, `app/academy`, `app/courses`: case studies and the academy
- `app/admin`: content, courses, orders and settings

Publishing: see `VERCEL-DEPLOYMENT.md`. Project notes for AI assistants: `AGENTS.md`.

## Stack

Next.js (App Router), Supabase, Motion, Tailwind.

## License

MIT, see `LICENSE`.
