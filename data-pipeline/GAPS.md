# Known Gaps — Phase 0 Data Pipeline (2026-09-28)

## Blocked on API keys (arrive when Ray finishes the account checklist)
1. **Google Civic voterinfo** — module `scripts/civic_voterinfo.py` is written and standby.
   Needs `CIVIC_API_KEY`. Unlocks: address→ballot, polling places, drop-off sites.
2. **Congress.gov API** — needs the single `api.data.gov` key. Unlocks: member photos
   (public domain), bills sponsored, committee assignments, and the `key_votes` arrays.
3. **OpenStates/Plural** — needs its own key. Unlocks: PA state-legislature candidate records
   (the 25 state House + 3 state Senate races are NOT in this dataset yet).
4. **FEC rate limits** — DEMO_KEY works (1,000 calls/hr) but a free `api.data.gov` key raises
   limits and is required before any bulk backfill.

## Missing data (needs research or the official sources)
5. **Official Philadelphia 2026 general sample ballot / UMOVA notice** — not yet located.
   Until found, all `ballot_status` fields stay `"projected"`, never `"certified"`.
6. **Candidate photos** — none captured. UI must use the neutral placeholder for all six
   until public-domain/CC portraits are sourced (incumbents: house.gov).
7. **Platform quotes** — empty for all six. Must be quoted from candidate materials only;
   never paraphrased, never AI-drafted.
8. **Manganaro bio is single-source (low)** — renders "unverified" until a campaign site or
   news profile confirms it.
9. **Challenger contact info** — no verified public website/phone/email found for Arriaga,
   Rabb, Mahoney, or Manganaro in Phase 0.
10. **vote.phila.gov / PA DoS robots.txt** — both unreachable (fetch failed / 404), so
    `scripts/philly.py` scrapes ONLY an allowlisted handful of public pages at 2s+ intervals
    with disk cache. Prefer official bulk downloads (OpenDataPhilly, PA DoS CSVs) instead.

## Not started (Phase 1+)
- BallotMeasure entity (2 proposed Philly charter amendments unconfirmed — see ballot briefing).
- State-legislative + judicial + local contest records.
- `endorsements` field — deferred to schema v2 (abuse/misuse risk).
