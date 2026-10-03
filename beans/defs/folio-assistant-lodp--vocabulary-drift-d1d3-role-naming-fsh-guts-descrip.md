---
# folio-assistant-lodp
title: 'Vocabulary drift D1–D3: role naming, fsh-guts description, sl9u condition onto mapping tables'
status: completed
type: task
priority: normal
created_at: 2026-10-02T18:56:29Z
updated_at: 2026-10-02T21:37:45Z
parent: folio-assistant-zzmr
---

Follow-up to folio-assistant-k74z (PR #1873). Findings D1-D3 of cat-harness/docs/proposals/vocabulary-mappings-2026-10-02.md, 'What the inventory found'.

## D3 ruling (owner default applied)
Owner default applied, option 1, 2026-10-02: the owner was asked and gave no answer, so the stated default holds. Following the owner's bean sl9u precedent, ONE mapping-table row drives role naming in BOTH generators (kg-export and glossary-export): display name -> skos:prefLabel AND dcterms:title; id -> skos:notation; kg-export STOPS emitting the id as rdfs:label. The merged graph must no longer carry two different labels for one role node.

## Scope
- D3: kg-export's role naming moves onto the tables; a test merges both exports' role nodes and asserts no conflicting labels. Any other kg-export output change byte-identical to main or listed in the PR body.
- D2: fsh-guts-export reads the SAME table row kg-export uses for name/description (description -> dcterms:description, bean xsqm).
- D1: the sl9u condition ('a concept scheme that is also a document carries a derived dcterms:title') declared where the tables can express it, so a new emitter reads it rather than rediscovering it.
- D5: investigate only; one owner question.

## D5 ruling
Owner, 2026-10-02, chose "2. Make it like the others": a schema module's first docblock line goes to `summary` (rdfs:comment) as on every other node, and its `title` is the module stem. Implemented in kg-export collectSchemas, with a test in kg-export.test.ts.
- D4: OUT of scope (overlaps PR #1899, gen-library-jsonld.ts).

## Done when
- [x] D3 role naming from one table in both generators, merge test green
- [x] D2 fsh-guts reads kg-export's row
- [x] D1 condition declared and enforced by the applier
- [x] D5 question reported
- [x] PR green on a head containing current main

_2026-10-02T18:56Z_ — Claimed by claude/vocab-drift-d1-d3 (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH). Issue #1910.

_2026-10-02T21:40Z_ — Steward (session https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT): ticked D1–D3 on evidence (kg-export + vocab-mapping-apply tests 73/73 pass locally on 41ddc8f plus D5; vocab-mappings:check, ns:check green). D5 asked, ruled, implemented. Remaining: PR green on current main.

_2026-10-02T21:45Z_ — Steward: #1911 green on 93ebba7 (all hard checks), merged as 909678c. Every box ticked; closed on that evidence. D4 stays open under issue #1910 (overlaps #1899).
