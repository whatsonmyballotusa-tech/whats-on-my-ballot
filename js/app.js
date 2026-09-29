/* What's On My Ballot — ballot rendering + lookup (vanilla JS, no build step).
 *
 * Data contract: canonical dataset (schema v0.2) with nested Fact envelopes:
 *   every factual field = {value, confidence, sources[], note}.
 *   fetch("data/philly-2026-general.json") -> fallback sample-ballot.json (same shape).
 * Everything rendered is escaped; URLs are scheme-checked before linking.
 */
(function () {
  "use strict";

  /* ================= helpers ================= */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Only http(s) links are rendered as <a>. Anything else is dropped (XSS/phishing safety).
  function safeUrl(u) {
    if (typeof u !== "string") return null;
    var t = u.trim();
    if (/^https?:\/\//i.test(t)) return t;
    return null;
  }

  function isFact(x) {
    return x != null && typeof x === "object" && !Array.isArray(x) && "value" in x && "confidence" in x;
  }

  // Unwrap a Fact envelope -> {v, c, sources, note}. Missing -> low-confidence null.
  function F(x) {
    if (x == null) return { v: null, c: "low", sources: [], note: null };
    if (isFact(x)) {
      return {
        v: x.value == null ? null : x.value,
        c: x.confidence || "low",
        sources: Array.isArray(x.sources) ? x.sources : [],
        note: x.note || null
      };
    }
    return { v: x, c: "medium", sources: [], note: null }; // defensive: bare value
  }

  function isProvisionalStatus(f) {
    var v = String(f.v || "").toLowerCase();
    return v === "projected" || v === "unconfirmed";
  }

  function unconfBadge() {
    return ' <span class="tag unconf">Unconfirmed</span>';
  }
  function verifiedBadge() {
    return ' <span class="tag verified">verified</span>';
  }

  // Badge for a fact's confidence: low -> Unconfirmed; high -> verified; medium -> none.
  function confTag(f) {
    if (f.c === "low") return unconfBadge();
    if (f.c === "high") return verifiedBadge();
    return "";
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; }
  }

  // Source links for a Fact's sources[]. Accepts bare URL strings or {label,url}/{value} shapes.
  function sourceLinks(sources) {
    if (!sources || !sources.length) return "";
    var items = sources.map(function (s) {
      var url = null, label = null;
      if (typeof s === "string") { url = s; }
      else if (s && typeof s === "object") { url = s.url || s.value || null; label = s.label || null; }
      url = safeUrl(url);
      if (!url) return "";
      return '<li><a href="' + esc(url) + '" rel="noopener">' + esc(label || hostOf(url)) + "</a></li>";
    }).filter(Boolean);
    return items.length ? '<ul class="sources">' + items.join("") + "</ul>" : "";
  }

  function fmtDate(iso) {
    if (!iso) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  function fmtDateTime(iso) {
    if (!iso) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
    if (!m) return fmtDate(iso);
    var h = +m[4], ap = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12;
    return new Date(+m[1], +m[2] - 1, +m[3])
      .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
      ", " + h12 + ":" + m[5] + " " + ap + " ET";
  }

  function fmtTimeRange(v) {
    if (!v) return null;
    var m = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(v);
    if (!m) return v;
    function t(h, mi) { var hh = +h, ap = hh >= 12 ? "PM" : "AM"; return (hh % 12 || 12) + ":" + mi + " " + ap; }
    return t(m[1], m[2]) + " – " + t(m[3], m[4]);
  }

  // One identical neutral silhouette for EVERY candidate missing a photo. Same SVG, no party cues.
  function silhouette() {
    return '<svg class="photo-svg" viewBox="0 0 64 64" role="img" aria-label="No photo available">' +
      '<rect width="64" height="64" fill="#e7e5e4"/>' +
      '<circle cx="32" cy="24" r="10" fill="#a8a29e"/>' +
      '<path d="M12 58c2-12 10-18 20-18s18 6 20 18z" fill="#a8a29e"/>' +
      "</svg>";
  }

  /* ================= district plumbing ================= */

  // OCD id -> {type, short}. Handles cd:02, sldu:/senate:, sldl:/house: variants.
  function parseOcd(ocd) {
    if (!ocd || typeof ocd !== "string") return { type: null, short: null };
    var seg = ocd.split("/").pop() || ""; // e.g. "cd:02"
    var parts = seg.split(":");
    var kind = parts[0], num = String(parseInt(parts[1] || "0", 10) || 0).padStart(2, "0");
    if (kind === "cd") return { type: "congressional", short: "PA-" + num };
    if (kind === "sldu" || kind === "senate") return { type: "state_senate", short: "PA-SD-" + num };
    if (kind === "sldl" || kind === "house") return { type: "state_house", short: "PA-HD-" + num };
    if (kind === "county") return { type: "county", short: "PA-" + num };
    return { type: kind || null, short: null };
  }

  var DISTRICT_TYPES = ["congressional", "state_senate", "state_house"];
  function typeLabel(t) {
    return t === "congressional" ? "U.S. House"
      : t === "state_senate" ? "PA Senate"
      : t === "state_house" ? "PA House"
      : t;
  }

  var SEL_KEY = "womb.districts.v1";
  function loadSelection() {
    try {
      var s = JSON.parse(localStorage.getItem(SEL_KEY) || "null");
      if (s && typeof s === "object") return s;
    } catch (e) {}
    return { congressional: null, state_senate: null, state_house: null };
  }
  function saveSelection(s) {
    try { localStorage.setItem(SEL_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function selectionHasAny(s) {
    return !!(s.congressional || s.state_senate || s.state_house);
  }

  /* ================= data loading ================= */

  function loadDataset() {
    // Real merged dataset first; provisional sample file as the honest fallback.
    return fetch("data/philly-2026-general.json")
      .then(function (r) {
        if (!r.ok) throw new Error("missing");
        return r.json().then(function (d) { return { data: d, provisional: false }; });
      })
      .catch(function () {
        return fetch("sample-ballot.json")
          .then(function (r) {
            if (!r.ok) throw new Error("missing");
            return r.json().then(function (d) { return { data: d, provisional: true }; });
          });
      });
  }

  function districtByOcd(data, ocd) {
    var ds = data.districts || [];
    for (var i = 0; i < ds.length; i++) if (ds[i].ocd_id === ocd) return ds[i];
    return null;
  }
  function candidateById(data, id) {
    var cs = data.candidates || [];
    for (var i = 0; i < cs.length; i++) if (cs[i].id === id) return cs[i];
    return null;
  }
  function districtName(d) {
    if (!d) return null;
    var n = F(d.name);
    return n.v || parseOcd(d.ocd_id).short;
  }

  /* ================= ballot rendering ================= */

  function contestGroup(contest, district) {
    var t = district ? district.district_type : null;
    if (!district || t === "statewide") return "Statewide";
    if (t === "congressional") return "Federal";
    if (t === "state_senate" || t === "state_house") return "State Legislature";
    return "Local";
  }
  var GROUP_ORDER = ["Federal", "Statewide", "State Legislature", "Local", "Ballot Questions"];
  var GROUP_SUB = {
    "Federal": "U.S. House",
    "Statewide": "Governor & statewide offices",
    "State Legislature": "PA Senate & PA House",
    "Local": "County & municipal",
    "Ballot Questions": "Referenda & ballot measures"
  };

  function statusBadge(fact) {
    var v = String(fact.v || "").toLowerCase();
    if (v === "projected") return '<span class="tag unconf">Projected</span>';
    if (v === "unconfirmed") return unconfBadge();
    if (v === "certified" || v === "on_ballot") return verifiedBadge();
    return "";
  }

  function incumbentBadge(fact) {
    var v = String(fact.v || "").toLowerCase();
    var label = v === "incumbent" ? "Incumbent" : v === "challenger" ? "Challenger" : (fact.v || "");
    if (!label) return "";
    return '<span class="status-pill">' + esc(label) + "</span>" + (fact.c === "low" ? unconfBadge() : "");
  }

  function photoHtml(cand) {
    var p = F(cand.photo);
    var url = safeUrl(p.v);
    var name = F(cand.name).v || "Candidate";
    if (url) {
      return '<img class="photo" src="' + esc(url) + '" alt="Photo of ' + esc(name) + '" loading="lazy">';
    }
    return '<div class="photo photo-empty">' + silhouette() + "</div>";
  }

  function bioHtml(cand) {
    var b = F(cand.bio);
    if (b.v) return "<p>" + esc(b.v) + confTag(b) + "</p>";
    return '<p class="unverified-note">No verified information available.' + unconfBadge() + "</p>";
  }

  function contactHtml(cand) {
    var ct = cand.contact || {};
    var w = F(ct.website), ph = F(ct.phone), em = F(ct.email), ad = F(ct.office_address);
    var items = [];
    var wurl = safeUrl(w.v);
    if (wurl) items.push('<li>Website: <a href="' + esc(wurl) + '" rel="noopener">' + esc(hostOf(wurl)) + "</a>" + confTag(w) + "</li>");
    else if (w.v) items.push("<li>Website: " + esc(w.v) + confTag(w) + "</li>");
    if (ph.v) {
      var tel = "tel:" + String(ph.v).replace(/[^+\d]/g, "");
      items.push('<li>Phone: <a href="' + esc(tel) + '">' + esc(ph.v) + "</a>" + confTag(ph) + "</li>");
    }
    if (em.v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.v)) {
      items.push('<li>Email: <a href="mailto:' + esc(em.v) + '">' + esc(em.v) + "</a>" + confTag(em) + "</li>");
    } else if (em.v) {
      items.push("<li>Email: " + esc(em.v) + confTag(em) + "</li>");
    }
    if (ad.v) items.push("<li>Office: " + esc(ad.v) + confTag(ad) + "</li>");
    if (!items.length) return '<p class="unverified-note">No verified information available.' + unconfBadge() + "</p>";
    // A contact block whose every present field is low-confidence gets the provisional mark.
    var allLow = [w, ph, em, ad].every(function (f) { return !f.v || f.c === "low"; });
    return "<ul>" + items.join("") + "</ul>" + (allLow ? unconfBadge() : "");
  }

  function platformHtml(cand) {
    var plats = Array.isArray(cand.platform) ? cand.platform : [];
    if (!plats.length) {
      return '<p class="unverified-note">No verified information available.' + unconfBadge() + "</p>";
    }
    return plats.map(function (p) {
      var q = F(p.quote), topic = p.topic || p.issue || "";
      var links = sourceLinks(q.sources && q.sources.length ? q.sources : (p.sources || []));
      return "<blockquote>" +
        (topic ? "<strong>" + esc(topic) + ".</strong> " : "") +
        "&ldquo;" + esc(q.v || "") + "&rdquo;" + confTag(q) +
        (links ? "<div>" + links + "</div>" : "") +
        "</blockquote>";
    }).join("") + '<p class="fineprint">In the candidate\'s own words, quoted from their published materials.</p>';
  }

  function recordHtml(cand) {
    // Voting record (incumbents) + prior offices (where present). Identical layout for all.
    var votes = Array.isArray(cand.key_votes) ? cand.key_votes : [];
    var prior = cand.prior_offices;
    var pf = prior != null && !Array.isArray(prior) ? F(prior) : null;
    var html = "";
    if (pf && pf.v) {
      html += "<p><strong>Prior offices:</strong> " + esc(pf.v) + confTag(pf) + "</p>";
    } else if (prior && Array.isArray(prior) && prior.length) {
      html += "<ul>" + prior.map(function (o) {
        var f = F(o); return "<li>" + esc(f.v || "") + confTag(f) + "</li>";
      }).join("") + "</ul>";
    }
    if (votes.length) {
      html += "<ul>" + votes.map(function (v) {
        var desc = esc(v.description || v.bill || "");
        var vote = esc(v.vote || v.position || "");
        var date = v.date ? " <span class=\"fineprint\">" + esc(v.date) + "</span>" : "";
        var link = v.sources && v.sources.length
          ? (function () { var u = safeUrl(typeof v.sources[0] === "string" ? v.sources[0] : v.sources[0].url); return u ? ' <a href="' + esc(u) + '" rel="noopener">source</a>' : ""; })()
          : (v.source_url ? (function () { var u2 = safeUrl(v.source_url); return u2 ? ' <a href="' + esc(u2) + '" rel="noopener">source</a>' : ""; })() : "");
        return "<li><strong>" + desc + ":</strong> " + vote + date + link + "</li>";
      }).join("") + "</ul>";
    }
    if (!html) return '<p class="unverified-note">No verified information available.' + unconfBadge() + "</p>";
    return html;
  }

  function committeesHtml(cand) {
    // Rendered ONLY when committees data is present and non-empty (value is a
    // non-empty array). Otherwise the whole section is omitted — no placeholder,
    // so challengers and non-federal candidates show nothing here. Identical
    // treatment for every candidate (nonpartisan by construction).
    var f = F(cand.committees);
    var list = Array.isArray(f.v) ? f.v : [];
    if (!list.length) return "";
    var items = list.map(function (c) {
      var subs = Array.isArray(c.subcommittees) ? c.subcommittees : [];
      var subHtml = subs.length ? "<ul>" + subs.map(function (s) {
        return "<li>" + esc(s.name || "Subcommittee") + (s.role ? " &mdash; <em>" + esc(s.role) + "</em>" : "") + "</li>";
      }).join("") + "</ul>" : "";
      return "<li><strong>" + esc(c.committee || "Committee") + "</strong>" +
        (c.role ? " &mdash; <em>" + esc(c.role) + "</em>" : "") + subHtml + "</li>";
    }).join("");
    return '<div class="cand-section"><h4>Committee assignments' + confTag(f) + "</h4>" +
      '<ul class="committees">' + items + "</ul>" +
      sourceLinks(f.sources) +
      '<p class="fineprint">Committee assignments are for the 119th Congress and may change with each new Congress.</p></div>';
  }

  function sourcesHtml(cand) {
    // Collect candidate-level sources: name/party/bio/contact + explicit sources list.
    var seen = {}, urls = [];
    [cand.name, cand.party, cand.bio].forEach(function (f) {
      (F(f).sources || []).forEach(pushUrl);
    });
    function pushUrl(s) {
      var u = typeof s === "string" ? s : (s && (s.url || s.value));
      u = safeUrl(u);
      if (u && !seen[u]) { seen[u] = 1; urls.push(u); }
    }
    (cand.sources || []).forEach(function (s) {
      var u = typeof s === "string" ? s : (s && (s.url || s.value));
      u = safeUrl(u);
      var label = (s && typeof s === "object" && s.label) ? s.label : null;
      if (u && !seen[u]) { seen[u] = 1; urls.push({ url: u, label: label }); }
    });
    if (!urls.length) return '<p class="unverified-note">No verified information available.' + unconfBadge() + "</p>";
    return '<ul class="sources">' + urls.map(function (u) {
      var url = typeof u === "string" ? u : u.url;
      var label = typeof u === "string" ? hostOf(u) : (u.label || hostOf(u.url));
      return '<li><a href="' + esc(url) + '" rel="noopener">' + esc(label) + "</a></li>";
    }).join("") + "</ul>";
  }

  /* Candidate card — IDENTICAL layout for every candidate (nonpartisan by construction). */
  function candidateCard(cand, contest, district) {
    var name = F(cand.name), party = F(cand.party), office = F(contest.office);
    var st = F(cand.incumbent_challenger_status), bs = F(cand.ballot_status);
    var prov = isProvisionalStatus(bs) || name.c === "low";

    var head = '<div class="cand-head">' + photoHtml(cand) +
      "<div><h3>" + esc(name.v || "Name unavailable") + (name.c === "low" ? unconfBadge() : confTag(name)) + "</h3>" +
      '<p class="cand-office">' + esc(office.v || "") + (district ? " &middot; " + esc(districtName(district) || "") : "") + "</p>" +
      (party.v ? '<span class="party">' + esc(party.v) + "</span> " : "") +
      incumbentBadge(st) +
      (prov ? unconfBadge() : "") +
      "</div></div>";

    return '<article class="candidate" id="cand-' + esc(cand.id) + '">' + head +
      '<div class="cand-section"><h4>Bio</h4>' + bioHtml(cand) + "</div>" +
      '<div class="cand-section"><h4>Contact</h4>' + contactHtml(cand) + "</div>" +
      '<div class="cand-section"><h4>Running on</h4>' + platformHtml(cand) + "</div>" +
      '<div class="cand-section"><h4>Voting record &amp; prior offices</h4>' + recordHtml(cand) + "</div>" +
      committeesHtml(cand) +
      '<div class="cand-section"><h4>Sources</h4>' + sourcesHtml(cand) + "</div>" +
      "</article>";
  }

  function contestHtml(contest, data, open) {
    var district = contest.district_ocd_id ? districtByOcd(data, contest.district_ocd_id) : null;
    var bs = F(contest.ballot_status);
    var office = F(contest.office).v || "Contest";
    var dname = districtName(district);
    var badges = statusBadge(bs) + (contest._districtUnconfirmed ? ' <span class="tag unconf">District not confirmed</span>' : "");

    var cards = (contest.candidate_ids || []).map(function (id) {
      var c = candidateById(data, id);
      return c ? candidateCard(c, contest, district) : "";
    }).join("");
    if (!cards) cards = '<p class="unverified-note">No verified information available.' + unconfBadge() + "</p>";

    return '<details class="contest"' + (open ? " open" : "") + ">" +
      "<summary><span>" + esc(office) +
      (dname ? '<span class="c-dist">' + esc(dname) + "</span>" : "") +
      badges + "</span>" +
      '<span class="chev" aria-hidden="true">&#9660;</span></summary>' +
      '<div class="contest-body">' + cards + "</div></details>";
  }

  function measureHtml(m) {
    var title = F(m.title || m.name), q = F(m.question_text || m.question || m.text);
    var sum = F(m.summary), st = F(m.status || m.ballot_status);
    var prov = isProvisionalStatus(st) || title.c === "low" || q.c === "low";
    var body = "";
    if (q.v) body += "<p><strong>Ballot question:</strong> " + esc(q.v) + confTag(q) + "</p>";
    if (sum.v) body += "<p>" + esc(sum.v) + confTag(sum) + "</p>";
    var links = sourceLinks(title.sources.concat(q.sources, sum.sources));
    if (!body) body = '<p class="unverified-note">No verified information available.' + unconfBadge() + "</p>";
    return '<article class="candidate measure" id="measure-' + esc(m.id || "") + '">' +
      "<h3>" + esc(title.v || "Ballot measure") + (title.c === "low" ? unconfBadge() : confTag(title)) +
      (prov ? unconfBadge() : "") + " " + statusBadge(st) + "</h3>" +
      body + links + "</article>";
  }

  function electionStrip(data) {
    var ev = data.election_event || {};
    var rows = [
      ["Registration deadline", fmtDate(F(ev.registration_deadline).v), F(ev.registration_deadline)],
      ["Mail ballot request deadline", fmtDateTime(F(ev.mail_ballot_request_deadline).v), F(ev.mail_ballot_request_deadline)],
      ["Poll hours", fmtTimeRange(F(ev.poll_hours).v), F(ev.poll_hours)]
    ];
    var items = rows.filter(function (r) { return r[1]; }).map(function (r) {
      return '<li><strong>' + esc(r[0]) + ":</strong> " + esc(r[1]) + confTag(r[2]) + "</li>";
    }).join("");
    return items ? '<div class="election-facts"><ul>' + items + "</ul></div>" : "";
  }

  function renderBallot(payload, q, mount) {
    var data = payload.data;
    var sel = loadSelection();
    var paramDistrict = (q.get("district") || "").trim().toUpperCase();
    if (paramDistrict) sel = { congressional: paramDistrict, state_senate: sel.state_senate, state_house: sel.state_house };

    var ev = data.election_event || {};
    var evName = F(ev.name).v || "Pennsylvania General Election";
    var evDate = fmtDate(F(ev.date).v) || F(ev.date).v || "";
    var refreshed = data.generated_at || "";

    var html = '<div class="election-head"><h1>' + esc(evName) + "</h1>" +
      '<p class="meta">' + esc(evDate) + " &middot; Philadelphia, PA</p>" +
      (refreshed ? '<p class="meta">Data refreshed ' + esc(refreshed) + "</p>" : "") + "</div>";

    if (payload.provisional) {
      html += '<div class="banner" role="alert"><strong>Provisional data.</strong>' +
        "The verified election dataset isn't published yet, so this page is showing sample data. " +
        "Candidate slates and facts are unconfirmed — verify with your official sample ballot at " +
        '<a href="https://vote.phila.gov/">vote.phila.gov</a>.</div>';
    }

    html += electionStrip(data);

    // Filter bar: what we're showing + change-districts link.
    var selBits = DISTRICT_TYPES.map(function (t) { return sel[t] ? esc(sel[t]) : typeLabel(t) + " —"; });
    if (!selectionHasAny(sel)) {
      html += '<div class="banner" role="alert"><strong>No districts selected.</strong>' +
        "Showing every race in the dataset. <a href=\"district-picker.html\">Pick your districts</a> " +
        "for your exact ballot.</div>";
    } else {
      html += '<p class="filter-bar">Showing districts: <strong>' + selBits.join("</strong> &middot; <strong>") +
        '</strong> &middot; <a href="district-picker.html">Change districts</a></p>';
      if (paramDistrict) {
        html += '<p class="hint">District ' + esc(paramDistrict) + " from link — it isn't saved. " +
          '<a href="district-picker.html">Save your districts</a> to keep this view.</p>';
      }
    }

    // Bucket contests into the standard groups, applying the district filter.
    var groups = {};
    GROUP_ORDER.forEach(function (g) { groups[g] = []; });
    var filtered = 0;
    (data.contests || []).forEach(function (c) {
      var district = c.district_ocd_id ? districtByOcd(data, c.district_ocd_id) : null;
      var t = district ? district.district_type : null;
      if (t && DISTRICT_TYPES.indexOf(t) >= 0) {
        var code = parseOcd(c.district_ocd_id).short;
        if (sel[t]) {
          if (code !== sel[t]) { filtered++; return; } // wrong district: never show
        } else {
          c = Object.assign({}, c); c._districtUnconfirmed = true;
        }
      }
      groups[contestGroup(c, district)].push({ contest: c, district: district });
    });

    var firstOpenDone = false;
    GROUP_ORDER.forEach(function (g) {
      var items = groups[g] || [];
      html += '<h2 class="level-title">' + esc(g) +
        (GROUP_SUB[g] ? ' <span class="group-sub">' + esc(GROUP_SUB[g]) + "</span>" : "") + "</h2>";
      if (g === "Ballot Questions") {
        var measures = data.measures || data.ballot_measures || [];
        if (!measures.length) {
          html += '<p class="unverified-note">No verified information available for this section yet.' + unconfBadge() + "</p>";
        } else {
          measures.forEach(function (m) { html += measureHtml(m); });
        }
        return;
      }
      if (!items.length) {
        html += '<p class="unverified-note">No verified information available for this section yet.' + unconfBadge() + "</p>";
        return;
      }
      items.forEach(function (it) {
        var open = !firstOpenDone;
        firstOpenDone = true;
        html += contestHtml(it.contest, data, open);
      });
    });

    if (filtered) {
      html += '<p class="fineprint" style="margin-top:18px">' + filtered +
        " race" + (filtered === 1 ? "" : "s") + " outside your selected districts hidden.</p>";
    }
    var gaps = (data.meta && data.meta.known_gaps) || [];
    if (gaps.length) {
      html += '<div class="demo-note"><strong>Known data gaps:</strong><ul>' +
        gaps.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ul></div>";
    }

    mount.innerHTML = html;
  }

  /* ================= page inits ================= */

  function initHome() {
    var form = document.getElementById("lookup-form");
    if (!form) return;
    var notice = document.getElementById("lookup-notice");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var street = document.getElementById("street").value.trim();
      var zip = document.getElementById("zip").value.trim();
      if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        document.getElementById("zip-error").hidden = false;
        return;
      }
      document.getElementById("zip-error").hidden = true;
      if (street || /-\d{4}$/.test(zip)) {
        // Exact address / ZIP+4 lookup needs the Google Civic API key, which isn't
        // configured. Never produce a ballot from an address we can't resolve.
        if (notice) {
          notice.hidden = false;
          notice.innerHTML = "<strong>Exact address lookup isn't connected yet.</strong> " +
            "It needs a Google Civic API key, which we don't have. " +
            'Use the <a href="district-picker.html' +
            (zip ? "?zip=" + encodeURIComponent(zip) : "") +
            '">manual district picker</a> to choose your districts yourself — ' +
            "we'd rather show you the picker than risk the wrong ballot.";
          notice.scrollIntoView({ block: "nearest" });
        }
        return;
      }
      window.location.href = "district-picker.html?zip=" + encodeURIComponent(zip);
    });
  }

  function districtOptions(data, type) {
    return (data.districts || []).filter(function (d) { return d.district_type === type; })
      .map(function (d) {
        var code = parseOcd(d.ocd_id);
        return { ocd: d.ocd_id, code: code.short || code.type, name: districtName(d), conf: F(d.name).c };
      })
      .sort(function (a, b) { return (a.code || "").localeCompare(b.code || ""); });
  }

  function initPicker() {
    var form = document.getElementById("picker-form");
    if (!form) return;
    var q = new URLSearchParams(window.location.search);
    var zip = (q.get("zip") || "").trim();
    var zipEl = document.getElementById("picker-zip");
    if (zipEl) zipEl.textContent = zip || "—";

    var sel = loadSelection();

    loadDataset().then(function (payload) {
      var data = payload.data;
      var mount = document.getElementById("picker-selects");
      var rows = DISTRICT_TYPES.map(function (t) {
        var opts = districtOptions(data, t);
        var cur = sel[t];
        if (!opts.length) {
          return '<div class="picker-row"><label>' + esc(typeLabel(t)) + "</label>" +
            '<p class="unverified-note">Not in the dataset yet — coverage coming.' + unconfBadge() + "</p></div>";
        }
        var options = '<option value="">— choose —</option>' + opts.map(function (o) {
          return '<option value="' + esc(o.code) + '"' + (o.code === cur ? " selected" : "") + ">" +
            esc(o.code + " — " + (o.name || "")) + "</option>";
        }).join("");
        return '<div class="picker-row"><label for="sel-' + t + '">' + esc(typeLabel(t)) +
          ' <span class="hint">(' + opts.length + " in dataset)</span></label>" +
          '<select id="sel-' + t + '" name="' + t + '">' + options + "</select></div>";
      }).join("");
      mount.innerHTML = rows +
        (payload.provisional ? '<p class="hint">District list from provisional sample data.' + unconfBadge() + "</p>" : "");

      var addrNote = document.getElementById("addr-note");
      if (addrNote) addrNote.hidden = false;
    }).catch(function () {
      document.getElementById("picker-selects").innerHTML =
        '<div class="banner"><strong>Couldn\'t load district data.</strong>Check your connection and try again.</div>';
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var next = { congressional: null, state_senate: null, state_house: null };
      DISTRICT_TYPES.forEach(function (t) {
        var el = document.getElementById("sel-" + t);
        if (el && el.value) next[t] = el.value;
      });
      if (!selectionHasAny(next)) {
        var err = document.getElementById("picker-error");
        if (err) { err.hidden = false; err.scrollIntoView({ block: "nearest" }); }
        return;
      }
      saveSelection(next);
      window.location.href = "ballot.html";
    });
  }

  function initBallot() {
    var q = new URLSearchParams(window.location.search);
    var mount = document.getElementById("ballot-mount");
    if (!mount) return;
    loadDataset()
      .then(function (payload) { renderBallot(payload, q, mount); })
      .catch(function () {
        mount.innerHTML = '<div class="banner"><strong>Couldn\'t load ballot data.</strong>' +
          "Please check your connection and try again.</div>";
      });
  }

  /* ================= boot ================= */

  document.addEventListener("DOMContentLoaded", function () {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    var page = document.body.getAttribute("data-page");
    if (page === "home") initHome();
    if (page === "picker") initPicker();
    if (page === "ballot") initBallot();

    if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  });
})();
