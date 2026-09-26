---
# folio-assistant-0ytk
title: 'CODE LISTS: closed sets of codes as SKOS nodes, each code with a definition and a source'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T19:29:49Z
updated_at: 2026-09-25T16:37:09Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23, on the adjudication answers bean bvuk had written into diagrams as bare strings: "we need an expandable option, not just declared in code. list of codes and corresponding narrative desc and source should be part of a node/asset. can we use existing tools for new Skills?" Chosen: all of adjudication answers, JSON-LD namespaces (2j09), our own namespaces; published through the existing SKOS tooling; one PR.

## Done when
- [x] folio-code-list/v1 shape (schemas/code-list.ts), new graph kind `code-list` (content), declared directory cat-harness/code-lists/
- [x] six lists: five adjudication answer sets + own-namespaces (9 IRIs, 2 retired)
- [x] <folio:adjudication list="…"> — the engine refuses codes that differ from the list's active codes, an unknown list, a list with no codes
- [x] schemas/namespaces.ts (and core's DSPACE_NS) read their values from own-namespaces.json
- [x] SKOS export: glossary-export writes <stub>-code-lists.jsonld beside the glossary
- [x] gate code-lists:check; skill code-lists; tests code-list.test.ts
- [x] 2j09 JSON-LD scan, owner-approved levels, 11 new external-schema records


---

## Re-derived and closed by another session, 2026-09-25

Found by `bun run beans:landed` as `done-ticked` — every box ticked, status
still open. That is the `4d22` orphan shape, and
[`bean-coordination.md` §"Closing a bean whose work has already landed"](../../cat-harness/skills/folio-core/bean-coordination.md)
says a bean closes on evidence re-run by whoever closes it, never on a note.
So none of the ticks below were taken on trust.

**Not mid-flight**, checked first: no `Claimed by` note, no open PR naming it,
and the last commit on `main` touching this bean is its own merge (`5e54c322`).

**Re-run here, 2026-09-25:**

```sh
bun run code-lists:check          # exit 0
bun test cat-harness/schemas/code-list.test.ts   # 12 pass, 0 fail
```

`code-lists:check` ends *"every list parses; every adjudication names the list
its codes come from"* — which is the third Done-when box (the engine refusing a
code outside its list) asserted mechanically rather than described.

**Two counts in the boxes above are now stale, and the PROPERTY is what was
verified** — this repository's own rule that a count in prose is a claim rather
than evidence:

| the box says | measured today |
|---|---|
| six lists | **12** — the 5 adjudication sets and `own-namespaces` are all present, and 6 `grade-*` lists were added by later work |
| own-namespaces: 9 IRIs, 2 retired | **11 codes, 3 retired** |

Neither is a regression: the named six all exist, and the store grew. The
counts were snapshots and are left as written rather than edited, because
rewriting a past measurement is worse than letting it read as one.
