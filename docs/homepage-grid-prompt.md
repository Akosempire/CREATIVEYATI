# Homepage redesign: infinite curved grid (upgraded brief)

This is the upgraded version of the original "bird's-eye grid" brief, rewritten for
**AI Video Creator / Idayat Ibrahim** (aivideocreator.cv). It keeps the original idea and
replaces the generic agency details with this site's own fonts, colours, content, data
and stack. Where this brief disagrees with the original, this one wins.

---

Build the homepage as one immersive, single-screen experience: an infinite, draggable
WebGL grid of film "contact sheets", seen from above like a curved light table of work.
Warm, editorial and tactile. It is the existing Next.js 16 app (JS, App Router), using the
installed three.js for the canvas and **Motion (motion.dev, `motion/react`)** for every
DOM/UI animation. GSAP is not used on the homepage.

## 0. Brand system (use the site's existing tokens, don't invent new ones)

| Token | Value | Source |
| --- | --- | --- |
| Page / canvas | `#f7f5f1` warm paper | current hero background |
| Ink | `#0d0d0c` | current headline + buttons |
| Muted text | `#57544f` body, `#8f8b84` labels | current lede / credits |
| Hairlines | ink at 10–12% | |
| Accent | `site.accentColor` from the CMS (default `#a3c900` lime) with `#101400` text | current accent |
| Display | **Fredoka** 500–700, tight tracking (-0.035em) | current headings |
| UI / body | **Inter** 400–600 | current body |
| Labels / data | **Inter**, uppercase, 0.16em tracking, tabular figures | current badge/credit style |

Light theme only. The work supplies the colour; everything else stays ink-on-paper.
Film grain over everything at about 5% (reuse the current SVG noise).

## 1. The infinite curved grid

- A full-viewport canvas sits behind all UI.
- **Curvature:** a vertex shader wraps the plane around a horizontal cylinder (about 30° at the
  top and bottom edges) plus a gentle vertical cylinder (about 10° at the left and right edges),
  then projects it in perspective. Rows near the top and bottom tilt away and shrink; the
  centre lies flat and close.
- **Graph paper:** 1px ink lines at about 10% opacity on a square cell (96 world px), drawn
  across the whole plane, over the empty cells and faintly over the tiles. The lines bend with
  the curve and stay crisp (`fwidth` anti-aliasing).
- **Clusters = contact sheets.** This is a video portfolio, so each project is a 2-row × 3-tile
  mosaic of **frames from that film**. Tiles are 1 or 2 cells wide and 1 cell tall, laid out as
  `2+1+2` over `1+2+2` (mirrored on alternate clusters), with hairline gaps.
  A project usually has only one or two stills (cover, mobile cover, video thumbnail), so every
  tile shows a **different crop window** of those stills. The result reads like a storyboard,
  not six copies of one image.
- **Lattice:** clusters have a 7 × 4 cell pitch (2 empty columns and 2 empty rows between them),
  and odd rows are offset by 3 cells. The block wraps with modulo maths in the shader, so there
  are no edges. The block size comes from the viewport, and projects fill it in a shuffled
  order where neighbouring slots never repeat a project.
- **Edge fade:** tiles and lines fade into `#f7f5f1` across the top and bottom 18%, with a
  softer fade at the sides.

## 2. Motion and interaction

- **Drag to pan** with mouse, pen or touch. On release the plane glides on, with velocity
  multiplied by 0.93 each frame. The camera lerps toward its target at 0.08 per frame.
- **Wheel/trackpad** pans the plane (shift or horizontal scrolling pans sideways). Wheel input
  goes through the same velocity system, so a wheel notch and a flick come to rest the same way.
- **Pinch** (touch) zooms between 0.75× and 1.35×.
- **Velocity distortion:** speed adds up to +45% curvature, a slight stretch along the direction
  of travel, and a small RGB split. It eases back to rest.
- **Hover:** the whole cluster takes a 65% overlay of its brand colour. When the project has no
  brand colour, use the average colour of its cover, sampled when the image loads. The title
  fades in over 250ms in large Fredoka, centred on the cluster's *curved* screen position, in
  ink or paper depending on contrast. A custom cursor (Motion spring) grows into a circle that
  says "VIEW".
- **Click** (only when the pointer moved less than 6px): the camera flies to the cluster centre
  over 900ms with an ease-out-expo curve, while the curvature flattens and the camera zooms in
  1.35×. A project sheet then slides up (title, services, short description, frame gallery,
  "Watch the case study" link to `/work/[slug]`). Esc, the close button or a drag on the grid
  flies back out.
- **Live coordinates:** two tabular readouts at the far left and right of the top bar show the
  camera X and Y in cells to 6 decimal places, at 40% opacity. They are written straight to
  the DOM each frame, not through React state.
