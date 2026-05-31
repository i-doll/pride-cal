# Oslo Pride 2026 — calendar & bulk export

A small, fast static web-app to browse the **Oslo Pride 2026** programme (when & where) and
**export events to your own calendar** in bulk.

**Live:** https://i-doll.github.io/pride-cal/

## Features

- **Browse** all ~360 festival events: a date strip for navigation + a day-grouped agenda
  with search and filters (category, stage, arena, accessibility, official-only, and an
  **In English** quick-filter).
- **Bulk export**: tick any number of events and **Download .ics** — imports into Apple
  Calendar, Google Calendar, Outlook, etc.
- **Add to Google Calendar** per event.
- **Subscribe** to auto-updating calendar feeds (`webcal` / `https`) for the whole festival
  or per category.
- **Bilingual** UI (Norwegian default, English toggle). Times always shown in Europe/Oslo.

## How it works

The official site (oslopride.no) is backed by a public **Sanity** CMS. Sanity's API enforces
a CORS allowlist, so the browser can't query it directly — instead a build script fetches the
data **server-side** (no Origin header), normalizes it, and writes static artifacts:

- `public/events.json` — the denormalized dataset the app loads.
- `public/feeds/*.ics` — the whole-festival and per-category subscribe feeds.

A GitHub Action regenerates these **daily** (and on every push / manual dispatch) and deploys
to GitHub Pages. There is no runtime backend. If a fetch fails, the build fails and the last
good deploy stays live; the committed `public/events.json` is the offline/dev fallback.

## Develop

```bash
npm ci
npm run fetch:events   # fetch live data into public/ (needs network)
npm run dev            # http://localhost:5173
```

Other scripts:

```bash
npm run test           # ICS unit tests (RFC 5545 escaping / folding / Google links)
npm run typecheck      # app + node-script type checks
npm run build          # prebuild fetch -> typecheck -> vite build  (-> dist/)
npm run preview        # serve the production build
```

To test the deployed sub-path (`/pride-cal/`) locally:

```bash
BASE_PATH=/pride-cal/ npm run build && BASE_PATH=/pride-cal/ npm run preview
# then open http://localhost:4173/pride-cal/
```

The Pages base path is configured in one place — `BASE_PATH` in
`.github/workflows/deploy.yml`. If you rename the repo, update it there.

## Deploy

Deployment is automatic via GitHub Actions (`.github/workflows/deploy.yml`): push to `main`,
the daily cron, or a manual **Run workflow** all rebuild and publish to Pages. One-time repo
setup: **Settings → Pages → Source = GitHub Actions**.

## Data & attribution

Event data is © Oslo Pride and is fetched from their public Sanity CMS. This is an
**unofficial** tool and is not affiliated with or endorsed by Oslo Pride.
