import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "lean-kg-publish",
    title: "Publish the dynamic Lean viewer: doc-gen4 declaration data as knowledge-graph shards",
    description:
      "Ingest doc-gen4's per-module declaration data (`.lake/build/doc-data/declaration-data-<Module>.bmp`) into JSON-LD shards — one per module, with declaration nodes, `imports` edges and `formalizes` edges to the content blocks whose `lean.ref` names each declaration — and publish them under the folio's site with a single viewer page that loads modules, signature chunks and the search list on demand. Signatures are chunked 500 declarations per file so a 12,804-declaration module stays usable. With `--base` it writes a STAGING overlay: only modules whose content hash differs from the published base, plus `overlay.json`; the viewer loads the rest from the base. Rails the viewer page with the same pass as `lean-render-publish`.",
    install: { none: true },
    invoke: { shell: "bun run folio-assistant-sci/adapters/paper/lean/lean-kg-publish.ts" },
    io: {
      inputs: [
        { name: "docData", schema: t("RepoPath"), required: true, arg: { flag: "--doc-data" }, description: "doc-gen4's `.lake/build/doc-data` from `lean-html-docs`." },
        { name: "site", schema: t("RepoPath"), required: true, arg: { flag: "--site" }, description: "The folio's built site." },
        { name: "route", schema: t("Slug"), required: false, arg: { flag: "--route" }, description: "Where under the site. Default `lean`." },
        { name: "module", schema: t("PackageName"), required: false, arg: { flag: "--module" }, description: "A module root to keep (`qou` keeps `QOU`). Repeat for several." },
        { name: "contentRoot", schema: t("RepoPath"), required: false, arg: { flag: "--content-root" }, description: "Content tree whose blocks' `lean.ref` become `formalizes` edges." },
        { name: "repo", schema: t("RepoFullName"), required: false, arg: { flag: "--repo" }, description: "`owner/repo` for block links." },
        { name: "ref", schema: t("Branch"), required: false, arg: { flag: "--ref" }, description: "Branch or sha for block links." },
        { name: "contentPrefix", schema: t("RepoPath"), required: false, arg: { flag: "--content-prefix" }, description: "Path of the content root inside the repo, for block links." },
        { name: "base", schema: t("Url"), required: false, arg: { flag: "--base" }, description: "Published `data/` of the base graph; enables the STAGING overlay." },
        { name: "externalBase", schema: t("Url"), required: false, arg: { flag: "--external-base" }, description: "Where links into pruned modules go. Default the community mathlib4 docs." },
        { name: "homeLabel", schema: t("InstanceId"), required: false, arg: { flag: "--home-label" }, description: "The rail's home row." },
        { name: "instance", schema: t("InstanceId"), required: false, arg: { flag: "--instance" }, description: "As rail-standalone-pages.ts --instance." },
        { name: "platform", schema: t("RepoPath"), required: false, arg: { flag: "--platform" }, description: "The index checkout holding the rail pass." },
        { name: "noRail", schema: t("Flag"), required: false, arg: { flag: "--no-rail" }, description: "Publish only; the caller rails the site." },
      ],
      outputs: [
        { name: "viewer", schema: t("RepoPath"), description: "`<site>/<route>/`: index.html, viewer.js/css, extracted signature styles, config.json and `data/` (index.json, names.json, m/<Module>.jsonld, m/<Module>.<k>.sig.json, overlay.json)." },
      ],
    },
    satisfies: ["lean-html-docs"],
    requires: { runtime: ["bun"], network: false },
    selection: {
      when: "Instead of `lean-render-publish` when the folio publishes its Lean as a dynamic viewer over graph shards, and for STAGING branches with `--base`.",
      limits:
        "doc-gen4 still has to elaborate: the shards come from its doc-data, so `lean-html-docs` (or a restored doc-gen4 cache) runs first. Links into pruned modules go to the community docs, built from their Mathlib. Docstrings are rendered client-side with marked and MathJax from CDNs.",
      cost: "Measured on qou 2026-10-11: 3,011 modules, 53,565 declarations, 651 formalizing a block; 6,005 files / 171 MB / 13 s; a no-change overlay writes 0 module files.",
    },
  }),
);
