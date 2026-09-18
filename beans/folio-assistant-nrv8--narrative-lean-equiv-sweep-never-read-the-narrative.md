---
# folio-assistant-nrv8
title: 'proof-narrative-lean-equiv sweep never read the narrative'
status: completed
type: bug
priority: normal
created_at: 2026-08-07T18:50:00Z
updated_at: 2026-08-07T19:20:00Z
---

Claimed on branch `claude/agent-4673-validation-9hffrd`.

`content/pipeline/proof-narrative-lean-equiv-sweep.ts` takes `mdText` as the
FIRST parameter of `checkEquivalence` and never reads it. Every check it makes
compares `.ts` metadata against `.lean` declarations: label↔decl-name,
block-kind↔decl-kind, conjecture class/axiom pattern, sorry presence.

So a sweep called *narrative*–Lean equivalence has never looked at the
narrative. Surfaced by the `no-unused-vars` drain (lnt1): the one place
`mdText` was consumed was

    // Check if .md has a statement
    const mdStatement = extractMdStatement(mdText);

whose result was discarded, and `extractMdStatement` had exactly that one
caller.

## What a SCRIPT can honestly add

The registry contract for `proof-narrative-lean-equiv` is a semantic,
element-by-element comparison (quantifiers, hypotheses, conclusion) — that is
an agent job and stays one. The script sweep is the cheap pre-pass, and two
narrative-side checks are decidable without understanding the mathematics:

1. **Narrative kind contradicts the block kind.** Fires only when the `.md`
   explicitly declares itself (`**Theorem**`, `**Definition.**`,
   `\begin{proposition}`) and that disagrees with `.ts` `kind`. High
   precision by construction — silence when the narrative makes no claim
   about its own kind.
2. **A provable block whose narrative states nothing.** A `.md` that is
   headings/directives only, with a real Lean theorem beside it: the reader
   gets no claim at all.

Semantic equivalence stays `needs-agent`.

## Definition of done

Both checks implemented, measured against the qou corpus for false-positive
rate BEFORE landing, and covered by unit tests. If either check is noisy on
real content it does not ship — a noisy checker is worse than a missing one.


## Done — and measuring first was the whole story

Both narrative checks implemented, 18 unit tests, `bun run lint` / `tsc` /
287 tests all clean.

### The first measurement was 137 warnings. Almost all of them were a bug.

Running against the qou corpus before landing (the definition of done above)
gave 137 hits — implausibly many for a check designed to be quiet. The cause
was NOT the new check:

`extractKind` tried a bare `/kind:\s*["'](\w+)["']/` **before** the builder
inference. That regex is unanchored, so it matched the first `kind:` anywhere
in the file — including inside `authorNotes: [{ kind: "note", … }]`. Every
block carrying an author note was therefore typed `note` / `caveat` /
`status` instead of `definition` / `theorem` / …

That is pre-existing and it corrupted the sweep's EXISTING checks too: the
kind-vs-declaration comparisons have been running against the author-note's
kind on those blocks. Fixed by inferring from the builder call first and
anchoring the explicit-`kind:` fallback to the export's indentation.

**137 → 19.** 118 of the original hits were that bug.

### The 19 survivors are real

- 8 × narrative says *conjecture*, block typed `remark` — a remark making a
  formal claim, which §3a says should be promoted or carry `interprets:`.
  Verified `rem:periodic-table-demand`: its `.md` states
  `**Conjecture.** *V coincides with the valley of stability for all A ≤ 238.*`
- 8 × narrative says *proposition*/*theorem*, block typed `conjecture` — a
  reader-facing OVERCLAIM. Verified `conj:hydrogen-shell-writhe`: `.ts` is
  `conjecture(...)`, `.md` opens
  `**Proposition (conditional on conj:borromean-quark).**`
- 3 × other cross-family disagreements.

Zero hits from the empty-narrative check — the generous fallback means
`undefined` really does mean "headings and directives only".

Deliberately quiet by construction: prose-style variation *within* the
provable family (a `**Theorem.**` heading over a block typed `proposition`)
is house style and does not warn. Only cross-FAMILY disagreement counts.

### Third instance of the split-repo root bug

The sweep could not run at all: `resolve(REPO_ROOT, "content", args.root)`
with REPO_ROOT = the platform gave
`<platform>/content/content/<paper>` → "Root not found" for every folio.
Now uses `findContentRepoRoot()` and accepts a repo-relative, absolute, or
legacy `<paper>/<chapter>` target. Same defect as `q-usage-audit.ts` (1b82747)
and `scripts/tests/helpers.ts` (de4108e).

## Left for the owner

The 19 findings are editorial calls — promote the block kind, soften the
prose, or add `interprets:`. Not mine to decide.
