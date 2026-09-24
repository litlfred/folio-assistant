---
# folio-assistant-zgwz
title: PROMOTE the five agent-skills uploads, and stop check:subgraphs reporting a transcription's own links as dangling
status: completed
type: feature
priority: normal
created_at: 2026-09-23T18:38:49Z
updated_at: 2026-09-23T18:39:11Z
---

parent: folio-assistant-slw1


Issue #1148. The first use of the path `8suc` created, and it surfaced a gate
defect on contact with real content.

## The uploads — five promoted, one deliberately not

Destination derived from the `source_file` relation across all 22 existing
entries, never from a path convention (`v1hw`).

| document | rung | images |
|---|---|---|
| Agent Skill best practices - Gemini CLI | pdf-pages | 1, all chrome |
| Agent Skills - Google Antigravity Docs | pdf-pages | 104, all chrome |
| Best Practices - Google Antigravity Docs | pdf-pages | 104, all chrome |
| Equipping agents... _ Anthropic | pdf-pages | 6 FIGURES |
| Skill authoring best practices - Claude Platform Docs | pdf-pages | 3 FIGURES |

`r8br`'s capture rung classified 209 nav icons as chrome correctly. The nine
remaining were inspected **by looking**, and all nine are real content at
0.14-0.36 coverage. One (`img-p004-2`) is a **table rendered as an image** —
the three progressive-disclosure levels — whose figures appear nowhere in the
page's text layer, so a text-only pass loses them entirely.

The `8suc` loop worked exactly as designed: write verdicts into
`<library>/image-verdicts.json`, re-run `ingest`, the fourth arm applies them,
`every requirement met`.

**`Home _ folio-assistant.pdf` is NOT ingested** and stays in `uploads/`. It is
a browser print of this repository's own docs site; filing it in a library as
source material is the platform/folio boundary question, not a routine
promotion, and it is the owner's.

## The gate defect this surfaced

Promotion produced **12 findings**, every one in `sections/page-009..011.md` of
a single document, every one of this shape:

    .../skill-authoring-best-practices---claude-platform-docs/sections/page-011.md  ->  advanced.md

Those are paths printed inside the SOURCE document's own example code — the
Claude Platform Docs page showing how a SKILL.md references its siblings. They
were never edges in this graph and there is nothing to repoint.

**The rule already existed one layer down.** `schemas/cat-harness.ts` says of
the `derived` layer that *"a QA finding against a derived section is a finding
against its GENERATOR, not against the corpus, and it sends a reviewer to fix
the wrong file"*. `check-subgraphs.ts` was simply not applying it — so twelve
findings asked somebody to edit a transcription of a document this project did
not write.

Repointing them would have been worse than a waste: editing an extracted
section to satisfy a checker breaks the one promise a library entry makes, that
it says what the source said. Same argument as never populating `uses[]` from
Lean and never inventing a narrative.

## Todo

- [x] five documents promoted to `agent-skills/library`
- [x] nine figures inspected by looking, verdicts committed as data
- [x] `derivedLinks` bucket in `check-subgraphs.ts`, routed on the EXISTING
  `isDerivedGraph` — no new field, no new declaration
- [x] printed with its own explanation, never silently dropped, and saying
  plainly that it is not a clean bill either
- [x] test asserting the INVARIANT, not a count
- [x] falsified: reverting the routing fails both the new test and the
  existing dangling one
- [x] `gen:jsonld` and `check:l1-complete --write` ratchets refreshed
- [x] `bun run gates` 135/135

## Why the test is an invariant

`derivedLinks.length > 0` would be the same trap the neighbouring test already
documents: it would fail the day somebody drains the bucket, punishing the fix
it exists to encourage. The invariant — nothing from a derived directory is
ever `dangling`, and nothing in the derived bucket comes from elsewhere — holds
whether the corpus carries twelve or none.

## Not this bean

Whether `Home _ folio-assistant.pdf` belongs in a library at all, and the KG
browser (issue opened separately: `library-graph.ts` COUNTS blocks rather than
reading them, so nothing renders the typed edges the corpus actually carries).
