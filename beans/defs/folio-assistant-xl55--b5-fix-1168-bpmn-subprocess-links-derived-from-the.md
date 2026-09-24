---
# folio-assistant-xl55
title: 'B5-fix (#1168): BPMN subprocess links derived from the page section that presents the process; 10 <link href> removed'
status: in-progress
type: task
priority: high
created_at: 2026-09-24T17:22:04Z
updated_at: 2026-09-24T17:47:57Z
parent: folio-assistant-tr05
---

## Why
10 `<cat-harness.processes:link href>` elements are arrow-direction findings: a process (general) names the pages written about it. They are also 5-of-10 broken somewhere, with nothing checking them:
- `#ingest-the-theme` — no such anchor (no theme section exists).
- `#a-theme-source` — on a gateway; render-bpmn only reads call activities, so it is inert, and its anchor is missing too.
- On the 4 generated `/processes/*.html` pages the SVG is inlined and the page-relative hrefs resolve under `/processes/`: `publication-workflow.html` and `evidence.html` 404, `document-ingestion.html` lands on the process page.

## The pointer already exists page-side
`WebPageNode.asset.source` (content/docs/*/*.ts) names the `.bpmn` the section presents. Every current target except the theme one has such a section. So the link is DERIVABLE, dependent → general, with no new field.

## Plan
1. render-bpmn: call activity → called process's home file → the WebPage section whose `asset.source` is that file → `<page>.html#<node.id>`. None → the generated `processes/<home>.html`. More than one → fail the render naming both (no silent pick).
2. Hrefs written relative to the SVG file; docs-ui resolves them against the SVG's URL when inlining, so one SVG works at any embedding depth and when opened standalone.
3. Remove the 10 `<link>` elements; drop the `link` reader; update webpage.ts / gen-docs-pages prose.
4. arrow-direction findings −10.

## Done when
- No `<…:link>` in processes/; arrow-direction reports 10 fewer.
- Every `fa-subprocess-link` in every SVG resolves (page + anchor) from both the docs-root page and the /processes/ page — tested.
