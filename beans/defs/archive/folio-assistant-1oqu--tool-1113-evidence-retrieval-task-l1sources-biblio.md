---
# folio-assistant-1oqu
title: 'TOOL 11/13: evidence-retrieval Task_L1Sources — bibliography, evidence & glossary (11 files, 3 entry points)'
status: completed
type: task
priority: normal
created_at: 2026-09-20T04:35:26Z
updated_at: 2026-09-20T11:55:30Z
parent: folio-assistant-d308
---

Group 11 of 13 in `d308`. **11 files, 3 entry points.**

`citations`, `export-bibtex`, `migrate-bib-verifier`, `gen-bib-papers-list`,
`upload-bib-papers`, `find-arxiv-mirrors`, `simplify-links`, `source-ledger-index`,
`source-ledger-merge`, `build-glossary`, `glossary-candidates`,
`apply-glossary-curation`.

**BPMN:** `evidence-retrieval · Task_L1Sources` (refs `document-intake`),
`Task_VerifyAuthority`, `Task_RecordUnverified`, `Task_RecordGap`.

**Target repo (#223):** `folio-assist-core`.

**The constraint that makes this group delicate:** `Task_VerifyAuthority` checks a
citation against an external registry, and `Task_RecordUnverified` exists because
that check can FAIL. A Tool here must be able to return "could not determine"
distinctly from "verified" — the third-state rule. A node that collapsed them
would launder an unverified citation into an authoritative one, which is the same
failure shape as `confirmed_by` on a narrative.

## Done when
- [ ] a Tool node over the evidence path
- [ ] `satisfies` includes `document-intake`
- [ ] its outputs can express could-not-determine distinctly from verified
- [ ] `tool-coverage` reflects it

---

## 2026-09-20: `glossary-build`, and the constraint was already met — by a schema, not a Tool

### The third-state requirement, and where it actually lives

The bean's sharpest line was that a Tool here must return "could not determine"
distinctly from "verified", since `Task_RecordUnverified` exists for a failed
authority check, and collapsing them would launder an unverified citation.

**Measured: nothing in the corpus WRITES a `VerificationEntry`.** Verification is
a judgement recorded in a curated file, not a computation — so the guarantee lives
in `schemas/bib-verification.ts`, and it is stronger than a Tool output could be:

- **Seven `VerificationStatus` values**, not a boolean. `unfetchable` ("URL/DOI
  did not resolve") and `partial` ("title+publisher upgrade; awaiting PDF") are the
  could-not-determine cases, kept apart from `verified-clean`, and
  `paper-mismatch` is a third thing again — the check ran and disagreed.
- **A `Verifier` discriminated union**, whose own comment states the point:
  *"`kind: "agent"` is a machine-generated claim awaiting human review;
  `kind: "human"` is a human adjudication."* Plus a separate
  `human_adjudicated` field, so an agent claim later reviewed by a person keeps
  both provenances instead of one overwriting the other.

**So the laundering risk is sharper than the bean assumed.** It is not only
unknown→verified; it is **agent-claim→verified**. A node emitting `verified: true`
would collapse both distinctions in one field. This node declares neither: it
builds the glossary and says so. The bib verification path is reached through
`qa-sweep` — `bib-qa.ts` has no `import.meta.main` and produces the report
`qa-checkers-extended.ts` reads.

### A defect found in the script the node runs, and fixed

`build-glossary.ts` read its argument as `resolve(positional[0] || "")` and then
guarded on the RESOLVED path. **`resolve("")` returns the cwd** — truthy, and it
exists — so for the no-argument case the guard was dead code: a bare
`bun run build-glossary.ts` fell through it into `buildGlossary`, which threw
`Paper manifest not found: <cwd>/<cwd-basename>.ts` and exited **1** with a stack
trace. The usage line never printed.

That is the third-state discipline broken at its cheapest point, and it matters
here specifically: **this node's contract promises exit 2 for a missing
argument**, and that promise was false before the fix. Test the argument, then
resolve it. A non-existent path now also names itself, because mistyping a path
and omitting one have different remedies.

Four spawn tests, and the falsifier was run: restored the buggy form and **3 of 4
fail**. It had to be a spawn test — the bug lived in argv handling and
`process.exit` inside `if (import.meta.main)`, so nothing importable was wrong and
no unit test over `buildGlossary` could have reached it. The fourth test pins the
boundary in the other direction: an existing non-paper directory must still get
"Paper manifest not found", not usage, because those two have different remedies.

### Two things this group turned out to contain

- **Four of its twelve files are not TypeScript**: `gen-bib-papers-list.py`,
  `find-arxiv-mirrors.py`, `simplify-links.py`, `upload-bib-papers.sh`. Worth
  noting because `repo-partition.ts` walks `.ts` only, so the separation plan has
  never classified them. Not fixed here; it is a partition question, not a Tool one.
- **`document-intake` carries no input contract**, so `check-tools` cannot verify
  this `satisfies` edge against one. The run is clean and that clean run does NOT
  mean the edge was tested — said plainly in the node's own comment, because a
  green check that never looked is the failure this repo keeps paying for.

## Done when

- [x] a Tool node over the evidence path — `glossary-build`, run and verified
- [x] `satisfies` includes `document-intake` (unverifiable: no contract exists — recorded)
- [x] its outputs can express could-not-determine distinctly from verified — met by
      `VerificationStatus`'s seven values and the `Verifier` union; the node
      deliberately claims NEITHER rather than flattening them
- [x] `tool-coverage` reflects it
- [x] and one defect fixed in the script the node runs, with the falsifier run



---

## The duplicate file is gone — owner-authorised 2026-09-20

The typo artefact `…-bibliogr.md` was DELETED on the owner's explicit
authorisation, after its content had been moved here. `beans update 1oqu` resolves
unambiguously again, so this bean's fields no longer need editing by hand.

Recorded because `deletion-requires-confirmation` is about who decides, not about
never removing anything: the report went up with size, age and what would be lost
(nothing), and the owner said delete.
