---
# folio-assistant-0jtl
title: 'SKILLS: a review package in folio-assistant-core — large-document-review, review-heatmap, review-navigation, learned from WHO SOPs and inspection practice'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-10-06T06:15:04Z
parent: folio-assistant-q4jm
---

Owner: *"review ... skills for document review for large things like a DAK or
L1 digital transofrmation hadbook"* and *"put into folio-assistant-core"*.

**What.** A `review` skill package at `folio-assistant-core/skills/review/`,
declared in folio-assistant-core.json:
- `large-document-review`: the method. Slice the document by the folio/
  graph, not by page. Assign slices to reviewer roles by subject (clinical,
  QC, narrative, FHIR). Plan and record coverage. Review diff-first: read the
  ChangeSet, then the context. Stop rules. What sign-off means for a slice
  versus for the whole.
- `review-heatmap`: child 07.
- `review-navigation`: how an agent drives the page for a person, and the
  keyboard map.

**Learn before writing. Sources to mine (read, not invented):**
- The WHO IG starter kit SOPs. That is sopq; read it together with this bean,
  and do not duplicate it.
- The WHO SMART Guidelines DAK and L1 documentation for the phase-gate review
  steps. content-review.md already names Technical Officer → Clinical SME →
  Content Reviewer.
- Established document-review practice (for example IEEE 1028 reviews and
  inspections): roles, entry and exit criteria, and coverage.

Record each source's provenance in the skill.

## Done when
- [ ] the package is declared and reachable through `skill_list` / `skill_fetch`
- [ ] the three skills are written, each with a cited source for every rule not derived here
- [ ] content-review.md and staging-review.md point to it for documents over one chapter

## Owner ruling 2026-10-06: where the review skills live

Chosen directly by the owner in https://claude.ai/code/session_012qoycyCSGidZqW245vXhze, from two options (recommended first):

1. **CHOSEN: leave them in cat-harness and point to them from core.** `review-heatmap`, `review-comments`, `staging-review`, `visual-diff` and `before-after-preview` stay in cat-harness. folio-assistant-core gets a `review` pointer that names them (about 2 files). Nothing moves, so it cannot collide with the GOAL 1 separation work, and every harness can still use the skills.
2. Move them into `folio-assistant-core/skills/review/` (not chosen: about 10–15 files plus re-registration, colliding with in-flight separation PRs).

This bean's scope narrows to the pointer.
