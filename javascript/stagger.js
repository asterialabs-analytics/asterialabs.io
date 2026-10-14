(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var groups = document.querySelectorAll("[data-stagger]");
  if (!groups.length) return;

  // Number each group's items 0, 1, 2 … so CSS can turn that into a delay.
  groups.forEach(function (group) {
    var sel = group.getAttribute("data-stagger-items");
    var items = sel ? group.querySelectorAll(sel) : group.children;
    Array.prototype.forEach.call(items, function (item, i) {
      item.classList.add("stagger-item");
      item.style.setProperty("--i", i);
    });
  });

  // Start a group's animation when it scrolls into view.
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    groups.forEach(function (g) { io.observe(g); });
  } else {
    groups.forEach(function (g) { g.classList.add("is-visible"); });
  }
})();
