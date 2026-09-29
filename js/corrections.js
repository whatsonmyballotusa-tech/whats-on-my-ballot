/* What's On My Ballot — corrections reporting (no backend).
 *
 * Self-contained module. The frontend crew wires this into corrections.html by:
 *   1. including <script src="js/corrections.js"></script>,
 *   2. calling WOMB_Corrections.init({ formId: "correction-form", ... })
 *      once the form DOM exists.
 *
 * Mechanism:
 *   - buildCorrectionReport(formData) -> structured correction JSON
 *     (schema "correction-report/1", see data-pipeline/CORRECTIONS.md)
 *   - queueReport(report) -> persists to localStorage ("womb_correction_queue")
 *     so a report survives a reload/failed mail client and can be retried.
 *   - sendReport(report) -> opens mailto:whatsonmyballotusa@gmail.com with
 *     subject "Ballot correction: {race}" and the JSON prefilled in the body.
 *   - markSent(reportId) -> removes the report from the queue once the mail
 *     client opened (we can't detect actual sending without a backend, so the
 *     queue keeps a copy until the user confirms or dismisses it).
 */
(function () {
  "use strict";

  var DEST_EMAIL = "whatsonmyballotusa@gmail.com";
  var QUEUE_KEY = "womb_correction_queue";
  var REPORT_SCHEMA = "correction-report/1";

  /* ---------- report id + timestamp helpers ---------- */
  function makeReportId() {
    var d = new Date();
    var stamp = d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    var rand = Math.random().toString(36).slice(2, 8);
    return "corr-" + stamp + "-" + rand;
  }

  function isoLocal(date) {
    // ISO 8601 with local offset, e.g. 2026-09-28T13:45:00-04:00
    var off = -date.getTimezoneOffset();
    var sign = off >= 0 ? "+" : "-";
    var pad = function (n) { return String(Math.abs(n)).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" +
      pad(date.getDate()) + "T" + pad(date.getHours()) + ":" +
      pad(date.getMinutes()) + ":" + pad(date.getSeconds()) +
      sign + pad(Math.floor(Math.abs(off) / 60)) + ":" + pad(Math.abs(off) % 60);
  }

  /* ---------- build the structured report ----------
   * formData: plain object with the form fields:
   *   name, email, relationship, entityType, entityId, field,
   *   currentValue, kind, proposedValue, reason, evidenceUrl1, evidenceUrl2
   */
  function buildCorrectionReport(formData) {
    var evidence = [];
    [["evidenceUrl1", "reporter-supplied source"],
     ["evidenceUrl2", "reporter-supplied source"]].forEach(function (pair) {
      var url = (formData[pair[0]] || "").trim();
      if (url) evidence.push({ url: url, note: pair[1] });
    });

    var race = (formData.entityId || "").trim() || "general";

    return {
      report_id: makeReportId(),
      schema: REPORT_SCHEMA,
      submitted_at: isoLocal(new Date()),
      reporter: {
        name: (formData.name || "").trim(),
        email: (formData.email || "").trim(),
        relationship: formData.relationship || "voter"
      },
      target: {
        entity_type: formData.entityType || "candidate",
        entity_id: race,
        field: (formData.field || "").trim(),
        current_value: (formData.currentValue || "").trim()
      },
      correction: {
        kind: formData.kind || "factual_error",
        proposed_value: (formData.proposedValue || "").trim(),
        reason: (formData.reason || "").trim()
      },
      evidence: evidence,
      status: "submitted",
      // convenience for the mailto subject line
      _race: race
    };
  }

  /* ---------- localStorage queue ---------- */
  function loadQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveQueue(queue) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      // storage full or blocked — the mailto still carries the report
    }
  }

  function queueReport(report) {
    var q = loadQueue();
    q.push(report);
    saveQueue(q);
    return q.length;
  }

  function markSent(reportId) {
    saveQueue(loadQueue().filter(function (r) { return r.report_id !== reportId; }));
  }

  function pendingReports() {
    return loadQueue();
  }

  /* ---------- mailto send ---------- */
  function sendReport(report) {
    var subject = "Ballot correction: " + (report._race || "general");
    var clean = JSON.parse(JSON.stringify(report));
    delete clean._race;
    var body =
      "What's On My Ballot — correction report (structured JSON below).\n\n" +
      "Reporter: " + report.reporter.name + " <" + report.reporter.email + ">\n" +
      "Relationship: " + report.reporter.relationship + "\n\n" +
      "--- correction-report/1 ---\n" +
      JSON.stringify(clean, null, 2);

    var mailto = "mailto:" + DEST_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    window.location.href = mailto;
  }

  /* ---------- form wiring ---------- */
  function init(options) {
    options = options || {};
    var form = document.getElementById(options.formId || "correction-form");
    var statusEl = options.statusId ? document.getElementById(options.statusId) : null;
    if (!form) return;

    function show(msg, ok) {
      if (statusEl) {
        statusEl.textContent = msg;
        statusEl.setAttribute("data-ok", ok ? "1" : "0");
      }
    }

    // surface any unsent queued reports (e.g. mail client failed last time)
    var pending = pendingReports();
    if (pending.length && statusEl) {
      show("You have " + pending.length + " unsent report(s) saved on this device. " +
           "Submitting again will re-open your email app.", false);
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) { data[k] = v; });

      if (!data.proposedValue || !(data.proposedValue + "").trim()) {
        show("Please describe the correction (what should it say?).", false);
        return;
      }

      var report = buildCorrectionReport(data);
      queueReport(report);
      sendReport(report);
      show("Your email app should now open with the report prefilled. " +
           "Your report is also saved on this device (id " + report.report_id + ") " +
           "in case the email didn't go through.", true);
      // keep the report queued until the user confirms sent; expose markSent
      // so the frontend crew can add a "I sent it" button calling:
      //   WOMB_Corrections.markSent("<report_id>")
      form.reset();
    });
  }

  // Public API for the frontend crew
  window.WOMB_Corrections = {
    init: init,
    buildCorrectionReport: buildCorrectionReport,
    queueReport: queueReport,
    pendingReports: pendingReports,
    markSent: markSent,
    sendReport: sendReport,
    destEmail: DEST_EMAIL
  };
})();
