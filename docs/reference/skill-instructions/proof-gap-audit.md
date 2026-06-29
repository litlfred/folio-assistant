---
layout: default
title: Proof Gap Audit
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/proof-gap-audit.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/proof-gap-audit.md) — do not edit here.

{% raw %}
# Proof Gap Audit

## Overview

This skill inspects one or more proofs — narrative (`.md`) and/or
formal (`.lean`) — and reports **gaps**. A gap is any missing step
that a reader (or Lean) cannot reconstruct without external help.

Two classes of gap:

| Class | Where | Example |
|-------|-------|---------|
| **Intra-proof** | Inside a single proof | "There exists $X$ such that…" with no construction given |
| **Inter-proof** | Between blocks | Theorem B cites "well-known fact" that is neither in the paper nor formally imported |

## When to Use This Skill

- After drafting a new proposition/lemma/theorem + proof
- During review of a chapter before merge
- When a reviewer flags "this doesn't follow"
- Before promoting a `conjecture` to `theorem`
- After filling a `sorry` — check the informal proof also has no gaps
- When `uses[]` is updated — verify the dependency graph matches the actual proof

## Intra-proof gap checks

Run against each `proof` block's `.md` and the corresponding `.lean`
file. Flag any of the following:

### A. Existence gaps

| Pattern | Check |
|--------|-------|
| "There exists $X$ such that $P(X)$" | Is $X$ constructed, named, or cited? |
| "Choose $f$ with property $Q$" | Is existence of such $f$ established (axiom of choice, prior lemma, explicit)? |
| "Let $\pi \colon E \to B$ be…" | Has the bundle/morphism been defined earlier, or is this the first mention? |
| `∃ x, P x` in Lean followed by `sorry` | Flag — existence is the content, not a detail |

### B. Uniqueness gaps

| Pattern | Check |
|--------|-------|
| "the unique…", "the canonical…", "**the** $f$ such that…" | Is uniqueness proved or cited? |
| Definite article on a non-trivially-unique object | Needs either a uniqueness lemma or universal-property citation |
| "up to isomorphism/equivalence" | Is the equivalence class actually a singleton in the relevant sense? |

### C. Unproved assertions

| Pattern | Check |
|--------|-------|
| "Clearly", "Obviously", "It is easy to see" | Replace with citation, one-line justification, or a lemma |
| "It follows that…" | What is the inference rule? Cite it or expand |
| "By a standard argument" | Name the argument, cite a source, or expand |
| "Similarly" | Spell out the symmetry, or state it as a lemma applied twice |
| "As above" / "mutatis mutandis" | Make the substitution explicit or factor out a lemma |
| "One checks that…" | Do the check, or defer to a referenced result |

### D. Missing justifications

| Pattern | Check |
|--------|-------|
| Inequality used without proof | Cite prior bound or prove |
| Limit/colimit existence | Cite completeness/cocompleteness or construct |
| Application of a universal property | Is the universal property in scope (import or prior lemma)? |
| "Without loss of generality" | Is the reduction valid (symmetry group action, invariance)? |
| Change of variables / substitution | Is the map well-defined and invertible where needed? |

### E. Lean-specific gaps

| Pattern | Check |
|--------|-------|
| `sorry` | Must carry a `-- Ref:` citation per the project authoring conventions |
| `admit` | Same as sorry — must be resolved or cited |
| Implicit arguments hiding definitional unfolding | `unfold`/`dsimp` is fine, but omission of a structure projection is a gap |
| `decide` / `native_decide` on non-trivial goals | Document why it's decidable in the remark |
| Trivial `rfl`/`simp` for a claimed non-trivial result | The statement is probably too weak — flag |

## Gap criticality — `routine` | `core` | `restates-target`

Beyond *what kind* of gap (A–E), every `sorry` / deferred step is also
classified by *how much of the result's content it defers*. Adopted from
the AlphaProof Nexus rater rubric (arXiv:2605.22763): an honest sketch that
defers only *routine* steps is healthier than one that hides the key idea —
and a gap that *is* the target is not a proof at all.

