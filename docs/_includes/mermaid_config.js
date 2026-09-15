/* Mermaid configuration for this docs site.

   just-the-docs interpolates this file's contents directly into
   `var config = <here>; mermaid.initialize(config);`
   — see that theme's `_includes/components/mermaid.html` — so this must be a
   bare JavaScript EXPRESSION. No `export`, no statements, no trailing
   semicolon.

   WHY IT IS NOT A LITERAL. Mermaid's DEFAULT theme is a light one: pale
   lilac node fills, near-black label text, thin grey connectors. On this
   site's dark background the nodes read as bright cards and the edges
   between them are close to invisible, which is the opposite of what a flow
   diagram is for. But the reader can now switch schemes from the header, so
   the right palette is not a build-time fact — it is whatever they last
   chose. This reads the same localStorage key the toggle writes
   (`docs/assets/js/docs-ui.js`, SCHEME_KEY).

   The earlier attempt put a white backdrop behind the diagram from
   docs-ui.css instead. That was the wrong layer twice over: it never
   applied, because the wrapper it styled was attached by a selector this
   theme does not emit; and even applied it makes a light card float in a
   dark page rather than making the drawing belong to it. Configuring the
   renderer is the fix; painting behind it was a workaround for not having
   done so. */
(function () {
  var scheme = null;
  try { scheme = window.localStorage.getItem("fa-color-scheme"); } catch (_e) { /* private mode */ }
  if (scheme !== "light" && scheme !== "dark") {
    /* No stored choice: fall back to what _config.yml compiled in. Read from
       the same JSON block docs-ui.js reads, so the two cannot disagree. */
    var node = document.getElementById("fa-site-scheme");
    try { scheme = node ? JSON.parse(node.textContent).scheme : "light"; }
    catch (_e) { scheme = "light"; }
  }
  return {
    /* Mermaid's own built-in palettes, so the contrast ratios inside a
       diagram are upstream's rather than something hand-tuned here that
       drifts the first time a diagram type we have not used yet appears. */
    theme: scheme === "dark" ? "dark" : "default",
    themeVariables: {
      /* The one value worth overriding: it is the only one that has to agree
         with a colour chosen outside Mermaid — just-the-docs' own page
         background for each scheme. */
      background: scheme === "dark" ? "#27262b" : "#ffffff"
    },
    /* Long swimlane labels wrap rather than forcing the diagram wider than
       the zoom controls can usefully bring back. */
    flowchart: { useMaxWidth: true }
  };
})()
