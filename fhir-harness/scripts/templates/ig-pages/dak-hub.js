// The DAK API hub page's loader, published once at `assets/dak-hub.js` (bean
// `680p`, `visualizer-loading`). It fetches the hub fragment the ingest held
// from the IG's `dak-api.html`, re-points each link through the map the
// generator computed (this site's page, the served file, or the Publisher's
// copy), and inserts it. Scripts in the fragment are not run; its own style is
// kept, since the hub's cards are styled by it.
(function () {
  var host = document.querySelector("[data-dak-hub-src]");
  if (!host) return;
  // PRINT AND PDF: the page prints what has loaded. Each loader counts itself
  // in and out, and the last one to finish marks <html data-kg-loaded> — the
  // signal a print or PDF step waits for (`visualizer-loading` §"Printing").
  var kg = (window.__kgLoads = window.__kgLoads || {
    pending: 0,
    done: function () {
      if (--this.pending === 0) document.documentElement.setAttribute("data-kg-loaded", "");
    },
  });
  kg.pending++;
  var links = {};
  try {
    links = JSON.parse(document.getElementById("dak-hub-links").textContent);
  } catch (_e) {
    // No map: links keep the Publisher's relative hrefs, which is visible rather than silent.
  }
  fetch(host.getAttribute("data-dak-hub-src"))
    .then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return r.json();
    })
    .then(function (node) {
      // The fragment is held as data ({ from, between, html }), not as a page.
      var html = node.html;
      var t = document.createElement("template");
      t.innerHTML = html;
      t.content.querySelectorAll("script").forEach(function (s) { s.remove(); });
      t.content.querySelectorAll("a[href]").forEach(function (a) {
        var h = a.getAttribute("href");
        if (Object.prototype.hasOwnProperty.call(links, h)) a.setAttribute("href", links[h]);
      });
      host.replaceChildren(t.content);
    })
    .catch(function (e) {
      host.textContent = "Could not load " + host.getAttribute("data-dak-hub-src") + ": " + e.message;
    })
    .finally(function () {
      kg.done();
    });
})();