| Tag | Meaning | Severity | Audit action |
|-----|---------|----------|--------------|
| `routine` | Defers a standard / technical step (a Mathlib-shaped lemma, a finite computation, a bookkeeping inequality). The proof's **idea is present**; only labour is deferred. | minor (major if load-bearing for a downstream chain) | Acceptable to defer — **must** still carry `-- Ref:` (the project authoring conventions). |
| `core` | Defers the **key insight** — the step carrying the result's novelty (the "miracle"). Only scaffolding is present. | critical / major | Chase **first** in triage; never let it sit behind `routine` gaps. |
| `restates-target` | The deferred lemma **is** the target, or a trivial rephrasing / re-hypothesised form of it — the gap *is* the theorem. | critical | **AUTO-FAIL.** This is the AlphaProof Nexus failure mode (a): hiding the hard part in a helper that restates the goal. Not a proof. Demote the block to `conjecture`, or replace the helper with the real argument. |

**How to classify:**

- **`restates-target` detector.** Compare the `sorry`'d helper's *conclusion*
  to the target's conclusion modulo definitional unfolding / α-renaming /
  moving a hypothesis across the turnstile. If they match (or the helper is
  strictly stronger than the target and itself unproved), it is
  `restates-target`. In Lean, `lean_goal` at the helper + `lean_hover_info`
  on the target make this mechanical; in narrative, quote both statements
  side by side.
- **`core` vs `routine`.** Ask: *handed only the stated lemmas (minus this
  `sorry`), could a competent reader reconstruct the argument?* If yes →
  `routine`. If the `sorry` is the only place the actual argument lives →
  `core`.
- **The triage rule** (carried into `proof-triage`): a block whose only gaps
  are `routine` **and** whose strategy is coherent **outranks** a block with
  a `core` or `restates-target` gap, even if the latter has fewer `sorry`s.
  *An honest gap beats a no-gap dead end.*

**Relation to other checks.** A `core` gap downstream of a conjecture is
governed by §I (conjectural propagation) — demote to `conjecture` /
conditional class. A `restates-target` gap is **distinct** from a
conjecture: a conjecture honestly states an unproved claim, whereas
`restates-target` *pretends to prove* the target by deferring it. Never
launder the latter into the former without re-typing the block.

## Inter-proof gap checks

Run against the content graph (block `uses[]` + `.lean` imports).

### F. Missing bridging lemmas

For each theorem $T$ whose proof cites a statement $S$ not present in
the paper or imported library:

- If $S$ is a clean sub-statement → **should be a lemma** in the paper
- If $S$ is a consequence of cited axioms/prior theorems → add the
  derivation as a **proposition** with its own proof block
- If $S$ is a Mathlib fact → add explicit `import` + `-- Ref:` and cite
  it in the narrative

### G. Broken chains

Walk the DAG: for each block $B$, the claims used inside $B$'s proof
must all be covered by $B$'s `uses[]`. Flag:

| Gap | Remediation |
|-----|-------------|
| Proof mentions `$\phi$ is natural` but no `prop:phi-natural` exists | Add a naturality proposition with proof |
| `uses[]` empty but proof clearly depends on earlier blocks | Populate `uses[]` and verify downstream |
| Proof depends on $X$, but $X$ depends on $T$ (creating a cycle) | Restructure — one direction is the real proof |
| Proposition cited by label but label does not resolve | Fix label or create the missing block |

### H. Implicit shared context

Flag when multiple proofs rely on an unstated shared assumption:

- "Throughout this section we fix $q > 1$" — should be a `prose` or
  `definition` block all downstream blocks `uses[]`
- Chapter uses a convention (e.g. "all categories are small") not
  declared in a block
- Two proofs both assume a construction that is nowhere defined

### I. Conjectural propagation (STRICT — see the project authoring conventions)

| Check | Action |
|-------|--------|
| Theorem/proposition whose `uses[]` (transitively) includes a `conj:` | **Must** be demoted to `conjecture` |
| Proof block downstream of a conjecture | **Must** be a `remark` with `interprets` |
| Lean `theorem` downstream of an axiomatized conjecture class | Must take the class as `[instance]` hypothesis |

### J. Repeated invocations under the same conditions

When two or more proofs in a chapter invoke the **same block** with
the **same hypotheses / specialisation / instantiation**, the shared
sub-derivation should be promoted to its own block.

