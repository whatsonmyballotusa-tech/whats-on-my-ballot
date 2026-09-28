#!/usr/bin/env python3
"""Philadelphia / Pennsylvania public-source helpers — conservative scraping.

Covers: vote.phila.gov (City Commissioners: sample ballots, UMOVA notices,
ballot-question PDFs, candidates-for-office page) and PA Department of State
public pages (electionreturns.pa.gov, pavoterservices.pa.gov).

SCRAPING POLICY (checked 2026-09-28):
- vote.phila.gov/robots.txt: could not be retrieved (fetch failed).
- pavoterservices.pa.gov/robots.txt: 404 (no file).
Because robots directives are UNKNOWN, this module is deliberately timid:
  * only clearly-public informational pages, never login-walled or API-ish endpoints
  * 2+ seconds between requests, disk cache so a page is fetched ONCE
  * small allowlist of known public URLs — no crawling, no spidering
  * at the first sign of blocking (403/429), STOP and escalate to the lead agent

Prefer official bulk downloads/CSVs wherever they exist (e.g. OpenDataPhilly
election datasets, PA DoS downloadable returns) over page scraping.
"""
import hashlib
import json
import os
import time
import urllib.request

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "page_cache")
USER_AGENT = "WhatsOnMyBallot/0.1 (nonpartisan voter education; contact: whatsonmyballotusa@gmail.com)"
MIN_DELAY = 2.0  # seconds between requests — be a good citizen

# Curated public pages (Phase 0 allowlist). Extend only with lead-agent approval.
PUBLIC_PAGES = {
    "phila_candidates_for_office": "https://vote.phila.gov/voting/candidatesforoffice/",
    "phila_2026_primary_ballot_questions": "https://vote.phila.gov/media/2026P_Ballot_Questions.pdf",
    "phila_2025_general_umova": "https://vote.phila.gov/media/UMOVA_NOTICE_2025_GENERAL_ELECTION.pdf",
    "pa_election_returns": "https://www.electionreturns.pa.gov/",
}


def _cache_path(url):
    os.makedirs(CACHE_DIR, exist_ok=True)
    h = hashlib.sha256(url.encode()).hexdigest()[:16]
    return os.path.join(CACHE_DIR, h + ".bin")


def fetch_public_page(url, force_refresh=False):
    """Fetch a public page with disk cache + polite delay. Returns bytes."""
    if url not in PUBLIC_PAGES.values():
        raise ValueError(
            f"URL not on the Phase 0 allowlist — refusing to scrape: {url}"
        )
    path = _cache_path(url)
    if os.path.exists(path) and not force_refresh:
        with open(path, "rb") as f:
            return f.read()
    time.sleep(MIN_DELAY)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
    except Exception as e:
        raise RuntimeError(
            f"Fetch failed for {url} ({e}). Do NOT retry aggressively — "
            "escalate to the lead agent."
        ) from e
    with open(path, "wb") as f:
        f.write(body)
    return body


def manifest():
    """What we have cached and when."""
    items = []
    for name, url in PUBLIC_PAGES.items():
        p = _cache_path(url)
        items.append(
            {
                "name": name,
                "url": url,
                "cached": os.path.exists(p),
                "bytes": os.path.getsize(p) if os.path.exists(p) else 0,
            }
        )
    return items


if __name__ == "__main__":
    print(json.dumps(manifest(), indent=2))
