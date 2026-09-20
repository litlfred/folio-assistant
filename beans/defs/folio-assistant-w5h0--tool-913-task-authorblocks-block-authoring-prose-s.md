---
# folio-assistant-w5h0
title: 'TOOL 9/13: Task_AuthorBlocks — block authoring & prose structure (14 files, 1 entry point)'
status: todo
type: task
priority: low
created_at: 2026-09-20T04:34:56Z
updated_at: 2026-09-20T04:39:59Z
parent: folio-assistant-d308
---

Group 9 of 13 in `d308`. **14 files, 1 entry point.**

`render-markdown`, `markdown-ast`, `block-module`, `front-matter`,
`build-foreshadows`, `generate-index`, `readme-toc`, `section-story-audit`,
`audit-status-sections`, `extract-status-sections`, `find-dangling-remarks`,
`conditional-class-banner-audit`, `language-trap-audit`, `check-voices`.

**BPMN:** `authoring-a-paper · Task_AuthorBlocks` (`serviceTask`, refs
`content-author`) and `authoring-a-document · Task_AuthorBlocks` (refs
`document-authoring`) — two skills, one Tool, which is legitimate and is what
`satisfies` being an array is for.

**Target repo (#223):** `folio-assist-core`. The 14 `adapters/` files (LIB) sit
behind it.

## Done when
- [ ] a Tool node over the block authoring path
- [ ] `satisfies` names BOTH `content-author` and `document-authoring`
- [ ] the paper/document adapter split preserved — `adapterForKind` stays total
- [ ] `tool-coverage` reflects it

---

## CORRECTED 2026-09-20, before any node was written

**"1 entry point" was wrong twice over.** See `d308`'s CORRECTION section.

That one file is `scripts/check-voices.ts` — **a voice checker.** It belongs with
QA and voice review (`voice-review · Task_MechanicalHalf`), not with block
authoring. It landed here because the categoriser's rule for this group matched
`check-voices` on prose-structure grounds, which was a rule bug, not a finding.

Strip it and **this group has no mechanism in this repository at all.** The other
13 files are library modules invoked from a folio's `package.json`, which cannot
be read from here.

## So the question this bean now carries, instead of a node it assumed

`authoring-a-paper · Task_AuthorBlocks` is marked `serviceTask` — automated. But
authoring a block is **an agent writing a manifest**, which is judgement.
`tool-coverage`'s own tier scheme has a name for that: tier B, a `userTask` only.

Three possibilities, and they are not equally likely:

1. **The diagram is wrong** and `Task_AuthorBlocks` should be a `userTask` or an
   agent task. Then this group needs no Tool node and the row is a
   mis-classification in `d308`, not work.
2. **The mechanism is `block-module` used as a library** by the render path, in
   which case its Tool node is the RENDER node (`jh2j`) and this row folds into
   that one.
3. **A folio provides the command** and the platform genuinely cannot see it, in
   which case the node is authored here and verified in a folio — the same
   posture as `h588`.

**Do not write a node for this group until that is settled.** A Tool whose
`invoke` pointed at `check-voices` would be a node asserting that authoring a
block is checking a voice, which is false and would be published in the graph.

## Done when — REPLACES the list above

- [ ] `check-voices` re-filed under voice/QA in the categoriser, and `d308`'s
      counts re-derived after
- [ ] which of the three possibilities holds, established from the diagram and
      from a folio's own `package.json` — not inferred from here
- [ ] if (1): the diagram corrected and this row reclassified in `d308`
- [ ] if (2): folded into `jh2j` and this bean scrapped with its reasons
- [ ] if (3): a node authored here with its verification posture stated on it