| Pattern | Detection | Remediation |
|---------|-----------|-------------|
| Block `def:foo` is cited in 3+ proof `.md` files in one chapter, each time with the same restriction (e.g. always at a fixed parameter value, always for the rank-2 case) | `grep -l '#def:foo' content/<paper>/<chapter>/*-proof.md` then check the surrounding context for shared hypotheses | Extract a **specialisation lemma** (`lem:foo-at-boundary`) that bundles the cited block plus the recurring hypotheses; replace each repeated invocation with a citation of the new lemma |
| The same 3-5 line argument ("by faithfulness of the trace and the spectral splitting...") appears verbatim or near-verbatim in multiple proofs | `grep -l "<distinctive phrase>"` across `*-proof.md` | Promote the shared argument to a **proposition** (or remark with `interprets`) and reference it from each proof |
| Two proofs construct the same auxiliary object (same decomposition, same extension, etc.) before doing different things with it | Compare proof prefaces; look for matching display-math blocks | Factor the construction into a **definition** block, cite it from both |
| A definite-article phrase ("the canonical $X$ associated to $Y$") is reused across proofs without a single source | `grep -E "the canonical|the unique|the standard <X>"` | Add a **definition** block fixing the named object; replace each occurrence with a hyperref to it |

**Threshold**: 2 invocations of an identical sub-derivation are
flagged informational; 3+ are flagged as a major-severity
abstraction gap. The audit should report the count, the
hypotheses being shared, and a candidate name for the extracted
block.

**Why this matters.** Repeated identical sub-proofs (a) increase
the chance of inconsistent edits later (one copy gets fixed, others
drift), (b) inflate the dependency graph energy unnecessarily (each
proof carries its own copy rather than pointing to one source), and
(c) hide the fact that the shared content is itself a theorem
worth naming.

**Cross-skill handoff.** When this skill flags a J-class gap, the
remediation is owned by `proof-simplifier` (factoring abstractions)
or `formalizer` (creating the new block). The shared argument may
already be partially formalized in one of the existing proofs;
identify which proof has the most complete version as the
extraction starting point.

### K. Pre-declaration corpus check (STRICT — see AGENTS.md §"Before declaring 'open'")

