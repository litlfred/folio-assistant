// The DAK view pages' one script, published once at `assets/dak-view.js` and
// loaded by every `<Name>.schema.json.html` / `<Name>.jsonld.html` (bean `680p`:
// the page carries layout, the content is fetched from the graph).
//
// It shows the file as the Publisher's view page does: fetched, parsed and
// re-serialised with `JSON.stringify(parsed, null, 2)` — so JavaScript's key
// order (integer-like keys first) applies here exactly as it does there.
document.querySelectorAll("code[data-dak-src]").forEach(function (el) {
  fetch(el.getAttribute("data-dak-src"))
    .then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return r.json();
    })
    .then(function (d) {
      el.textContent = JSON.stringify(d, null, 2);
    })
    .catch(function (e) {
      el.textContent = "Could not load " + el.getAttribute("data-dak-src") + ": " + e.message;
    });
});
