/* What's On My Ballot — shared app logic (vanilla JS, no build step) */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function params() { return new URLSearchParams(window.location.search); }

  /* Demo ZIP -> districts map (replaced by real geocoding in production).
     19143 genuinely spans PA-03 and PA-05 — the reason ZIP-only is unsafe. */
  var DEMO_ZIP_DISTRICTS = {
    "19143": [
      { short: "PA-03", name: "Pennsylvania's 3rd Congressional District", desc: "West & Southwest Philadelphia (parts)" },
      { short: "PA-05", name: "Pennsylvania's 5th Congressional District", desc: "Southwest Philadelphia (parts)" }
    ],
    "19104": [
      { short: "PA-03", name: "Pennsylvania's 3rd Congressional District", desc: "University City, West Philadelphia" }
    ],
    "19106": [
      { short: "PA-02", name: "Pennsylvania's 2nd Congressional District", desc: "Society Hill, Old City, Washington Square" }
    ]
  };
  var ALL_DEMO_DISTRICTS = [
    { short: "PA-02", name: "Pennsylvania's 2nd Congressional District", desc: "Northeast & parts of Center City Philadelphia" },
    { short: "PA-03", name: "Pennsylvania's 3rd Congressional District", desc: "West & Northwest Philadelphia" },
    { short: "PA-05", name: "Pennsylvania's 5th Congressional District", desc: "Southwest Philadelphia & Delaware County" }
  ];

  function tag(conf) {
    if (conf === "verified") return ' <span class="tag verified">verified</span>';
    if (conf === "unverified") return ' <span class="tag">unverified</span>';
    return "";
  }

  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
  }

  /* ---------- candidate card (IDENTICAL layout for every candidate) ---------- */
  function candidateCard(c, contest) {
    var photo = c.photo_url
      ? '<img class="photo" src="' + esc(c.photo_url) + '" alt="Photo of ' + esc(c.name) + '">'
      : '<div class="photo" role="img" aria-label="No photo available">' + esc(initials(c.name)) + "</div>";

    var bio = c.bio
      ? "<p>" + esc(c.bio) + tag(c.bio_confidence) + "</p>"
      : '<p class="unverified-note">No verified biography available yet.' + tag("unverified") + "</p>";

    var contact = c.contact && (c.contact.website || c.contact.phone || c.contact.email)
      ? "<ul>" +
        (c.contact.website ? '<li>Website: <a href="' + esc(c.contact.website) + '" rel="noopener">' + esc(c.contact.website.replace(/^https?:\/\//, "")) + "</a></li>" : "") +
        (c.contact.phone ? "<li>Phone: " + esc(c.contact.phone) + "</li>" : "") +
        (c.contact.email ? '<li>Email: <a href="mailto:' + esc(c.contact.email) + '">' + esc(c.contact.email) + "</a></li>" : "") +
        "</ul>" + tag(c.contact_confidence)
      : '<p class="unverified-note">No verified contact information available yet.' + tag("unverified") + "</p>";

    var votes = (c.key_votes && c.key_votes.length)
      ? "<ul>" + c.key_votes.map(function (v) {
          return "<li><strong>" + esc(v.bill) + ":</strong> " + esc(v.position) +
            (v.source_url ? ' <a href="' + esc(v.source_url) + '" rel="noopener">source</a>' : "") + "</li>";
        }).join("") + "</ul>" + tag(c.key_votes_confidence)
      : '<p class="unverified-note">No verified voting record available yet.' + tag("unverified") + "</p>";

    var platform = (c.platform_quotes && c.platform_quotes.length)
      ? c.platform_quotes.map(function (q) {
          return "<blockquote>&ldquo;" + esc(q.quote) + "&rdquo;" +
            (q.source_url ? ' <a href="' + esc(q.source_url) + '" rel="noopener">source</a>' : "") + "</blockquote>";
        }).join("") + "<p class=\"fineprint\">In the candidate's own words, quoted from their published materials." + tag(c.platform_confidence) + "</p>"
      : '<p class="unverified-note">No verified platform statements available yet.' + tag("unverified") + "</p>";

    var sources = (c.sources && c.sources.length)
      ? '<ul class="sources">' + c.sources.map(function (s) {
          return '<li><a href="' + esc(s.url) + '" rel="noopener">' + esc(s.label || s.url) + "</a></li>";
        }).join("") + "</ul>" + tag(c.sources_confidence)
      : '<p class="unverified-note">No verified sources on file yet.' + tag("unverified") + "</p>";

    return (
      '<article class="candidate" id="cand-' + esc(c.id) + '">' +
        '<div class="cand-head">' + photo +
          "<div><h3>" + esc(c.name) + "</h3>" +
          '<p class="cand-office">' + esc(contest.office) + " &middot; " + esc(contest.district) + "</p>" +
          '<span class="party">' + esc(c.party) + "</span></div>" +
        "</div>" +
        '<div class="cand-section"><h4>Bio</h4>' + bio + "</div>" +
        '<div class="cand-section"><h4>Contact</h4>' + contact + "</div>" +
        '<div class="cand-section"><h4>Key votes</h4>' + votes + "</div>" +
        '<div class="cand-section"><h4>Running on</h4>' + platform + "</div>" +
        '<div class="cand-section"><h4>Sources</h4>' + sources + "</div>" +
      "</article>"
    );
  }

  /* ---------- page inits ---------- */
  function initHome() {
    var form = document.getElementById("lookup-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var street = document.getElementById("street").value.trim();
      var zip = document.getElementById("zip").value.trim();
      if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        document.getElementById("zip-error").hidden = false;
        return;
      }
      document.getElementById("zip-error").hidden = true;
      if (street) {
        // Full address: exact ballot in production. Demo shows all Philly federal races.
        window.location.href = "ballot.html?mode=address&zip=" + encodeURIComponent(zip);
      } else {
        window.location.href = "district-picker.html?zip=" + encodeURIComponent(zip);
      }
    });
  }

  function initPicker() {
    var q = params();
    var zip = (q.get("zip") || "").trim();
    var zipEl = document.getElementById("picker-zip");
    if (zipEl) zipEl.textContent = zip || "—";
    var base = zip.split("-")[0];
    var options = DEMO_ZIP_DISTRICTS[base] || ALL_DEMO_DISTRICTS;
    var list = document.getElementById("district-list");
    var narrowed = DEMO_ZIP_DISTRICTS[base] ? true : false;

    list.innerHTML = options.map(function (d, i) {
      return '<label class="district-option">' +
        '<input type="radio" name="district" value="' + esc(d.short) + '"' + (i === 0 ? " checked" : "") + "> " +
        '<span class="d-name">' + esc(d.name) + "</span>" +
        '<p class="d-desc">' + esc(d.desc) + "</p></label>";
    }).join("");

    var note = document.getElementById("picker-note");
    if (note) {
      note.innerHTML = narrowed
        ? "Your ZIP code touches <strong>" + options.length + " congressional districts</strong>. Pick yours to see the right ballot."
        : "We couldn't narrow this ZIP code to specific districts, so we're showing every district that touches Philadelphia. Pick yours — or better, go back and enter your full street address for an exact match.";
    }

    document.getElementById("picker-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var chosen = document.querySelector('input[name="district"]:checked').value;
      window.location.href = "ballot.html?district=" + encodeURIComponent(chosen) +
        "&unconfirmed=1&zip=" + encodeURIComponent(zip);
    });
  }

  function initBallot() {
    var q = params();
    var mount = document.getElementById("ballot-mount");
    if (!mount) return;

    fetch("sample-ballot.json")
      .then(function (r) { if (!r.ok) throw new Error("data load failed"); return r.json(); })
      .then(function (data) { renderBallot(data, q, mount); })
      .catch(function () {
        mount.innerHTML = '<div class="banner"><strong>Couldn\'t load ballot data.</strong>Please check your connection and try again.</div>';
      });
  }

  function renderBallot(data, q, mount) {
    var district = q.get("district");
    var unconfirmed = q.get("unconfirmed") === "1";
    var mode = q.get("mode");

    var html = '<div class="election-head"><h1>' + esc(data.election.name) + "</h1>" +
      '<p class="meta">' + esc(data.election.date_display) + " &middot; Philadelphia, PA</p>" +
      '<p class="meta">Data refreshed ' + esc(data.election.data_refreshed) + " &middot; " + esc(data.election.data_note) + "</p></div>";

    if (unconfirmed) {
      html += '<div class="banner" role="alert"><strong>District unconfirmed.</strong>' +
        "You entered a ZIP code only, and ZIP codes can cross district lines — so this ballot may not be yours. " +
        "Confirm your district with the official <a href=\"https://www.pavoterservices.pa.gov/\">PA voter services lookup</a>, " +
        "or <a href=\"index.html\">enter your full address</a> for an exact match.</div>";
    }
    if (mode === "address") {
      html += '<div class="demo-note"><strong>Demo mode:</strong> live address lookup isn\'t connected yet, so we\'re showing every Philadelphia federal race. ' +
        "In production, your full address resolves to your exact district.</div>";
    }

    var levels = ["Federal", "State", "Local"];
    var contests = data.contests.filter(function (c) {
      if (district && c.district_short && c.district_short !== district) return false;
      return true;
    });

    levels.forEach(function (level, li) {
      var inLevel = contests.filter(function (c) { return c.level === level; });
      html += '<h2 class="level-title">' + esc(level) + "</h2>";
      if (!inLevel.length) {
        html += '<p class="unverified-note">No ' + esc(level.toLowerCase()) +
          ' races in this sample file yet — the data pipeline will add them.</p>';
        return;
      }
      inLevel.forEach(function (c, i) {
        html += '<details class="contest"' + (i === 0 && li === 0 ? " open" : "") + ">" +
          "<summary><span>" + esc(c.office) + '<span class="c-dist">' + esc(c.district) + "</span></span>" +
          '<span class="chev" aria-hidden="true">&#9660;</span></summary>' +
          '<div class="contest-body">' +
          c.candidates.map(function (cand) { return candidateCard(cand, c); }).join("") +
          "</div></details>";
      });
    });

    mount.innerHTML = html;
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    var page = document.body.getAttribute("data-page");
    if (page === "home") initHome();
    if (page === "picker") initPicker();
    if (page === "ballot") initBallot();

    // PWA service worker (only on https / localhost)
    if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  });
})();
