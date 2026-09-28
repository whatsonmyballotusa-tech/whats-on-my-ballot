# What's On My Ballot — Canonical Data Schema (v0.1)

**Status:** Phase 0 draft · **Date:** 2026-09-28 · **Pilot:** Philadelphia, PA-2026 General

## Design principles

1. **Every factual field is a Fact envelope.** No bare strings for facts. Each fact carries
   `value`, `confidence` (`high` | `medium` | `low`), `sources` (≥1 URL), and optional `note`.
2. **Stable IDs.** Federal candidates anchor on FEC candidate IDs. Districts use OCD division IDs.
   Everything else uses deterministic slugs.
3. **Citation-or-nothing.** A field with `confidence: "low"` renders in the app as
   *"unverified"* — never as a stated fact. The Enrichment Agent may not invent values to fill gaps.
4. **Nonpartisan by construction.** Every candidate record has identical fields in identical order.
   Empty sections render as "No verified information available", never omitted for one candidate
   and present for another.
5. **Versioned.** Every dataset file carries `schema_version` and `generated_at`.

## The Fact envelope

```json
{
  "value": "Brendan F. Boyle",
  "confidence": "high",
  "sources": ["https://boyle.house.gov/about/biography"],
  "note": "optional clarifier, e.g. why confidence is low"
}
```

### Confidence rubric

| Level | Meaning | Renders as |
|---|---|---|
| `high` | Official `.gov` source, **or** 2+ independent reputable sources agree | normal fact |
| `medium` | Single reputable source (established news org, official campaign/party material, FEC filing) | normal fact |
| `low` | Single unverified source, Wikipedia-only, or AI-drafted/summarized | **"unverified"** tag; queued for human review |

### ID conventions

| Entity | ID format | Example |
|---|---|---|
| Federal candidate | FEC candidate ID | `H4PA13199` |
| Non-federal candidate | `{state}-{office-slug}-{name-slug}-{year}` | `pa-governor-josh-shapiro-2026` |
| District | OCD division ID | `ocd-division/country:us/state:pa/cd:2` |
| Contest | `{election_id}-{office-slug}-{district-key}` | `pa-2026-general-ushouse-cd2` |
| Election event | `{state}-{year}-{type}` | `pa-2026-general` |

## Entities

### ElectionEvent

```json
{
  "id": "pa-2026-general",
  "name": {"value": "2026 Pennsylvania General Election", "confidence": "high", "sources": ["https://www.pa.gov/..."]},
  "date": {"value": "2026-11-03", "confidence": "high", "sources": ["..."]},
  "state": "PA",
  "election_type": "general",
  "registration_deadline": {"value": "2026-10-19", "confidence": "high", "sources": ["..."]},
  "mail_ballot_request_deadline": {"value": "2026-10-27T17:00:00", "confidence": "high", "sources": ["..."]},
  "mail_ballot_return_deadline": {"value": "2026-11-03T20:00:00", "confidence": "high", "sources": ["..."]},
  "poll_hours": {"value": "07:00-20:00", "confidence": "high", "sources": ["..."]}
}
```

### District

```json
{
  "ocd_id": "ocd-division/country:us/state:pa/cd:2",
  "name": {"value": "Pennsylvania's 2nd Congressional District", "confidence": "high", "sources": ["https://www.census.gov/..."]},
  "state": "PA",
  "district_type": "congressional",
  "parent_ocd_id": "ocd-division/country:us/state:pa"
}
```

`district_type`: `congressional` | `state_senate` | `state_house` | `county` | `municipal` | `judicial` | `school_board`

### Contest

```json
{
  "id": "pa-2026-general-ushouse-cd2",
  "election_event_id": "pa-2026-general",
  "district_ocd_id": "ocd-division/country:us/state:pa/cd:2",
  "office": {"value": "U.S. House of Representatives", "confidence": "high", "sources": ["..."]},
  "seats": 1,
  "candidate_ids": ["H4PA13199", "H6PA02205"],
  "ballot_status": {"value": "certified", "confidence": "medium", "sources": ["..."]},
  "sources": ["https://..."]
}
```

### Candidate