Before flagging any item as a **gap, open math, open question,
TODO, pending derivation,** or equivalent in the audit output, run
the corpus-grep checklist (AGENTS.md §"Before declaring 'open'
math / questions / gaps"):

1. `grep -rln <topic> docs/audits/` — owner-authorised resolutions
   land as audit docs ahead of the source file's status note being
   updated.
2. `grep -rln <topic> content/` (full tree) — related conjectures
   often live in adjacent chapters (a question raised in one chapter
   may be answered in another).
3. `grep -rln <topic> computations/` — implemented code may already
   discharge the content the gap is about.
4. Coordination ledger `docs/coordination/<theme>.md` — prior
   agents may have closed it.

If any of (1)-(4) returns a non-trivial hit, the item is **not** a
gap; document the existing resolution instead. Only after all four
return empty (modulo the originating source file) may the item
appear in the audit's gap list.

**Why this matters.** Source file status notes lag the corpus by
weeks; the corpus is the source of truth. Items repeatedly declared
"open" against a source file's status note have, on re-analysis,
been found already implemented elsewhere in the corpus.

This check applies to every gap class A-J above when the gap
candidate is large enough that a categorical resolution could
plausibly exist (heuristically: any gap that would warrant a
follow-up `prop:` or `conj:` block).

## Workflow

### Phase 0 — Anti-hallucination protocol (REQUIRED)

This skill has a documented history of hallucinating findings (one
full-paper run produced a ~56% false-positive rate). Every finding
**must** clear all five checks below before being reported:

1. **Path-exists check.** Run `ls <path>` (or `find` / `Glob`) on
   every file you cite. If a file is not on disk, the finding is
   inadmissible. Common error: claiming a block exists when it does not.

2. **Quoted-evidence check.** Every gap claim must include a
   verbatim quote from the proof being criticized, with line
   numbers (e.g. "lines 24-27 of `<file>` say `>...`"). If you
   cannot quote the offending text, the finding is inadmissible.

3. **Line-count check.** Before claiming a proof is "terse" or
   "sketchy", record `wc -l <file>`. A `.md` over 30 lines is
   almost never legitimately "too terse"; over 80 lines, never.
   Include the line count in the finding header.

4. **Cross-reference resolution.** When a proof cites a label like
   `prop:foo`, run `find content -name 'foo*'` (or `grep -rl
   "label.*\"prop:foo\""`) before claiming the cited block is
   missing. Many "missing bridging lemma" findings turn out to
   reference blocks that already exist.

5. **Transitive-dependency check.** When claiming a conjectural-
   propagation violation (or any transitive `uses[]` issue), walk
   the dependency chain explicitly and quote each `uses[]` array
   in the path. Do not assert transitivity without a concrete
   chain.

A finding that fails any of checks 1-5 must be dropped from the
report. Better to report 3 verified gaps than 18 with hallucinations.

### Phase 1 — Scope

Identify the audit target:

1. Single block: `content/<paper>/<chapter>/<block>.{ts,md,lean}`
2. Chapter: all proof blocks in `content/<paper>/<chapter>/`
3. Paper: full DAG walk
4. Branch diff: only blocks touched on the current branch

### Phase 2 — Intra-proof sweep

For each target proof, run checks A–E. For narrative proofs, a
lightweight agent pass over the `.md` is effective; for Lean, combine
with:

- `lean_diagnostic_messages` — raw sorry/admit/errors
- `lean_verify` — axiom audit (surfaces hidden `sorryAx`)
- `lean_goal` at each `sorry` — show the actual obligation

### Phase 3 — Inter-proof sweep

Build the local dependency slice:

```bash
cd content
bun run pipeline/content-graph.ts --block <label> --depth 2
```

For each edge, verify:
- The consumer block's proof actually uses the producer
- The producer's statement is strong enough for the consumer
- No implicit intermediate step is missing

### Phase 4 — Report

Produce a structured gap list (see Output format). **Do not** edit
blocks — hand off to `proof-editor` or the author.

## Output format

Each finding **must** include the Phase-0 verification metadata
(file path verified-exists, line count, quoted text). The format:

```
## Proof Gap Audit: <scope>

### Intra-proof gaps

#### <block-label> (<kind>) — <severity>
**File**: `<repo-relative-path>` (verified-exists ✓, <N> lines)
**Quoted** (lines X-Y):
> ...verbatim text from the proof .md...

- [existence]   <gap description>
                → <fix>
- [uniqueness]  ...
- [hand-wave]   ...
- [lean]        `sorry` at line N — criticality: <routine|core|restates-target>, `-- Ref:` status: <none|present>

### Inter-proof gaps

#### Missing bridging lemmas
- `thm:lifting-exists` proof uses "pullback preserves monos" —
  not stated as a proposition.
  **Cited-block existence check**: `find content -name 'pullback-mono*'`
  → no match. Candidate: `prop:pullback-mono` (immediate from Mathlib
  `CategoryTheory.Limits.pullback_mono`).

#### Broken chains
- `prop:hodge-decomp` cites `lem:harmonic-decomp` which is only
  stated in prose (Ch 4 §2). Promote to a lemma block.

#### Conjectural propagation violations
- `thm:main-ratio` depends transitively on `conj:strong-hypothesis`.
  **Chain (each `uses[]` quoted)**:
  - `thm:main-ratio` uses: `["prop:intermediate-bound", ...]`
  - `prop:intermediate-bound` uses: `["conj:strong-hypothesis", ...]`
  → Demote `thm:main-ratio` to `conjecture`.

### Summary
- Proofs audited: N
- Intra-proof gaps: N critical, N major, N minor
- Inter-proof gaps: N missing lemmas, N broken chains, N propagation errors
- Handoff: proof-editor (with this report as input)
```

## Severity

| Severity | Meaning | Example |
|----------|---------|---------|
| **critical** | Proof is invalid as written | Circular dependency, conjecture-propagation violation, unresolved existence, `restates-target` gap |
| **major** | Proof is plausibly repairable but currently incomplete | Missing bridging lemma, uniqueness not shown, `core` gap (key insight deferred) |
| **minor** | Stylistic / readability | "Clearly" where a one-line justification would suffice |

## Integration

- **Consumes**: `proof-status-tracking`, `content-graph`, `lean-proof-review`
- **Feeds**: `proof-editor` (coordinator that turns gaps into
  author-ready suggestions)
- **Complements**: `remark-audit` (which checks that remarks back onto
  formal statements — this skill checks the formal statements
  themselves have no gaps)
- **Distinct from**: `lean-completeness-audit` (coverage of LaTeX by
  Lean), `proof-simplifier` (reducing verbose proofs)

## Checklist

- [ ] Every proof has been walked for patterns A–E (intra)
- [ ] Every cited fact has a source (block, import, or `-- Ref:`)
- [ ] The `uses[]` graph matches the actual proof dependencies
- [ ] No theorem transitively depends on a conjecture (or it's demoted)
- [ ] `sorry`/`admit` sites all carry `-- Ref:` citations
- [ ] Every `sorry`/gap classified `routine` | `core` | `restates-target`; **no `restates-target` gaps**
- [ ] Report produced with severity levels and remediation suggestions
- [ ] No edits made — handoff to `proof-editor` or author
{% endraw %}
