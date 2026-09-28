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
| `sample-ballot.json` | Provisional ballot data — **replaced by the data pipeline later** (same shape) |
| `css/styles.css` | Neutral design system — deliberately no red/blue party color-coding |
| `js/app.js` | Lookup routing, district picker, ballot rendering from JSON |
| `manifest.json`, `sw.js` | PWA installability + offline cache |

Every ballot view carries the unofficial-information disclaimer. Candidate cards use an
identical layout for every candidate; unsourced fields render as **"unverified"** —
never blank for one candidate and filled for another.

## The sample data

`sample-ballot.json` holds the 6 real Philadelphia U.S. House candidates for Nov 3, 2026
(PA-02: Boyle, Arriaga · PA-03: Rabb, Mahoney · PA-05: Scanlon, Manganaro). Everything
except name/party/office is marked `unverified` until the verification pipeline enriches it.
State/Local groups render an honest "not in the sample file yet" note.

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

## Wiring live data (when the repo + API keys exist)

1. The data pipeline (GitHub Actions cron) writes `sample-ballot.json` in this exact
   shape — per-district files later (`/data/districts/<ocd-id>.json`).
2. `js/app.js` `fetch("sample-ballot.json")` becomes the district-aware endpoint
   (Cloudflare Worker, edge-cached).
3. The demo `DEMO_ZIP_DISTRICTS` map in `app.js` is replaced by real
   Census Geocoder / Google Civic `voterinfo` resolution.
4. `ads.txt` + the AdSense snippet go in when applying (post-domain, post-content).

## Local preview

```bash
cd frontend
python3 -m http.server 8080
# open http://localhost:8080
```
(`file://` works for most pages, but `fetch()` of the JSON needs http.)
