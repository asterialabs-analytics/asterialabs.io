(function () {
  "use strict";
  var canvas = document.getElementById("constellation");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var cs = getComputedStyle(document.documentElement);
  var SAGE = cs.getPropertyValue("--sage").trim() || "#97afa3";
  var GOLD = cs.getPropertyValue("--gold").trim() || "#c68a45";
  var LINK = 140, POINTER = 170;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var w, h, dpr, stars = [], pointer = null;

  function make() {
    var n = Math.min(90, Math.max(24, Math.round(w * h / 15000)));
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: 1 + Math.random() * 1.4, gold: Math.random() < 0.1
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    make();
    draw();
  }

  function line(x1, y1, x2, y2, a, color) {
    ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var i, j, a, b, dx, dy, d;
    for (i = 0; i < stars.length; i++) {
      a = stars[i];
      for (j = i + 1; j < stars.length; j++) {
        b = stars[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) line(a.x, a.y, b.x, b.y, (1 - d / LINK) * 0.32, SAGE);
      }
      if (pointer) {
        dx = a.x - pointer.x; dy = a.y - pointer.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < POINTER) line(a.x, a.y, pointer.x, pointer.y, (1 - d / POINTER) * 0.5, GOLD);
      }
    }
    for (i = 0; i < stars.length; i++) {
      a = stars[i];
      ctx.globalAlpha = a.gold ? 0.9 : 0.55;
      ctx.fillStyle = a.gold ? GOLD : SAGE;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.gold ? a.r + 0.6 : a.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function step() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx; s.y += s.vy;
      if (s.x < -10) s.x = w + 10; else if (s.x > w + 10) s.x = -10;
      if (s.y < -10) s.y = h + 10; else if (s.y > h + 10) s.y = -10;
    }
    draw();
    requestAnimationFrame(step);
  }

  var timer;
  window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(resize, 150); });
  if (!reduce) {
    window.addEventListener("pointermove", function (e) { pointer = { x: e.clientX, y: e.clientY }; });
    document.addEventListener("pointerleave", function () { pointer = null; });
  }
  resize();
  if (!reduce) requestAnimationFrame(step);
})();
