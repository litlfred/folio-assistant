---
# folio-assistant-ax6r
title: 'Workflow index page is hand-maintained: generate every-workflow-in-the-repo from the process KG, strip drift; aggregate across KGs'
status: in-progress
type: feature
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-03T09:38:41Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02: "why is the page hand maintained? cat-harness/content/docs/publication-workflow/every-workflow-in-the-repo.md — it should be dynamic loaded from json(ld) KG. the page itself is also a mess. lots of content drift, editorializing, PM status updates and such … once separated, this will need to be aggregated across KGs".

Today the page is a hand-written table: every new BPMN needs a manual row (#1894 and #1912 both added one by hand on 2026-10-02), and rows carry bean ids, issue numbers, owner quotes and status prose that drift.

## Done when
- [ ] the page body is generated from the process KG (the JSON-LD the diagrams already export: id, name, concern group, documentation, called elements, owning instance), with a `--check` gate; hand rows are gone
- [ ] row text is the diagram's own `bpmn:documentation` (first sentence) — no PM status, no bean/issue chatter in the table; anything editorial that must stay moves to the diagram's documentation or a skill
- [ ] grouped by concern group and owning instance
- [ ] after separation: aggregates across instances' KGs (each instance's process graph, resolved through the declared dependencies), not by walking one checkout
- [ ] the drift found today is listed in the PR (rows whose text contradicts the diagram)

_2026-10-03T09:38:41Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
