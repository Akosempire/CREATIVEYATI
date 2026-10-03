# Work log

A record of what was built, in order, with the commit each piece landed in and how
it was verified. Written so a future session can see what exists rather than
rediscover it, and so nothing shipped is mistaken for something planned.

Deployed from `main` on Vercel; production is `aivideocreator.cv`. Every entry
below was verified against the live site or the live database, not just built
locally. Where a verification was weak, it says so.

---

## Certificates and public verification

| Commit | What |
| --- | --- |
| `8ea88ba` | `public.certificates`, issued automatically when every published lesson is complete |
| `04861f2` | Backfill for courses finished before the migration |
| `eae77ef` | Certificates as printable documents, QR of their own verify URL, revoke dialog |
| `9e8e707` | PDF download via `pdf-lib`, A4 landscape, ownership resolved from the student's own list |

Migration `202609060001_certificates.sql` — **applied to production**.
Verified: `/verify` returns 200 (was 404), `/verify/<serial>` renders,
`/api/learn/certificate/<id>` returns 401 unauthenticated (correct),
`next_certificate_serial()` returns valid serials from the live database.

## Client invoicing

| Commit | What |
| --- | --- |
| `72d0e94` | Quotations, invoices, receipts; tokenised client page; Bachs checkout; recorded transfers |
| `83ab4b1` | Repeatable line-item editor, totals recomputed server-side |
| `17428da` | Printable invoice document |
| `ec04054` | Invoice PDF download |

Migration `202609060002_client_invoicing.sql` — **applied to production**.
Settlement requires status, amount, currency and reference all to match before an
invoice is treated as paid. The webhook tries invoices first and otherwise falls
through to the existing order path, so course checkout behaviour is unchanged.
Verified: `/api/invoices/<bad token>` answers with its own JSON 404.

## Audit log

| Commit | What |
| --- | --- |
| `21652a2` | `docs/DASHBOARD-DESIGN.md` and the roadmap |
| `4528732` | `202609070001_activity_actor.sql` — actor, role, entity columns |
| `c197530` | `lib/data/activity.js`, reading `select("*")` so it works with or without the migration |
| `12766e0` | `/admin/activity` — filter tabs, "4 of 24 entries", drawer detail |
| `4e5a5bf` | Logs certificate revocation and recorded payments |
| `bdbc9ee` | Logs portfolio saves and contact/SEO settings changes |

**The migration is not yet run.** Until it is, entries record without an actor and
the page reads *unknown (recorded before the actor column existed)* — honestly,
rather than attributing them to someone. Verified: `/admin/activity` returns 307.

## Enquiries inbox

| Commit | What |
| --- | --- |
| `de18639` | Rebuilt as a two-pane inbox: filter tabs with counts, message list with unread dot, detail pane with Reply, retry-on-failure and the status/notes form |

The open message lives in the query string, so it survives a refresh, is
linkable, and the screen stays a server component.

## Design language

| Commit | What |
| --- | --- |
| `34bc2aa` | 66 design tokens — layout, motion, spacing, radii, hairlines, elevation, stacking |
| `0ae68b4` | The admin sidebar rebuilt as a grid shell, 247/60px, animating `grid-template-columns` at 180ms, persisted in localStorage |
| `8229e1d` | Admin page patterns — title density, hairline table rows, focus rings, tinted status surfaces |
| `626c678` | The Frame / Motion language: lime `#C6F000`, near-black `#11120E` sidebar, warm `#F5F5F0` page, 14px cards, Bricolage Grotesque + DM Sans, 44px targets |

Scoped to `.admin-shell` and `.learn-area` on purpose, so the marketing site keeps
its own palette.

## Shared components

| Commit | What |
| --- | --- |
| `ce0185d` | `Tabs` (query-string filters with counts), `Badge` + `toneForStatus`, `Skeleton`/`SkeletonTable`, `EmptyState` |
| `3256c97` | Adopted on certificates |
| `7a23197` | Adopted on invoices, plus a pending create action |
| `5dcd5d3` | Adopted on activity, with a context-aware empty title |

## Interface primitives

