# What's On My Ballot — PWA Scaffold (Philadelphia pilot)

Mobile-first, **static-only** frontend. No build step, no framework — plain HTML/CSS/JS
that builds to static files. Ready to deploy to Cloudflare Pages as-is.

## What's in here

| File | Purpose |
|---|---|
| `index.html` | Home: address/ZIP lookup + tiered explainer (address / ZIP+4 / ZIP) |
| `district-picker.html` | Fallback for ZIP-only users, with persistent "district unconfirmed" banner |
| `ballot.html` | Ballot view: races grouped Federal / State / Local, expandable contests, identical candidate cards |
| `about.html`, `methodology.html`, `privacy.html`, `contact.html`, `corrections.html` | Trust pages (AdSense requires these) |
| `sample-ballot.json` | Provisional fallback dataset in the **canonical Fact-envelope shape** (schema v0.2). Used only if `data/philly-2026-general.json` is missing — renders with a visible "Provisional data" banner. |
| `data/philly-2026-general.json` | **The real dataset** (built by the data-pipeline crew). Fetched first by `js/app.js`; every factual field is a Fact envelope `{value, confidence, sources[], note}`. |
| `css/styles.css` | Neutral design system — deliberately no red/blue party color-coding |
| `js/app.js` | Lookup routing, district picker, ballot rendering from JSON (Fact envelopes → display text + verified/"Unconfirmed" badges) |
| `js/corrections.js` | Corrections reporting (pipeline crew): structured `correction-report/1` JSON → localStorage queue → prefilled mailto |
| `manifest.json`, `sw.js` | PWA installability + offline cache (cache version `womb-v2`) |

Every ballot view carries the unofficial-information disclaimer. Candidate cards use an
identical layout for every candidate; unsourced fields render as **"unverified"** —
never blank for one candidate and filled for another.

## The data contract

`js/app.js` fetches `data/philly-2026-general.json` (canonical schema v0.2, Fact envelopes).
If it's missing, it falls back to `sample-ballot.json` — same envelope shape, but rendered
under a "Provisional data" banner. Every factual field is `{value, confidence, sources[], note}`;
the renderer maps `value` → display text and `confidence: "low"` → an **Unconfirmed** badge.
`ballot_status` of `"projected"`/`"unconfirmed"` on a contest or candidate also renders a visible
badge. Ballot questions come from the `measures` array. The renderer never emits raw envelope
objects and escapes all dataset text before insertion.

## Deploy to Cloudflare Pages

**Option A — drag & drop (fastest):**
1. Cloudflare dashboard → Workers & Pages → Create → Pages → **Upload assets**
2. Name the project (e.g. `whats-on-my-ballot`), drag in this `frontend/` folder's **contents**
3. Deploy. You get `https://whats-on-my-ballot.pages.dev` instantly. No card, no billing.

**Option B — Git (recommended):**
1. Push this folder to a GitHub repo (as the repo root, or a `frontend/` subdir)
2. Pages → Create → **Connect to Git** → select the repo
3. Build settings: **no build command**, output directory `frontend/` (or `/` if it's the repo root)
4. Every push redeploys automatically (500 free builds/month)

**Custom domain (later, ~$10/yr):** Cloudflare dashboard → Domain Registration →
Register Domains → then Pages → Custom domains → attach it. Buy it a few weeks
before the AdSense application — domain age helps approval.

## Lookup behavior (honest, no wrong-district ballots)

1. The data pipeline (GitHub Actions cron) writes `frontend/data/philly-2026-general.json`
   in the canonical envelope shape — per-district files later (`/data/districts/<ocd-id>.json`).
2. `js/app.js` fetches the real dataset first, `sample-ballot.json` only as fallback.
3. Exact address / ZIP+4 resolution needs a Google Civic API key, which isn't configured —
   so the home page never produces a ballot from an address. It shows an honest notice and
   routes to the manual district picker instead. ZIP codes alone never produce a ballot either.
4. District picks are stored in `localStorage` (`womb.districts.v1`); `ballot.html` filters
   contests to the selected districts and hides the rest. `ads.txt` + the AdSense snippet
   go in when applying (post-domain, post-content).

## Local preview

```bash
cd frontend
python3 -m http.server 8080
# open http://localhost:8080
```
(`file://` works for most pages, but `fetch()` of the JSON needs http.)
