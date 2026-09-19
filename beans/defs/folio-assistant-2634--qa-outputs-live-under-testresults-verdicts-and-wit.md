---
# folio-assistant-2634
title: QA outputs live under test/results/ — verdicts and witnesses both, by provenance
status: in-progress
type: task
created_at: 2026-09-19T07:11:55Z
updated_at: 2026-09-19T07:11:55Z
---

THE RULE, from the owner 2026-09-19: 'if the witnesses were generated as a QA reviewer primarily then it should be under test/results/ as part of a QA process.'

Placement follows PROVENANCE, not file family and not consumption. An artefact that is primarily the output of a QA review belongs under `test/results/`, whatever fetches it afterwards.

## What exists today, measured 2026-09-19 on main

| artefact | count | where | declared? |
|---|---|---|---|
| block verdicts `*.qa.json` | 122 | beside their blocks | no |
| KG verdicts `*.kg-qa.json` | 227, in 10 `kg-qa/` dirs | beside what they audit | no |
| witnesses | 134 | `docs/assets/qa/` | yes — `qa` graph kind |
| `*.script-qa.json` | **0** | — | documented in AGENTS.md; NONE EXIST |

The `qa` graph kind was added by a sibling on 2026-09-19 and covers the WITNESSES only. Its own comment draws the line it stops at: 'a verdict lives beside its subject and is what a checker wrote, while a witness is that verdict flattened for the web.' So 349 verdict files are committed and declared by nothing — the `dh4f` shape the same comment complains about for the witnesses.

## The finding that changes the shape

The kg-export diagnostics are NOT write-only. `scripts/kg-viewer.ts:573` reads `doc.undeclaredTerms` off the published document and renders it; `tests/kg-viewer.e2e.ts` asserts on it. So moving them out of the published graph needs a WITNESS projection, not just a delete. That is the verdict/witness split the `qa` kind already defines, so the direction fits the existing design rather than fighting it.

## Sequence — incremental, each PR revertible alone

Same reasoning bean `x3bd` gives for topical directories: prove the layout on one real case before 349 files commit to it.

- [ ] PR 1: declare `test/results/` as a `qa` directory; kg-export writes its diagnostics there as a verdict instead of into the published document; witness projection keeps the viewer working
- [ ] PR 2: witnesses move from `docs/assets/qa/` to `test/results/`, docs-site fetch path follows
- [ ] PR 3: the 227 `*.kg-qa.json`
- [ ] PR 4: the 122 `*.qa.json`
- [ ] separately: `*.script-qa.json` is documented and has zero instances — decide whether the family is dead

## Done when

- [ ] every QA-review output resolves under a declared `test/results/` graph directory
- [ ] the kg-viewer still renders undeclared terms, from the witness rather than the document
- [ ] no QA artefact is committed-but-undeclared

---

## PR 1 done, 2026-09-19 — the declared home and its first tenant

**`test/results/` is declared as `qa-results`, holding the `qa` graph.**
Declared in `cat-harness.json` on the day the directory was created —
deliberately, because the 134 witnesses under `docs/assets/qa/` spent their
entire existence undeclared, which is the `dh4f` defect in reverse: committed
files no declaration mentioned, so a consumer scanning the declared directories
reported a clean run over the lot. The remedy is to declare a directory when
you make it, not when somebody notices. A test asserts both halves — declared,
AND present on disk, since `AGENTS.md` is equally clear that a
declared-but-absent directory is the original `dh4f`.

**A RESULT is a third thing, beside verdict and witness.** A verdict
(`*.qa.json`, `kg-qa/*.kg-qa.json`) and a witness (`docs/assets/qa/`) are both
per AUTHORED SUBJECT: one file answers "is this block, this diagram, sound". A
result's subject is a document the build just PRODUCED, and its findings are
whole-corpus — "these property names are undeclared across the graph", not
"this node is wrong". Filing that as a per-subject verdict would mean inventing
a subject that does not exist, so `qa-results/v1` is a new marker rather than a
reuse. Self-declaring, per the `$schema` convention: a directory is a place to
look and may hold more than one kind, so the file says what it is.

**First tenant:** `test/results/kg-export.qa-results.json`, carrying the four
diagnostics `scripts/kg-export.ts` computes — `undeclaredTerms`,
`undeclaredSchemaModules`, `danglingLinks`, `problems` — with the producing
script and its source hash. Measured on `main` at 2026-09-19: **total 2**, both
`undeclaredSchemaModules` (`schemas/carried-note.ts`, `schemas/memory.ts`).

**Written from the same values the document carries, not recomputed.** Two
renderings of one computation cannot disagree; two computations can. Same rule
`feature-staging.yml` follows when it copies the `.json` alias AFTER the
staging stamp, and the reason `stagingStamp` is one function. A test asserts
the committed result equals the export's own fields, so drift between what the
exporter computes and what was last written is caught rather than assumed.

### Why the document still carries the four fields

`scripts/kg-viewer.ts:573` reads `doc.undeclaredTerms` off the PUBLISHED
document and renders it; `tests/kg-viewer.e2e.ts` asserts on it. Removing the
fields now would take the viewer's panel with them. Pointing the viewer at the
published result is PR 2, and it is a browser-side fetch change that deserves
its own verification rather than riding along here.

That also corrects something I told the owner earlier: I described these four
as "a build report nobody reads". One of them has a live consumer on the
published site.

Verified: `bun test` 2171 pass / 0 fail, typecheck, `eslint .`, `kg:audit:check`
(exit 0), `kg:schema:check`, `check:harness-dirs`, `gen-skill-docs --check`,
`check:workflows`. Wrong-direction partition edges unchanged at 4; unassigned
edges back to `main`'s baseline of 15 after triaging the new module.

## Still to come

- PR 2: viewer onto the published result; drop the four fields from the document
- PR 3: witnesses from `docs/assets/qa/` to `test/results/`, docs-site fetch follows
- PR 4: the 227 `*.kg-qa.json`
- PR 5: the 122 `*.qa.json`
- `*.script-qa.json` is documented in `AGENTS.md` and `schemas/script-qa.ts` and
  has **zero instances** — decide whether the family is dead before migrating it