```json
{
  "id": "H4PA13199",
  "name": {"value": "Brendan F. Boyle", "confidence": "high", "sources": ["https://www.fec.gov/data/candidate/H4PA13199/"]},
  "party": {"value": "Democratic", "confidence": "high", "sources": ["..."]},
  "office_sought": {"value": "U.S. House of Representatives", "confidence": "high", "sources": ["..."]},
  "district_ocd_id": "ocd-division/country:us/state:pa/cd:2",
  "incumbent_challenger_status": {"value": "incumbent", "confidence": "high", "sources": ["..."]},
  "ballot_status": {"value": "on_ballot", "confidence": "medium", "sources": ["..."]},
  "photo": {"value": null, "confidence": "low", "sources": [], "note": "Official house.gov portrait is public domain; direct image URL not yet captured"},
  "bio": {"value": "...≤150 words, neutral...", "confidence": "high", "sources": ["...", "..."]},
  "contact": {
    "website": {"value": "https://boyle.house.gov/", "confidence": "high", "sources": ["https://www.congress.gov/member/brendan-boyle/B001296"]},
    "phone": {"value": "(202) 225-6111", "confidence": "high", "sources": ["https://www.congress.gov/member/brendan-boyle/B001296"]},
    "email": {"value": null, "confidence": "low", "sources": [], "note": "No verified public email found"},
    "office_address": {"value": "1502 Longworth House Office Building", "confidence": "high", "sources": ["https://www.congress.gov/member/brendan-boyle/B001296"]}
  },
  "platform": [
    {
      "topic": "Public safety",
      "quote": {"value": "Every family in Philadelphia deserves to feel safe...", "confidence": "medium", "sources": ["https://candidate-site.example/issues"]},
      "note": "Quotes only — never paraphrase a candidate's positions"
    }
  ],
  "key_votes": [
    {
      "description": "H.R. 1234 — Short Title",
      "vote": "Yea",
      "date": "2026-03-14",
      "congress": "119",
      "confidence": "high",
      "sources": ["https://clerk.house.gov/..."]
    }
  ],
  "finance": {
    "committee_id": "C00543363",
    "committee_name": "CITIZENS FOR BOYLE",
    "cycle": 2026,
    "total_receipts": {"value": 2451957.76, "confidence": "high", "sources": ["https://api.open.fec.gov/v1/candidate/H4PA13199/totals/"]},
    "total_disbursements": {"value": 729723.16, "confidence": "high", "sources": ["https://api.open.fec.gov/v1/candidate/H4PA13199/totals/"]},
    "cash_on_hand": {"value": null, "confidence": "low", "sources": [], "note": "Not reported in latest filing"},
    "coverage_end_date": "2026-06-30"
  },
  "last_verified": "2026-09-28"
}
```

**Rules for Candidate records:**
- `bio`: ≤150 words, neutral tone, compressed only from cited facts. No evaluative adjectives
  ("corrupt", "heroic", "radical", "beloved"). The Verification Agent diffs every bio against its sources.
- `platform`: quotes from the candidate's own materials only, each with its source. Empty array is
  valid — it renders "No verified platform statements found", never an AI guess.
- `key_votes`: incumbents only; challengers get an empty array with the same "no verified information" rendering.
- `photo`: federal officeholders' `house.gov`/`senate.gov` portraits are public domain — preferred.
  Others: Wikimedia Commons with verified CC license + attribution, else neutral silhouette placeholder
  (identical for all candidates missing photos). Never scrape campaign sites for photos.

## Dataset file envelope

```json
{
  "schema_version": "0.1",
  "dataset": "philly-federal-2026",
  "generated_at": "2026-09-28",
  "election_event": {},
  "districts": [],
  "contests": [],
  "candidates": [],
  "meta": {
    "build_notes": "...",
    "known_gaps": ["..."]
  }
}
```

## Changelog

- `0.1` (2026-09-28): Initial Phase 0 schema. Candidate, Contest, District, ElectionEvent.
  Planned additions: BallotMeasure entity, `endorsements` (v2, high abuse risk — deferred),
  multilingual bio variants (v2).
