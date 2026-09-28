# Philadelphia 2026 General Election — Ballot/Data Reconnaissance Briefing

**Election:** Tuesday, November 3, 2026 · **Research date:** September 28, 2026 (~5 weeks out)

## 1. Ballot-finality verdict

**Substantially locked, not yet officially verified.** The Philadelphia City Commissioners report that 2026 general-election mail ballots were being printed as of September 24, 2026 (https://vote.phila.gov/news/2026/09/15/2026-general-election-mail-ballots-office-hours-and-drop-boxes/), and on September 25 they published the list of flawed/unverifiable mail ballots — meaning ballot production is underway and the candidate slate is effectively set. **However, the official Philadelphia 2026 general-election UMOVA notice / sample-ballot PDFs were not found or not yet indexed** (the 2025 general UMOVA PDF exists at https://vote.phila.gov/media/UMOVA_NOTICE_2025_GENERAL_ELECTION.pdf, so a 2026 version likely exists — it must be located before calling anything final). ⚠️ Caution: the commissioners' news page has an apparent year typo ("November 3rd, 2025"); quote deadlines cautiously and cross-check.

## 2. Confirmed races and candidates

### Federal — US House (address-dependent: PA-02, PA-03, PA-05 all touch Philadelphia)

| District | Candidate | Party | Status | FEC 2026 candidate ID |
|---|---|---|---|---|
| PA-02 | Brendan Boyle | Dem | Incumbent | H4PA13199 |
| PA-02 | Jessica Arriaga | Rep | Challenger | H6PA02205 |
| PA-03 | Chris Rabb | Dem | Won May 19 primary (44.6%); Dwight Evans retired | H6PA03203 |
| PA-03 | Dennis Mahoney | Independent | No GOP primary candidate | H6PA03369 |
| PA-05 | Mary Gay Scanlon | Dem | Incumbent | H8PA07200 |
| PA-05 | Nicholas Manganaro | Rep | Challenger | H6PA05216 |

FEC IDs verified live via the public OpenFEC API — all six have 2026-cycle filings. Note: FEC lists also include primary losers — FEC presence ≠ on the November ballot.

**No US Senate race in PA in 2026:** McCormick (R, elected 2024) up in 2030; Fetterman (D, elected 2022) up in 2028.

### Governor / Lieutenant Governor (statewide; all Philly voters)
- Josh Shapiro / Austin Davis (Dem) · Stacy Garrity / Jason Richey (Rep) · Ken Krawchuk / John Thomas (Libertarian)
- Check PA Dept. of State for any other minor-party qualifiers.

### PA State Senate (only 3 of Philly's Senate seats cycle in 2026)
- **SD-2:** Christine Tartaglione (Dem, incumbent). GOP write-in campaign (Aaron Bashir) — November-ballot status unresolved.
- **SD-4:** Art Haywood (Dem, incumbent) vs Rev. Todd Johnson (Rep).
- **SD-8:** Anthony H. Williams (Dem, incumbent); no GOP challenger found — likely unopposed. Needs PA DoS confirmation.

### PA State House — all 25 Philadelphia districts (address-dependent)

| HD | Dem | Rep |
|---|---|---|
| 170 | Robert N. Gurtcheff II | **Martina White (R, incumbent)** |
| 172 | Sean Dougherty (inc) | Wallace J. Quinlan |
| 173 | Pat Gallagher (inc) | William J. Griffin Jr. |
| 174 | Ed Neilson (inc) | — |
| 175 | Mary Isaacson (inc) | — |
| 177 | Joseph C. Hohenstein (inc) | Robyn L. Bird |
| 179 | Jason Dawkins (inc) | — |
| 180 | Jose Giral (inc) | — |
| 181 | Malcolm Kenyatta (inc) | — |
| 182 | Ben Waxman (inc) | — |
| 184 | Elizabeth Fiedler (inc) | — |
| 185 | Regina Young (inc) | — |
| 186 | Jordan A. Harris (inc) | — |
| 188 | Rick Krajewski (inc) | — |
| 190 | G. Roni Green (inc) | — |
| 191 | Joanna E. McClinton (inc) | — |
| 192 | Morgan Cephas (inc) | Tiffany Brown |
| 194 | Tarik Khan (inc) | — |
| 195 | Sierra McNeil (won primary) | — |
| 197 | Danilo Burgos (inc) | — |
| 198 | Darisha Parker (inc) | — |
| 200 | Chris Johnson | — |
| 201 | Andre Carroll (inc) | — |
| 202 | Jared Solomon (inc) | — |
| 203 | Anthony A. Bellmon (inc) | — |

Only 4 of 25 Philly House races have GOP opponents listed.

### Statewide judicial — none found on the 2026 ballot
### Philadelphia local offices — none expected (municipal cycle: 2025/2027)
### Ballot questions — two PROPOSED, neither confirmed on the November ballot
1. **Creative Philadelphia charter amendment** (arts/culture office) — enactment status unknown.
2. **City contracting charter amendment** (small-business bid preferences) — enactment status unknown.
Do **not** present either as on the ballot until the official 2026G ballot-questions PDF is found.

## 3. Key dates
- **Oct 19** — PA voter registration deadline
- **Oct 27, 5:00 PM** — mail-ballot request deadline (ballots must be *received*, not postmarked, by 8 PM Nov 3)
- **Nov 3** — Election Day, polls 7 AM–8 PM

## 4. Official data sources
- **PA Dept. of State:** electionreturns.pa.gov (downloadable returns); pavoterservices.pa.gov (candidate/committee database)
- **Philadelphia City Commissioners:** vote.phila.gov — sample ballots (per-ward PDFs), ballot-question PDFs, UMOVA notices, drop-box lists
- **OpenDataPhilly / City ArcGIS:** turnout + registration by division/ward since 2015 (CSV + FeatureServer APIs)
- **OpenFEC:** free public API; all six congressional candidates have live 2026 filings

## 5. Philadelphia-specific quirks
- Consolidated city-county; 66 wards, ~1,703 divisions — ballots and polling places are ward/division-granular.
- PA-02, PA-03, PA-05 and multiple legislative districts split the city → address-level lookup mandatory; ZIP-only unsafe.
- 10 satellite election offices + City Hall Room 140 offer in-person mail-ballot services.

## 6. Explicit gaps (priority order)
1. Philadelphia 2026 general UMOVA notice / sample ballots / ballot-questions PDF — not yet located; the single blocker to calling the race list final.
2. PA DoS certified 2026 general candidate list — to confirm SD-8 unopposed, SD-2 GOP status, "no GOP" House districts, minor-party qualifiers.
3. SD-2 GOP write-in (Bashir) November-ballot status.
4. Ballot questions — two proposed charter amendments unresolved.
5. Polling-place dataset for API use — confirm ODP/ArcGIS availability.
