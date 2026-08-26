---
# folio-assistant-19ff
title: Convert remaining process diagrams to BPMN; embed workflow SVGs in README and docs
status: completed
type: task
priority: normal
created_at: 2026-08-26T13:24:02Z
updated_at: 2026-08-26T13:32:52Z
---

Follow-up to ia4m. Three things:

1. Embed the rendered workflow SVGs in README.md and the GitHub Pages docs
   (they are currently only linked as text).
2. Confirm the BPMN sources are tracked in the repo (docs/workflows/*.bpmn).
3. Audit every existing mermaid diagram and convert the PROCESS-shaped ones to
   BPMN. Structural diagrams (component graphs, role inheritance, the docs map)
   are not processes and stay mermaid — BPMN would be the wrong notation.

## Todo

- [x] Give rendered SVGs an explicit white background so they read in dark mode
      on GitHub and the docs site
- [x] BPMN: authoring-a-paper (docs/guides/writing-a-paper.md end-to-end)
- [x] BPMN: l2-dak-authoring (docs/guides/who-smart-dak.md L2 artifacts)
- [x] BPMN: l3-fhir-pipeline (docs/guides/who-smart-ig.md L3 pipeline)
- [x] content-types.md: replace both mermaid strips with the BPMN SVGs
- [x] README.md: embed the three workflow SVGs
- [x] docs/publication-workflow.md: index every BPMN file in the repo
- [x] Record which mermaid diagrams stay, and why

## Summary of Changes

**Embedded, not just linked.** The rendered SVGs now appear inline in README.md
(the three content-agnostic diagrams, with the per-content-type ones in a table)
and in every docs page that previously carried a mermaid strip for the same
process.

**BPMN sources are tracked** under `docs/workflows/` — six files, all valid BPMN
2.0 with diagram interchange, importing with zero bpmn-js warnings.

**Three process diagrams converted from mermaid to BPMN:**

- `authoring-a-paper.bpmn` — replaced the 8-step flowchart in
  `docs/guides/writing-a-paper.md`. Adds what the strip could not show: the Lean
  loop (`sorries remain` back to formalisation), the reviewer's iterate/approve
  gateway, and which lane each step belongs to.
- `l2-dak-authoring.bpmn` — replaced the artifact fan-out in
  `docs/guides/who-smart-dak.md`. The six artifacts are now a real parallel
  gateway across the business-analyst and terminologist lanes, with clinical SME
  validation gating assembly.
- `l3-fhir-pipeline.bpmn` — replaced the L3 strip in
  `docs/guides/who-smart-ig.md`. Adds the two failure loops the strip hid
  (invalid FHIR back to FSH; QC findings filed as beans, then back to FSH).

`docs/content-types.md` lost both of its mermaid strips: the lifecycle strip is
now the `content-lifecycle` BPMN, and the guideline → L2 → L3 strip is the
`l3-fhir-pipeline` BPMN.

**Diagrams deliberately left as mermaid** — they are not processes, and a pool
with lanes would assert actors and a time axis that none of them have: the
platform component map (README + home), the architecture diagram, the
skill/role composition graph, the `viewer → reviewer → author → admin`
inheritance lattice, the documentation navigation map, the "what you provide"
decomposition in the new-content-type guide, and the Lean `sequenceDiagram` in
the paper tutorial (an interaction transcript, where BPMN's collaboration +
message flows would add ceremony without meaning). The audit table is in
`docs/publication-workflow.md`, with the rule for new diagrams recorded in
`AGENTS.md`.

**Rendering.** SVGs now carry an explicit white backdrop sized to the viewBox,
so they stay legible under GitHub's and the docs site's dark themes. Figure
styling moved out of an inline `<style>` in one page into
`docs/_includes/head_custom.html`, which just-the-docs pulls into every page.