- **Intro:** the camera starts at 0.55× zoom with 2.2× curvature and settles over 1.4s. Tiles
  fade in from the centre outward.
- **Reduced motion:** no intro, inertia or distortion, and instant fly-to and panel transitions
  (Motion's `useReducedMotion`).
- **Hit-testing** inverts the curved projection (Newton iteration on the same maths as the
  shader), so hover and click match what the person sees.

## 3. Ticker (bottom centre)

A compact ink pill (`#0d0d0c` at 90%, 1px paper hairline, 999px radius) with an endless
uppercase marquee in Inter (12px, 0.16em tracking). Use real content only: the latest projects
as `CLIENT: TITLE` plus a `NOW BOOKING` line. Never invent client wins. Duplicate the content
for a seamless CSS loop and mask the edges.

## 4. Navigation (floating, no boxed header)

- No border and no fill, just a paper → transparent gradient from the top.
- **Left:** the wordmark, "AI Video" in Fredoka 700 and "Creator" in Fredoka 400, about 26px.
- **Centre:** a glass pill (blurred paper at 70%, hairline border) with **Work · About · Contact**.
  The active item gets an ink pill that slides between links (Motion `layoutId`).
- **Right:** a "Start a project" button in the accent colour with a text-roll on hover (the
  label slides up and a duplicate replaces it, using Motion variants).
- **Mobile (<820px):** the wordmark plus a round menu button that opens a full-screen paper
  overlay with large staggered Fredoka links: Work, About, Contact, Academy, Courses, Sign in.
- The coordinates sit at the far left and right edges, under the bar.

## 5. About and contact sheet

"About", "Contact" and "Start a project" open a sheet from the right (45vw on desktop,
full screen on mobile) over a blurred, dimmed grid that keeps drifting. Its contents, from
top to bottom:

1. The heading **"I AM IDAYAT IBRAHIM"** (from `site.creatorName`), with the portrait and the
   title line (`site.professionalTitle`) shown small.
2. Two short paragraphs from the CMS (`aboutCopy`, `aboutCurrentWork`).
3. Three service columns built from the real services:
   - **FILM:** AI commercials, Brand films, Product videos, Creative direction, Storyboards, AI production
   - **SOCIAL:** Short-form video, UGC-style concepts, Launch content, Campaign assets, Social formats
   - **POST:** Video editing, Sound design, Colour & finishing, Final delivery
   Below them, a line about teaching through the Academy, with links to `/academy` and `/courses`.
4. **"BIG IDEA? YOU KNOW WHERE TO FIND ME."** with the email, phone, booking link and
   social links from the CMS.
5. A contact form that posts to the existing `/api/enquiries` endpoint. Fields: Name\*,
   Email\*, Company\*, Phone\*, Budget\* (pill radios), a project description, and the existing
   consent checkbox and honeypot. The submit label is "Let's connect!", and success and error
   states appear inline.
6. A stacked closing statement, one phrase per line, alternating Fredoka and Inter:
   **FOR / AMBITIOUS / BRANDS READY / TO BE WATCHED**.
7. A **Projects index** in A–Z order. Clicking a name closes the sheet and flies to that project.

## 6. Data

Map Supabase `videos` to `{ id, slug, name, client, brandColor, services[], blurb, images[6], caseStudyUrl, year }`.
`images` cycles through the distinct stills a project has, and the engine assigns crop windows.
When Supabase is unavailable (local preview), fall back to the bundled demo projects so the
grid still renders.

## 7. Technical

- Use one `InstancedMesh` for every tile (a 10×6-segment quad so the edges bend), one mesh for the
  grid plane, and one draw call each.
- Textures come from a **canvas atlas** (2048² or 4096², 16:9 slots). Images load lazily through
  `/_next/image?w=640&q=75`, which keeps them same-origin (so CORS is never a problem) and
  small. Until an image arrives, its slot shows the brand colour.
- Cap DPR at 2, rebuild the lattice on resize, and pause the render loop while the tab is
  hidden.
- The engine is framework-free (no React imports). It talks to React through callbacks
  (`onHover`, `onSelect`, `onFrame`, `onIntroDone`) and a returned handle (`flyTo`, `release`,
  `setDimmed`, `resize`, `destroy`), the same contract the old carousel engine used.
- **SEO and accessibility:** a visually hidden `<nav>` lists every project as a real
  `<a href="/work/slug">`. Focusing an item flies the camera to that project, and Enter opens
  its sheet. The canvas is `aria-hidden`, and the page keeps a real `<h1>`.
- Target 60fps on a mid-range laptop. Verify with `npm run build` and `npx eslint Components lib`.
