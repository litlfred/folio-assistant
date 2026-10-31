/* Links to a layer at its pin, resolved from pins.json (cat-harness-tools scripts/lib/pin-links.ts). */
function faPinnedHref(href, key, pins) {
  var ref = pins[key];
  if (!ref || !/^[0-9a-f]{7,40}$/.test(ref)) return href;
  return href.replace(/^(https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/)HEAD(?=\/|$)/, "$1" + ref);
}
(function () {
  if (typeof document === "undefined") return;
  var s = document.currentScript || document.querySelector("script[data-fa-pins]");
  var src = s && s.getAttribute("data-fa-pins");
  if (!src || !window.fetch) return;
  fetch(src, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (pins) {
    var els = document.querySelectorAll("[data-fa-pin]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i], attr = el.hasAttribute("href") ? "href" : "src", v = el.getAttribute(attr);
      if (v) el.setAttribute(attr, faPinnedHref(v, el.getAttribute("data-fa-pin"), pins));
    }
  }).catch(function () {});
})();
