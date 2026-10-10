(function () {
  "use strict";

  /* ---------- Team placeholders ---------- */
  var silhouette = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
  document.querySelectorAll("[data-placeholders]").forEach(function (row) {
    row.getAttribute("data-placeholders").split("|").forEach(function (title) {
      var m = document.createElement("div");
      m.className = "member";
      m.innerHTML = '<div class="member__img">' + silhouette + "</div><h3>Name Surname</h3><p>" + title + "</p>";
      row.appendChild(m);
    });
  });

  /* ---------- Charts (plain SVG, no libraries) ---------- */
  var NS = "http://www.w3.org/2000/svg";
  var cs = getComputedStyle(document.documentElement);
  function v(n) { return cs.getPropertyValue(n).trim(); }
  var C = { ink: v("--ink"), deep: v("--sage-deep"), sage: v("--sage"), gold: v("--gold"), line: v("--line"), faint: v("--ink-faint") };

  function el(n, a, p) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }
  function txt(p, x, y, t, anchor) {
    var e = el("text", { x: x, y: y, "text-anchor": anchor || "start", "font-size": 11, fill: C.faint, "font-family": "DM Mono, monospace" }, p);
    e.textContent = t;
  }
  function lin(d0, d1, r0, r1) { return function (x) { return r0 + (x - d0) / (d1 - d0) * (r1 - r0); }; }
  function path(p, pts, attrs, close) {
    attrs.d = pts.map(function (q, i) { return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + (close ? "Z" : "");
    if (!attrs.fill) attrs.fill = "none";
    return el("path", attrs, p);
  }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function setup(id, W, H) {
    var s = document.getElementById(id);
    s.setAttribute("viewBox", "0 0 " + W + " " + H);
    return s;
  }
  function axes(s, W, H, m, sx, sy, xt, yt, fx, fy) {
    yt.forEach(function (t) {
      var y = sy(t);
      el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: C.line }, s);
      txt(s, m.l - 8, y + 4, fy ? fy(t) : t, "end");
    });
    xt.forEach(function (t) { txt(s, sx(t), H - m.b + 18, fx ? fx(t) : t, "middle"); });
    el("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, stroke: C.faint }, s);
  }
  var W = 520, H = 300, m = { l: 44, r: 14, t: 14, b: 36 };

  /* 1. forecast */
  (function () {
    var s = setup("c-forecast", W, H), r = rng(7), N = 52, cut = 38;
    var sx = lin(0, N - 1, m.l, W - m.r), sy = lin(80, 170, H - m.b, m.t);
    function trend(i) { return 100 + i * 0.9 + 14 * Math.sin(i / 52 * Math.PI * 4); }
    axes(s, W, H, m, sx, sy, [0, 13, 26, 39, 51], [80, 110, 140, 170], function (t) { return "W" + (t + 1); });
    var up = [], lo = [], fc = [], act = [], i;
    for (i = cut; i < N; i++) {
      var w = 4 + (i - cut) * 1.3;
      up.push([sx(i), sy(trend(i) + w)]); lo.push([sx(i), sy(trend(i) - w)]); fc.push([sx(i), sy(trend(i))]);
    }
    path(s, up.concat(lo.reverse()), { fill: C.sage, opacity: 0.35, stroke: "none" }, true);
    for (i = 0; i <= cut; i++) act.push([sx(i), sy(trend(i) + (r() - 0.5) * 10)]);
    path(s, act, { stroke: C.ink, "stroke-width": 1.8, "stroke-linejoin": "round" });
    path(s, fc, { stroke: C.gold, "stroke-width": 2, "stroke-dasharray": "5 4" });
  })();

  /* 2. feature importance */
  (function () {
    var s = setup("c-features", W, H), ml = 120;
    var data = [["Days since last order", 0.31], ["Average order value", 0.22], ["Account tenure", 0.17], ["Support tickets", 0.12], ["Region", 0.10], ["Channel", 0.08]];
    var sx = lin(0, 0.35, ml, W - 40), band = (H - 40) / data.length;
    [0, 0.1, 0.2, 0.3].forEach(function (t) {
      el("line", { x1: sx(t), x2: sx(t), y1: 8, y2: H - 28, stroke: C.line }, s);
      txt(s, sx(t), H - 10, t.toFixed(1), "middle");
    });
    data.forEach(function (d, i) {
      var y = 12 + i * band;
      txt(s, ml - 8, y + band * 0.5 + 1, d[0], "end");
      el("rect", { x: ml, y: y + 6, width: sx(d[1]) - ml, height: band - 16, rx: 3, fill: i === 0 ? C.gold : C.deep }, s);
      txt(s, sx(d[1]) + 6, y + band * 0.5 + 1, d[1].toFixed(2));
    });
  })();

  /* 3. scatter + least squares */
  (function () {
    var s = setup("c-scatter", W, H), r = rng(21), xs = [], ys = [], n = 70, i;
    for (i = 0; i < n; i++) { var x = r() * 10; xs.push(x); ys.push(2 + 0.8 * x + (r() + r() + r() - 1.5) * 2.2); }
    var mx = xs.reduce(function (a, b) { return a + b; }) / n, my = ys.reduce(function (a, b) { return a + b; }) / n, sxy = 0, sxx = 0, ssr = 0, sst = 0;
    for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    var b1 = sxy / sxx, b0 = my - b1 * mx;
    for (i = 0; i < n; i++) { ssr += Math.pow(ys[i] - (b0 + b1 * xs[i]), 2); sst += Math.pow(ys[i] - my, 2); }
    var sx = lin(0, 10, m.l, W - m.r), sy = lin(0, 12, H - m.b, m.t);
    axes(s, W, H, m, sx, sy, [0, 2, 4, 6, 8, 10], [0, 4, 8, 12]);
    for (i = 0; i < n; i++) el("circle", { cx: sx(xs[i]), cy: sy(ys[i]), r: 3.6, fill: C.deep, opacity: 0.65 }, s);
    path(s, [[sx(0), sy(b0)], [sx(10), sy(b0 + b1 * 10)]], { stroke: C.gold, "stroke-width": 2 });
    document.getElementById("c-scatter-cap").textContent = "Least-squares fit, R² = " + (1 - ssr / sst).toFixed(2) + ".";
  })();

  /* 4. ROC */
  (function () {
    var s = setup("c-roc", W, H), k = 7, pts = [], auc = 0, prev = 0, i;
    var sx = lin(0, 1, m.l + 20, W - m.r - 20), sy = lin(0, 1, H - m.b, m.t);
    axes(s, W, H, m, sx, sy, [0, 0.5, 1], [0, 0.5, 1]);
    for (i = 0; i <= 50; i++) {
      var f = i / 50, t = 1 - Math.pow(1 - f, k);
      pts.push([sx(f), sy(t)]);
      if (i) auc += (t + prev) / 2 * 0.02;
      prev = t;
    }
    path(s, [[sx(0), sy(0)], [sx(1), sy(1)]], { stroke: C.faint, "stroke-dasharray": "4 4" });
    path(s, pts.concat([[sx(1), sy(0)]]), { fill: C.sage, opacity: 0.3, stroke: "none" }, true);
    path(s, pts, { stroke: C.deep, "stroke-width": 2.2 });
    txt(s, sx(0.55), sy(0.3), "AUC " + auc.toFixed(2), "start");
    document.getElementById("c-roc-cap").textContent = "True positive rate against false positive rate, AUC " + auc.toFixed(2) + ".";
  })();

  /* ---------- Contact form ----------
     TODO: replace the body of the submit handler with a real request
     (e.g. fetch() to a Django endpoint, Formspree, or an AWS SES Lambda). */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var email = String(d.get("email") || "");
      if (!String(d.get("name") || "").trim() || !/^\S+@\S+\.\S+$/.test(email) || !String(d.get("message") || "").trim()) {
        status.textContent = "Add your name, a valid email and a message, then send again.";
        return;
      }
      status.textContent = "Thanks, " + String(d.get("name")).trim() + ". We'll reply to " + email + ".";
      form.reset();
    });
  }
})();
