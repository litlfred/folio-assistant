import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "lean-render-publish",
    title: "Publish a Lean render under a folio site, with the harness rail",
    description:
      "Stage a doc-gen4 render under a folio's built site (`<site>/<route>/`, default `lean/`) and give every page the harness navbar and rail by running `cat-harness/scripts/rail-standalone-pages.ts --foreign-site` over the site — the same rail `stage-folio-local.ts` applies to the folio's own pages. Leaves out Lake's `.hash`/`.trace` bookkeeping, marks doc-gen4's iframe navbar and `find/` redirect `folio-navbar: none` so no rail is drawn inside the sidebar, adds a layout shim so the rail does not cover doc-gen4's fixed sidebar, and with `--modules` prunes to the folio's own modules, repointing links into dropped ones to the community docs. Then asserts every staged page is railed or declined.",
    install: { none: true },
    invoke: { shell: "bun run folio-assistant-sci/adapters/paper/lean/lean-render.ts" },
    io: {
      inputs: [
        { name: "docs", schema: t("RepoPath"), required: true, arg: { flag: "--docs" }, description: "The doc-gen4 render, `lean-html-docs`'s output." },
        { name: "site", schema: t("RepoPath"), required: true, arg: { flag: "--site" }, description: "The folio's built site (`_site` from build-folio-site.ts)." },
        { name: "route", schema: t("Slug"), required: false, arg: { flag: "--route" }, description: "Where under the site. Default `lean`." },
        { name: "module", schema: t("PackageName"), required: false, arg: { flag: "--module" }, description: "A Lake package whose module root to keep (`qou` keeps `QOU/`, matched case-insensitively). Repeat for several. Default: keep everything." },
        { name: "externalBase", schema: t("Url"), required: false, arg: { flag: "--external-base" }, description: "Where links into pruned modules go. Default the community mathlib4 docs." },
        { name: "homeLabel", schema: t("InstanceId"), required: false, arg: { flag: "--home-label" }, description: "The rail's home row: the folio's instance name, e.g. `qou`." },
        { name: "instance", schema: t("InstanceId"), required: false, arg: { flag: "--instance" }, description: "Rail as this instance's own site (its name, mark and graphs), as rail-standalone-pages.ts --instance." },
        { name: "platform", schema: t("RepoPath"), required: false, arg: { flag: "--platform" }, description: "The index checkout holding the rail pass. Default `$FOLIO_ASSISTANT_ROOT`, then the nearest ancestor that has it." },
        { name: "noRail", schema: t("Flag"), required: false, arg: { flag: "--no-rail" }, description: "Stage only; the caller rails the site itself." },
      ],
      outputs: [
        { name: "pages", schema: t("RepoPath"), description: "`<site>/<route>/`, railed, plus the rail's shared data under `<site>/assets/navbar/`." },
      ],
    },
    satisfies: ["lean-html-docs"],
    requires: { runtime: ["bun"], network: false },
    selection: {
      when: "After the folio's site is built and before it is checked and published (`stage-folio-local.ts` step 2 runs the same rail): put the Lean render into it as the `lean` directory's visualiser.",
      limits:
        "Pruned links point at the community docs, built from THEIR Mathlib rather than the folio's pin; doc-gen4's search index still lists pruned declarations, whose hits 404. The rail's assets load from the platform's published site, as on every foreign-site page.",
      cost: "Measured on qou's July render: pruned to QOU,UGB,Fred2005 34 pages / 29 MB / about 5 s; unpruned 4,193 pages / 533 MB / 347 s.",
    },
  }),
);
