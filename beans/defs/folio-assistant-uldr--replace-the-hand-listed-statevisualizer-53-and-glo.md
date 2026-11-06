---
# folio-assistant-uldr
$schema: bean/1.0.0
title: Replace the hand-listed state:visualizer (53) and glossary:page (36) builtAtPublish entries with rules (plan, awaiting owner approval)
status: in-progress
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-06T04:51:38Z
updated_at: 2026-11-06T05:25:02Z
parent: folio-assistant-k3vv
---

Follows bean folio-assistant-akiq (done 2026-11-06), which removed the same pattern for BPMN drawings. Owner chose this follow-up on 2026-11-06 ("2 3": retire smart-base's render script, and plan these two lists). **Plan only: no code until the owner approves.**

## Evidence (cat-harness main, 2026-11-06)
cat-harness.json `builtAtPublish` still hand-lists per-instance files written by two writers:
- **state:visualizer, 53 entries**: `docs/en/cat-harness/<graph>/index.html` per state graph (beans, todos, qa, health, attestations, issue-marks, merge-reviews, swimlane-glossary, uploads-queue, ...), plus `docs/en/cat-harness/beans/<instance>/` per instance with a work plan (cat-harness, cat-harness-tools, folio-assistant-core, ...).
- **glossary:page, 36 entries**: `docs/assets/glossary/<instance>--<scheme>.skos.jsonld` per instance and scheme, plus `docs/<locale>/folio-assistant-core/...` per locale (ar, en, es, fr, ru, zh).

Both have akiq's defect: a lower layer naming files of the layers above it. A new layer, a new state graph, a new scheme or a new locale needs a hand edit here, and the per-locale entries name folio-assistant-core, a higher layer, from cat-harness.

## Options to choose between
1. **One folder entry per writer** (what akiq did): e.g. `docs/en/cat-harness/beans/`, `docs/assets/glossary/`, built at publish whole. This works where nothing in the folder is committed. Check each folder for committed files first.
2. **Each layer publishes its own pages** (akiq's "own drawings" rule): the per-instance pages move to the owning layer's site, and the host links them. This is bigger, and the right answer where the page is a function of one layer alone.
3. **Keep the lists but generate them**: no hand edits, but a lower layer still names higher layers' files. Not recommended.

## Done when
- No `builtAtPublish` line in cat-harness names another layer's file or a locale-specific copy of one.
- Adding a layer, a state graph, a glossary scheme or a locale needs no edit in cat-harness, and every check stays green.

## Owner ruling (2026-11-06, card "Built lists")
Option 1: one built-at-publish folder entry per writer.

## Progress
- [x] cat-harness#1091: state:visualizer's beans/, qa/, health/, attestations/ and code/ become one folder entry each (33 lines → 5). docs/assets/glossary/ becomes one folder entry (30 → 1); its 8 committed files leave git, including smart-trust--gdhcn, a higher layer's file.
- [ ] The 6 per-locale docs/<locale>/folio-assistant-core/ entries: core's glossary visualiser routes on the host site. A folder entry cannot remove the name. Awaiting an owner decision.
