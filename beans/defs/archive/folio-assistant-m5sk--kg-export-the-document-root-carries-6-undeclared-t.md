---
# folio-assistant-m5sk
title: 'kg-export: the document ROOT carries 6 undeclared terms, and nothing checks the root'
status: completed
type: task
priority: normal
created_at: 2026-09-19T06:56:16Z
updated_at: 2026-09-19T06:59:01Z
---

Sibling bean `ovkk` found 34 undeclared terms in `@graph` and is fixing them. This is the SAME defect one level up, on the DOCUMENT ROOT, which `undeclaredTerms` structurally cannot see because it walks `@graph`.

MEASURED 2026-09-19 on main, `bun run scripts/kg-export.ts`, by comparing every root key against the emitted `@context`:

| root key | type | state |
|---|---|---|
| `repository` | string | UNDECLARED |
| `counts` | dict, 12 entries | UNDECLARED |
| `problems` | list | UNDECLARED |
| `undeclaredTerms` | list | UNDECLARED |
| `undeclaredSchemaModules` | list, 2 non-empty | UNDECLARED |
| `danglingLinks` | list | UNDECLARED |

`generatedAt`, `sourceCommit`, `sourceCommitSha`, `sourceCommitAt` and `sourceTreeDirty` ARE declared, so the root is half-covered — which is what made the gap invisible.

`repository` is not a design question: it is a plain provenance string sitting beside `sourceCommit`, which is declared.

THE DEFECT IS THE MISSING CHECK, not the six keys. `staging` shipped broken through this same blind spot (bean `lx2s`, PR #340) while `kg-export.ts` documented the rule in its own comments. Declaring six keys fixes today; extending the check to the root is what stops the seventh.

## Done when

- [ ] `undeclaredTerms` has a root-level counterpart, reported the same way
- [ ] all six root keys declared, `@json` for the structured ones (the pattern `ovkk` established for values whose vocabulary this graph does not model)
- [ ] a test that fails if a new undeclared root key appears
- [ ] measured again after the change: zero undeclared root keys

---

## Done, 2026-09-19

**Zero undeclared root keys**, measured after the change with the same command
that found the six.

**The gate is the deliverable.** `undeclaredRootTerms(doc, context)` is checked
against the assembled document in the CLI and exits 1 naming each field —
deliberately NOT a field on the document, the same call `keywordCollisions`
makes and for a sharper reason here: a field reporting undeclared root terms
would itself be a root term needing declaration, and would have to be computed
before it existed.

Fatal, following `undeclaredTerms` now that its count is zero: the only thing a
new entry can mean is that somebody added a root field and did not decide what
it means.

**What each of the six got, and why they are not uniform:**

| field | declaration | why |
|---|---|---|
| `repository` | `schema:codeRepository`, `@type: @id` | a URL, and the wider web already agrees on the term — same call `version` makes with `schema:softwareVersion`. A gap, not a judgement: it sits beside `sourceCommit`, declared all along. |
| `counts` | `@json` | keyed by TYPE NAME, so there is no fixed set of terms to declare. A declared container over undeclared members keeps `counts` and drops all twelve numbers. |
| `problems` | plain literal term | an array of STRINGS. A bare term expands an array of literals to one value each, which is what they are; `@json` would collapse three independent problems into one opaque blob. |
| `undeclaredTerms`, `undeclaredSchemaModules`, `danglingLinks` | `@json` | arrays of OBJECTS whose inner keys (`term`, `onTypes`, `occurrences`, `module`, `why`, `from`, `edge`, `to`) this graph does not model. |

**The test proves the gate FIRES, not just that it passes.** An assertion that
the list is empty is green when the checker works and when it is broken — the
`dh4f` shape. So the test also deletes one declaration and asserts the checker
names it, asserts a `@`-prefixed keyword is not reported, and asserts a novel
field is caught by name.

Verified: `bun test` 2165 pass / 0 fail, typecheck, eslint, `kg:audit:check`,
`kg:schema:check`, `gen-skill-docs --check`, `gen:jsonld:check`. Wrong-direction
partition edges unchanged at 4; the unassigned-edge count is 15 both with and
without this diff, so the rise from 7 is `main`'s, not this change's.

## Left open

Whether the four diagnostic fields belong in the PUBLISHED document at all is a
separate question — they are a build report, and a QA sidecar is their natural
home. Declaring them stops the silent loss either way, which is what this bean
was about.
