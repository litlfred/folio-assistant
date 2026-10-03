---
# folio-assistant-ax6r
title: 'Workflow index page is hand-maintained: generate every-workflow-in-the-repo from the process KG, strip drift; aggregate across KGs'
status: todo
type: feature
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-02T20:42:54Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02: "why is the page hand maintained? cat-harness/content/docs/publication-workflow/every-workflow-in-the-repo.md — it should be dynamic loaded from json(ld) KG. the page itself is also a mess. lots of content drift, editorializing, PM status updates and such … once separated, this will need to be aggregated across KGs".

Today the page is a hand-written table: every new BPMN needs a manual row (#1894 and #1912 both added one by hand on 2026-10-02), and rows carry bean ids, issue numbers, owner quotes and status prose that drift.

## Done when
- [x] the page body is generated from the process KG (the JSON-LD the diagrams already export: id, name, concern group, documentation, called elements, owning instance), with a `--check` gate; hand rows are gone
- [x] row text is the diagram's own `bpmn:documentation` (first sentence) — no PM status, no bean/issue chatter in the table; anything editorial that must stay moves to the diagram's documentation or a skill
- [x] grouped by concern group and owning instance
- [ ] after separation: aggregates across instances' KGs (each instance's process graph, resolved through the declared dependencies), not by walking one checkout
- [ ] the drift found today is listed in the PR (rows whose text contradicts the diagram) — listed below; copy it into the PR body when the PR is opened

## What was built (2026-10-03)

- `cat-harness/scripts/lib/process-index.ts` builds `cat-harness/docs/assets/processes/index.json` (`folio-process-index/v1`, `ProcessIndexSchema` in `schemas/site-indexes.ts`): id, name, first documentation sentence, path, forge source, SVG, concern group, owning instance, called elements. Written by `bun run docs:auto`, so `docs:auto:check` is its `--check`; each instance is asked for its own declared `processes` directories.
- **Not JSON-LD.** The kg-export JSON-LD carries id, name and source path but no documentation and is gitignored; the glossary's `kg-bpmn-activities` carries activities, not processes. A plain JSON projection beside `assets/beans/index.json` and `assets/library/index.json` was the smaller change.
- `cat-harness/docs/assets/js/process-index.js` self-mounts on `[data-fa-process-index]` (the work-plan pattern), groups by concern group or by instance, and has a `<noscript>` fallback on the page.
- `bun run check:process-index` (in `code-quality-gates.yml`, `@covers processes, docs`) fails when a declared `.bpmn` has no row, a row names an undeclared file, or the page loses its mount. It replaces `check:workflow-refs`'s NOT INDEXED scan of the page markdown.
- 38 diagrams got a new opening sentence in their `bpmn:documentation`, because the old one restated the title, opened with an owner quote, bean or issue, or was an all-caps thesis that did not say what the process does. Bootstrap's five are untouched (a submodule); four of them open with "A SUB-PROCESS, never an entry point." or similar and still deserve a better first sentence upstream.

## Drift found in the hand table (2026-10-03)

1. All bootstrap rows named `bootstrap/workflows/…`; the diagrams are in `bootstrap/processes/`.
2. `bootstrap/workflows/bootstrap.bpmn` was a row; no such diagram exists.
3. The page said bootstrap has three diagrams; it declares five — `complete-initialization.bpmn` and `human-agent-discussion.bpmn` had no row. `bootstrap-tools`' `render-kg-to-github-pages.bpmn` had no row either.
4. `initialize-harness`: "Three lanes: Bootstrapping Agent, Requestor, and the Knowledge Graph Data Store" — the diagram has two (Bootstrapping Agent, Knowledge Graph Data Store).
5. `ingest-theme.bpmn` "is **not** a call activity of `document-ingestion.bpmn` today" — it is; `document-ingestion` calls `Process_IngestTheme`.
6. `subscribe-kg`: "Drawn here, not in cat-harness" — it is in `cat-harness/processes/library/`.
7. `merge-train`: "hand it back through `merge-refusal`" — the diagram calls `Process_MergeRefusal`, which no declared diagram defines.
8. `code-quality-gates`: "Five independent jobs… No job declares `needs:`… Four are hard and one (`rust-wildcard`) is warn-only" — the diagram draws ten jobs, two of them warn-only, and three jobs in the YAML declare `needs:`.
9. `wireframe-design-review`: "then `adjudication.bpmn` where reviewers disagree" — it calls `criterion-adjudication`.
10. `kg-separation`: "Authorising, seeding and the cutover sit in the **Administrator** lane" — `10 · Seed both repositories` is in the Authoring agent lane.
11. `crdm-requirements`: "its six phases are the call activities below" — it has seven call activities.
12. `board-relocate`: "**Strict**, unlike the two above" — one board diagram is above it; it is strict unlike the other two.
13. `upstream-pin-watch` had two rows; the second said "see **Upstream dependencies** below", a section above it.
14. Content-type processes "sit *inside* level 3's `Draft the block edit`" — `editing-hci-validation` calls `evidence-retrieval` and `options-analysis`, not any authoring process.
15. "`check:workflow-refs` fails when a `.bpmn` under `processes/` is absent from this page" — it never covered bootstrap's or bootstrap-tools' diagrams, which is how items 1–3 survived.
