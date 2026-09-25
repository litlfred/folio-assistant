---
# folio-assistant-0ytk
title: 'CODE LISTS: closed sets of codes as SKOS nodes, each code with a definition and a source'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T19:29:49Z
updated_at: 2026-09-25T18:14:49Z
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

## Evidence — re-derived 2026-09-25, closing

Closed on evidence per `bean-coordination`. Clean checkout, identical to
`origin/main` at `d8c450b9a2`.

| box | how it was re-derived |
|---|---|
| `folio-code-list/v1`, graph kind `code-list`, declared directory | `cat-harness/schemas/code-list.ts` present; `"code-list"` declared in `cat-harness/cat-harness.json`; `cat-harness/code-lists/` present |
| the lists exist and parse | `bun run code-lists:check` → **exit 0**, *"every list parses; every adjudication names the list its codes come from"* |
| the engine refuses codes off-list | `code-list.test.ts` → **12 pass, 0 fail** |
| skill + gate | `skills/folio-core/code-lists.md` present; `code-lists:check` is a script |

**Two counts in the boxes have moved, and the facts have not.** The box says
"six lists … own-namespaces (9 IRIs, 2 retired)"; I measure **12 lists** and
own-namespaces at **11 codes, 3 retired**. Lists were added after this bean was
written. Obligation 1 says verify the fact rather than the figure — *"line
numbers rot"* — and the fact here is that the lists exist, parse, and are named
by the adjudications that use them. That holds.

Not mid-flight: last touched 2026-09-23, no branch on the remote names it.
