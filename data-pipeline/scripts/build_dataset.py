#!/usr/bin/env python3
"""Build philly-federal-2026.json: the first canonical dataset.

Merges:
  - data/fec_cache.json  (machine-fetched FEC identity + finance, high confidence)
  - BIOS                 (human-curated, web-verified bio/contact facts below)

Every value goes through the Fact envelope (SCHEMA.md). Nothing is invented:
fields we could not verify are value:null + confidence:low.

Re-run any time: python3 scripts/build_dataset.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
OUT = os.path.join(DATA, "philly-federal-2026.json")
GENERATED = "2026-09-28"

with open(os.path.join(DATA, "fec_cache.json")) as f:
    FEC = json.load(f)

FEC_PAGE = "https://www.fec.gov/data/candidate/{}/?cycle=2026"
FEC_API = "https://api.open.fec.gov/v1/candidate/{}/"
PA_RACES = "https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections_in_Pennsylvania"


def F(value, confidence, sources, note=None):
    d = {"value": value, "confidence": confidence, "sources": list(sources)}
    if note:
        d["note"] = note
    return d


def unverified(note):
    return F(None, "low", [], note)


PARTY = {"DEMOCRATIC PARTY": "Democratic", "REPUBLICAN PARTY": "Republican",
         "INDEPENDENT": "Independent"}
STATUS = {"Incumbent": "incumbent", "Challenger": "challenger", "Open seat": "open_seat"}

# --- Human-curated, web-verified facts (2026-09-28). Edit with citations only. ---
BIOS = {
    "H4PA13199": {
        "display_name": "Brendan F. Boyle",
        "bio": ("Brendan F. Boyle was born and raised in Philadelphia, the son of an immigrant; "
                "his father was a SEPTA janitor and his mother a school crossing guard. The first in "
                "his family to attend college, he earned degrees from the University of Notre Dame and "
                "Harvard University's Kennedy School of Government. He served in the Pennsylvania State "
                "House from 2009 to 2015 and was elected to the U.S. House of Representatives in 2014. "
                "Now in his sixth term representing Pennsylvania's 2nd District, he is the Ranking Member "
                "of the House Budget Committee and Lead Democrat for the U.S. Congressional Delegation "
                "to the NATO Parliamentary Assembly."),
        "bio_conf": "high",
        "bio_sources": ["http://boyle.house.gov/about/biography",
                        "https://www.congress.gov/member/brendan-boyle/B001296"],
        "website": "https://boyle.house.gov/",
        "phone": "(202) 225-6111",
        "office_address": "1502 Longworth House Office Building",
        "contact_sources": ["https://www.congress.gov/member/brendan-boyle/B001296"],
        "contact_conf": "high",
    },
    "H8PA07200": {
        "display_name": "Mary Gay Scanlon",
        "bio": ("Mary Gay Scanlon, born August 30, 1959 in Syracuse, New York, is an attorney who served "
                "as national pro bono counsel at Ballard Spahr, an attorney at the Education Law Center, "
                "and president of the Swarthmore-Rutledge school board. Elected to the U.S. House on "
                "November 6, 2018, she has represented Pennsylvania's 5th Congressional District since "
                "January 2019. She serves on the House Rules Committee and the House Judiciary Committee, "
                "where she is Ranking Member of the Subcommittee on the Constitution and Limited Government."),
        "bio_conf": "high",
        "bio_sources": ["https://en.wikipedia.org/wiki/Mary_Gay_Scanlon",
                        "https://swarthmorephoenix.com/2026/04/16/the-phoenix-in-conversation-with-swarthmores-u-s-representative-mary-gay-scanlon-d-pa05/",
                        "https://www.legistorm.com/person/bio/304453/Mary_Gay_Scanlon/hashkey/a6893de4.html"],
        "website": None, "phone": None, "office_address": None,
        "contact_sources": [],
        "contact_conf": "low",
    },
    "H6PA03203": {
        "display_name": "Chris Rabb",
        "bio": ("Chris Rabb was born in Chicago and earned a bachelor's degree from Yale University and a "
                "master's degree in organizational dynamics from the University of Pennsylvania. He served "
                "as an aide to U.S. Senator Carol Moseley Braun, worked in the Clinton administration, "
                "taught business at Temple University, and authored 'Invisible Capital: How Unseen Forces "
                "Shape Entrepreneurial Opportunity' (2010). He served five terms as Pennsylvania State "
                "Representative for House District 200. On May 19, 2026, he won the Democratic primary for "
                "Pennsylvania's 3rd Congressional District with 44.6% of the vote; no Republican candidate "
                "filed for the seat."),
        "bio_conf": "high",
        "bio_sources": ["https://en.wikipedia.org/wiki/Chris_Rabb",
                        "https://criticalreport.substack.com/p/2026-pa-federal-primaries",
                        "https://www.newsbeep.com/us-pa/198475/"],
        "website": None, "phone": None, "office_address": None,
        "contact_sources": [],
        "contact_conf": "low",
    },
    "H6PA02205": {
        "display_name": "Jessica Arriaga",
        "bio": ("Jessica Arriaga, a Philadelphia native and entrepreneur, won the Republican primary for "
                "Pennsylvania's 2nd Congressional District uncontested. Her professional background is in "
                "healthcare, where she worked as an Operating Room Technician and as a Health and Resource "
                "Coordinator. Her campaign emphasizes public safety."),
        "bio_conf": "medium",
        "bio_sources": ["https://collarcountycourier.news/philadelphia-gop-challenger-emerges-to-take-on-rep-brendan-boyle-in-pa-s-2nd-district/",
                        "https://docquery.fec.gov/cgi-bin/forms/H6PA02205/1929086"],
        "website": None, "phone": None, "office_address": None,
        "contact_sources": [],
        "contact_conf": "low",
    },
    "H6PA03369": {
        "display_name": "Dennis Mahoney",
        "bio": ("Dennis Mahoney is a humanitarian aid worker and the founder of AOI Solutions, a firm "
                "focused on disaster relief and humanitarian response. He has spent more than a decade "
                "building partnerships addressing food insecurity, education, and affordability, and is a "
                "Distinguished Fellow at the University of Pennsylvania's Fels Institute of Government. "
                "On September 8, 2026, the Forward Party endorsed his independent candidacy for "
                "Pennsylvania's 3rd Congressional District."),
        "bio_conf": "medium",
        "bio_sources": ["https://www.forwardparty.com/media/press_release/forward-party-endorses-independent-congressional-candidate-dennis-mahoney-in-pennsylvania-congressional-district-03/",
                        "https://delco.today/2026/09/dennis-mahoney-aoi-solutions-community-partnerships/"],
        "website": None, "phone": None, "office_address": None,
        "contact_sources": [],
        "contact_conf": "low",
    },
    "H6PA05216": {
        "display_name": "Nicholas Manganaro",
        "bio": ("Nicholas Manganaro, a retired financial professional from Montgomery County, won the "
                "Republican primary for Pennsylvania's 5th Congressional District."),
        "bio_conf": "low",
        "bio_sources": [PA_RACES],
        "website": None, "phone": None, "office_address": None,
        "contact_sources": [],
        "contact_conf": "low",
    },
}


def build_candidate(cid):
    fec = FEC[cid]
    b = BIOS[cid]
    dist_num = fec["district"].zfill(2)
    ocd = f"ocd-division/country:us/state:pa/cd:{dist_num}"
    fec_srcs = [FEC_API.format(cid), FEC_PAGE.format(cid)]

    fin = fec["finance"]
    finance = {
        "committee_id": fec["principal_committee"]["committee_id"],
        "committee_name": fec["principal_committee"]["name"],
        "cycle": 2026,
        "total_receipts": F(fin["total_receipts"], "high", fec_srcs,
                            None if fin["total_receipts"] is not None
                            else "OpenFEC returned no 2026 totals (no filings or below reporting threshold)"),
        "total_disbursements": F(fin["total_disbursements"], "high", fec_srcs),
        "cash_on_hand": unverified("Not captured in Phase 0; add from latest filing"),
        "coverage_end_date": fin["coverage_end_date"],
    }

    contact = {}
    for field in ("website", "phone", "office_address"):
        val = b[field]
        contact[field] = (F(val, b["contact_conf"], b["contact_sources"])
                          if val else unverified("No verified public contact found in Phase 0"))
    contact["email"] = unverified("No verified public email found in Phase 0")

    return {
        "id": cid,
        "name": F(b["display_name"], "high", fec_srcs),
        "party": F(PARTY.get(fec["party"], fec["party"]), "high", fec_srcs),
        "office_sought": F("U.S. House of Representatives", "high", fec_srcs),
        "district_ocd_id": ocd,
        "incumbent_challenger_status": F(STATUS.get(fec["incumbent_challenge"],
                                                   fec["incumbent_challenge"]), "high", fec_srcs),
        "ballot_status": F("on_ballot", "medium", fec_srcs + [PA_RACES],
                           "FEC filing + primary results confirm candidacy; official Philly sample ballot pending"),
        "photo": unverified("Official house.gov portraits are public domain for incumbents; "
                            "direct image URLs not yet captured — use neutral placeholder"),
        "bio": F(b["bio"], b["bio_conf"], b["bio_sources"]),
        "contact": contact,
        "platform": [],
        "platform_note": "No verified platform quotes captured in Phase 0 — quotes must come from candidate materials only",
        "key_votes": [],
        "key_votes_note": "Pending Congress.gov integration (activates with api.data.gov key)",
        "finance": finance,
        "last_verified": GENERATED,
    }


def main():
    districts = []
    contests = []
    by_district = {}
    for cid in FEC:
        d = FEC[cid]["district"].zfill(2)
        by_district.setdefault(d, []).append(cid)

    for d, cids in sorted(by_district.items()):
        ocd = f"ocd-division/country:us/state:pa/cd:{d}"
        districts.append({
            "ocd_id": ocd,
            "name": F(f"Pennsylvania's {int(d)} Congressional District", "high",
                      [FEC_API.format(c) for c in cids]),
            "state": "PA",
            "district_type": "congressional",
            "parent_ocd_id": "ocd-division/country:us/state:pa",
        })
        contests.append({
            "id": f"pa-2026-general-ushouse-cd{d}",
            "election_event_id": "pa-2026-general",
            "district_ocd_id": ocd,
            "office": F("U.S. House of Representatives", "high",
                        [FEC_API.format(c) for c in cids]),
            "seats": 1,
            "candidate_ids": sorted(cids),
            "ballot_status": F("projected", "medium", [PA_RACES],
                               "Candidate slate per FEC filings + primary results; "
                               "official Philadelphia sample ballot not yet published"),
            "sources": [PA_RACES],
        })

    dataset = {
        "schema_version": "0.1",
        "dataset": "philly-federal-2026",
        "generated_at": GENERATED,
        "election_event": {
            "id": "pa-2026-general",
            "name": F("2026 Pennsylvania General Election", "high",
                      ["https://www.pa.gov/agencies/vote.html"]),
            "date": F("2026-11-03", "high", ["https://www.pa.gov/agencies/vote.html"]),
            "state": "PA",
            "election_type": "general",
            "registration_deadline": F("2026-10-19", "medium",
                                       ["https://vote.phila.gov/"],
                                       "Cross-checked by research team; confirm on PA DoS site"),
            "mail_ballot_request_deadline": F("2026-10-27T17:00:00", "medium",
                                              ["https://vote.phila.gov/"],
                                              "5:00 PM; cross-checked by research team"),
            "mail_ballot_return_deadline": F("2026-11-03T20:00:00", "medium",
                                             ["https://vote.phila.gov/"],
                                             "Must be RECEIVED by 8:00 PM, not postmarked"),
            "poll_hours": F("07:00-20:00", "high", ["https://www.pa.gov/agencies/vote.html"]),
        },
        "districts": districts,
        "contests": contests,
        "candidates": [build_candidate(cid) for cid in
                       ["H4PA13199", "H6PA02205", "H6PA03203", "H6PA03369", "H8PA07200", "H6PA05216"]],
        "meta": {
            "build_notes": ("Phase 0 build: FEC identity+finance via OpenFEC DEMO_KEY; "
                            "bios/contact hand-verified via web search 2026-09-28. "
                            "No Google Civic calls made (key pending)."),
            "known_gaps": [
                "Official Philadelphia 2026 general sample ballot / UMOVA notice not yet located — ballot_status stays 'projected' until found.",
                "Candidate photos not captured — neutral placeholder required in UI.",
                "Platform quotes: none captured — must be sourced from candidate materials only, never paraphrased.",
                "Key votes: pending Congress.gov API (activates with api.data.gov key).",
                "Manganaro bio is single-source (low) — needs campaign-site or news verification.",
                "Challenger contact info (Arriaga, Rabb, Mahoney, Manganaro): no verified public contacts found.",
                "Google Civic voterinfo module is written but standby — needs CIVIC_API_KEY.",
            ],
        },
    }

    with open(OUT, "w") as f:
        json.dump(dataset, f, indent=2)
    print(f"wrote {OUT} ({len(dataset['candidates'])} candidates, "
          f"{len(dataset['contests'])} contests)")


if __name__ == "__main__":
    main()
