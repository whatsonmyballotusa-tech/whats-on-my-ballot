#!/usr/bin/env python3
"""Google Civic Information API — voterinfo integration module.

STATUS: STANDBY — NOT CALLED IN PHASE 0.
This module is written and ready. It activates the moment the project
owner pastes the API key (see account checklist step 6):

    export CIVIC_API_KEY="AIza..."

Do NOT attempt keyless calls: the API rejects them and burns nothing but
adds noise. When the key arrives:
    1. set the env var,
    2. run: python3 civic_voterinfo.py "1600 Market St, Philadelphia, PA 19103"
    3. wire its output into the dataset builder (normalize to SCHEMA.md).

Endpoints used: elections.list, voterinfo.query, divisions.query.
NOTE: the representativeInfoByAddress endpoint was shut down by Google in
April 2025 — do not use it; divisionsByAddress covers OCD-division mapping.
Docs: https://developers.google.com/civic-information/docs/using_api
"""
import json
import os
import sys
import urllib.parse
import urllib.request

BASE = "https://civicinfo.googleapis.com/civicinfo/v2"
API_KEY = os.environ.get("CIVIC_API_KEY", "PASTE_API_KEY_HERE")
USER_AGENT = "WhatsOnMyBallot/0.1 (nonpartisan voter education; contact: whatsonmyballotusa@gmail.com)"


def _require_key():
    if not API_KEY or API_KEY == "PASTE_API_KEY_HERE":
        raise RuntimeError(
            "CIVIC_API_KEY is not set. Export it first: "
            'export CIVIC_API_KEY="AIza..." (see account checklist step 6).'
        )


def _get(path, params=None):
    _require_key()
    params = dict(params or {})
    params["key"] = API_KEY
    url = BASE + path + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def list_elections():
    """All elections Google Civic knows about (use to find the right electionId)."""
    return _get("/elections")


def voterinfo(address, election_id):
    """Full voter-info payload: contests, candidates, polling places, drop-off sites."""
    return _get("/voterinfo", {"address": address, "electionId": election_id})


def divisions_by_address(address):
    """OCD division IDs for an address (district mapping without the dead rep endpoint)."""
    return _get("/divisions", {"query": address})


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('usage: python3 civic_voterinfo.py "1600 Market St, Philadelphia, PA 19103"')
        sys.exit(1)
    address = sys.argv[1]
    elections = list_elections()
    print(json.dumps(elections, indent=2)[:2000])
    # Full per-election voterinfo wiring happens in the dataset builder.
