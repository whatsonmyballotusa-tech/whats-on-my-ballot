#!/usr/bin/env python3
"""US Census Geocoder client — keyless, free, no signup.

Address -> lat/lon + census geographies (congressional district, state
legislative districts). This is the zero-cost hedge if the Google Civic
API becomes unavailable: geocode with Census, then map the returned
geographies to OCD division IDs ourselves.

Be polite: sequential requests, small sleeps, descriptive User-Agent.
Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
"""
import json
import time
import urllib.parse
import urllib.request

BASE = "https://geocoding.geo.census.gov/geocoder/geographies/address"
USER_AGENT = "WhatsOnMyBallot/0.1 (nonpartisan voter education; contact: whatsonmyballotusa@gmail.com)"
BENCHMARK = "Public_AR_Current"
VINTAGE = "Current_Current"


def geocode(street, city, state, zip_code):
    """Return lat/lon + census geographies for a street address."""
    params = {
        "street": street,
        "city": city,
        "state": state,
        "zip": zip_code,
        "benchmark": BENCHMARK,
        "vintage": VINTAGE,
        "format": "json",
    }
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    time.sleep(0.5)  # polite: max ~2 req/sec
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)

    matches = (data.get("result") or {}).get("addressMatches") or []
    if not matches:
        return {"matched": False, "input": f"{street}, {city}, {state} {zip_code}"}

    m = matches[0]
    geos = m.get("geographies") or {}

    def _layer(needle):
        for k, v in geos.items():
            if needle in k and v:
                return v[0]
        return {}

    cd = _layer("Congressional Districts")
    sldl = _layer("Legislative Districts - Lower")
    sldu = _layer("Legislative Districts - Upper")
    # CD field name tracks the session: CD118, CD119, CD120, ...
    cd_num = next((cd[k] for k in cd if k.startswith("CD") and k[2:].isdigit()), None)

    return {
        "matched": True,
        "input": f"{street}, {city}, {state} {zip_code}",
        "matched_address": m.get("matchedAddress"),
        "lat": m["coordinates"]["y"],
        "lon": m["coordinates"]["x"],
        "congressional_district": cd.get("NAME"),
        "state_house_district": sldl.get("NAME"),
        "state_senate_district": sldu.get("NAME"),
        # OCD-ID mapping for the canonical schema:
        "ocd_ids": {
            "cd": f"ocd-division/country:us/state:{state.lower()}/cd:{int(cd_num)}"
            if cd_num
            else None,
        },
        "sources": [url.split("?")[0]],
    }


if __name__ == "__main__":
    # Public landmark test: Philadelphia City Hall (no PII involved)
    print(
        json.dumps(
            geocode(
                "1400 John F Kennedy Blvd",
                "Philadelphia",
                "PA",
                "19107",
            ),
            indent=2,
        )
    )
