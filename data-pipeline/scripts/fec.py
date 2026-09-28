#!/usr/bin/env python3
"""FEC OpenFEC API client — keyless DEMO_KEY tier (~1,000 calls/hr).

Be polite: ~1 request/second, descriptive User-Agent. All facts returned
carry their source URL so the dataset builder can attach citations.
"""
import json
import time
import urllib.parse
import urllib.request

BASE = "https://api.open.fec.gov/v1"
API_KEY = "DEMO_KEY"  # keyless public demo tier; swap for a free api.data.gov key later
USER_AGENT = "WhatsOnMyBallot/0.1 (nonpartisan voter education; contact: whatsonmyballotusa@gmail.com)"


def _get(path, params=None):
    params = dict(params or {})
    params["api_key"] = API_KEY
    url = BASE + path + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def get_candidate(candidate_id):
    """Identity record: name, party, office, state, district, status."""
    time.sleep(1.1)
    return _get(f"/candidate/{candidate_id}/")


def get_totals(candidate_id, cycle=2026):
    """Financial totals for a cycle (full_election=true aggregates primary+general)."""
    time.sleep(1.1)
    return _get(
        f"/candidate/{candidate_id}/totals/",
        {"cycle": cycle, "full_election": "true"},
    )


def get_committees(candidate_id, cycle=2026):
    """Principal campaign committee(s) for a candidate."""
    time.sleep(1.1)
    return _get(f"/candidate/{candidate_id}/committees/", {"cycle": cycle})


def summarize_candidate(candidate_id, cycle=2026):
    """One merged record: identity + totals + principal committee, with sources."""
    ident = get_candidate(candidate_id)
    totals = get_totals(candidate_id, cycle)
    committees = get_committees(candidate_id, cycle)

    c = (ident.get("results") or [{}])[0]
    t = (totals.get("results") or [{}])[0]
    comms = committees.get("results") or []
    principal = next(
        (k for k in comms if k.get("designation") == "P"), comms[0] if comms else {}
    )

    return {
        "fec_candidate_id": candidate_id,
        "name": c.get("name"),
        "party": c.get("party_full") or c.get("party"),
        "office": c.get("office_full") or c.get("office"),
        "state": c.get("state"),
        "district": c.get("district"),
        "incumbent_challenge": c.get("incumbent_challenge_full")
        or c.get("incumbent_challenge"),
        "candidate_status": c.get("candidate_status"),
        "principal_committee": {
            "committee_id": principal.get("committee_id"),
            "name": principal.get("name"),
        },
        "finance_cycle": cycle,
        "finance": {
            "total_receipts": t.get("receipts"),
            "total_disbursements": t.get("disbursements"),
            "cash_on_hand_end_period": t.get("cash_on_hand_end_period"),
            "debts_owed": t.get("debts_owed_by_committee"),
            "coverage_end_date": t.get("coverage_end_date"),
        },
        "sources": [
            f"https://api.open.fec.gov/v1/candidate/{candidate_id}/",
            f"https://www.fec.gov/data/candidate/{candidate_id}/?cycle={cycle}",
        ],
    }


if __name__ == "__main__":
    import sys

    cid = sys.argv[1] if len(sys.argv) > 1 else "H4PA13199"
    print(json.dumps(summarize_candidate(cid), indent=2))