| Commit | What |
| --- | --- |
| `a8033c5` | `SubmitButton` (reads the form's pending state), `Drawer`, mobile behaviour for the admin shell |
| `4501adb` | The revoke confirmation given a real pending state |
| `76f2f39` | The mobile sheet made dismissible — real scrim element, close button, Escape, `:has()` scroll lock — and a dialog backdrop that actually dims |

## Public site

| Commit | What |
| --- | --- |
| `84ea20b`, `b177369` | Academy home page as a second front door |
| `02a8142` | Navigation rebuilt: horizontal text bar, described Academy panel, context-aware CTAs, Studio/Academy badge |
| `f755a7e` | Hamburger and a full mobile menu sheet, replacing the chevron dropdown |
| `16cb9f5` | Hamburger hidden on desktop (an append-order cascade bug of mine) |
| `019b49b` | Fixed the mobile menu rendering with no links |
| `2674026` | Hero made the home page; the carousel engine is untouched but no longer mounted there |
| `067bd7f` | Staggered entrance, hover lift, reduced-motion guard; cards take the image's own height so nothing is cropped |
| `86fdd06` | Cards drift left continuously, seamless loop, hover pause |
| `e25395b` | Every published project drifts, at a constant speed as the catalogue grows |

## Offline delivery

| Commit | What |
| --- | --- |
| `4b6a0da` | Per-student watermark, service worker caching uploaded media into origin-private storage, cache purge on sign-out |

Brought across file by file rather than merged, because the branch predated the
navigation and token work. Verified: `/sw.js` returns **200**, and its contents
include the media-cache path and the purge handler.

## Deployment tooling

| Branch | State |
| --- | --- |
| `feat/verification-tooling` | **Pushed, not merged.** `scripts/verify.mjs` — a dependency-free browser harness that checks overflow, console errors and breakpoints, and names the offending element. It found a real bug on `/contact`: `input.honeypot` overflows by 38px at 768px and 734px at 1440px |

Deploys run through a Vercel deploy hook plus direct pushes to `main`; the hook
job id is recorded in each session's output.

---

## Still outstanding

1. **Run `202609070001_activity_actor.sql`** — otherwise the audit log cannot say who.
2. **Lessons must be self-hosted uploads, not embeds.** Offline caching is impossible for a YouTube or Vimeo embed. The course currently has **zero lessons**, so the watermark, the service worker and the certificate flow are all live but inert.
3. **Eleven admin pages** still need the shared-component adoption: badges for status, tabs for filters, skeletons and empty states for lists, drawers for row detail.
4. **Two structural screens** from the brief: Courses (tabbed editor with a Students tab) and Bachs payments (connection status, secrets checklist, webhook panel).
5. **The whole student side** is unbuilt: two-panel auth screens, the student shell with bottom tabs on mobile, dashboard, lesson player, certificates grid, orders, checkout, profile.

## Known limitations, stated plainly

- **Invoice and certificate PDFs use standard PDF fonts**, so the naira sign cannot be encoded and text is stripped to printable ASCII. An embedded Unicode font is the fix.
- **Offline video seeking may break**: the Cache API stores one full response where the browser expects `206` partials. A range-aware cache or HLS segments is the fix.
- **iOS evicts browser storage after about seven days** without use. Apple policy; no workaround short of a native app.
- **Certificate and invoice pages fail safe but silently**: data functions return empty on error, so "broken" and "empty" look identical to an admin.

## Process lessons from this work

1. **Gate on the build exit code, not just lint.** A corrupted `globals.css` — an invalid UTF-8 byte from a text round-trip — passed an lint-only gate and triggered a pointless deploy.
2. **Append to files; never rewrite them through a PowerShell text round-trip.** Reading a 130KB file as Latin-1 and writing it back is what corrupted it.
3. **Assert the anchor before writing.** Every mechanical edit rejected unless its target matched exactly once. This guard caught mistakes six times and prevented writing to a file at all.
4. **Verify against the served artefact, not your own narration.** Six of my checks could not have failed and therefore proved nothing: a read-only `$home` variable, a regex that matched no stylesheet URL, case-insensitive `Select-String`, `**` globs that do not recurse, a regex missing an attribute, and string-matching minified CSS values.
5. **A build passing on Windows says nothing about Linux.** An import written as `@/components/…` resolves here and would have failed on Vercel.
6. **Prefer `.admin-shell`-scoped changes.** Global token overrides would restyle the public site as a side effect.
