---
name: proof-conciseness
roles: [collaborator, owner]
description: >
  Tighten narrative (human-readable) proofs without changing
  mathematical content. Targets verbose prose patterns in
  `.md` proof files — padding phrases, re-explained elementary
  steps, redundant restatement, long case analyses that collapse
  into tables. Complements proof-simplifier (Lean tactics) and
  readability-editing (chapter prose); this skill operates on the
  proof block's `.md` specifically and preserves every logical step.
allowed-tools: Read Edit Bash Grep Glob
---

# Proof Conciseness

## Purpose

Mathematical proofs in `.md` files tend to accumulate words over
drafts: the author re-explains an elementary step for clarity,
restates the proposition at the top, chains parentheticals, pads
with transitional phrases. A published proof should cut these
without cutting any step of the argument.

**This skill removes words, not reasoning.** Every logical step
in the original proof survives. The output is shorter, denser,
and — when done well — easier to read, not harder.

## Contrast with related skills

| Skill | Target | Acts on |
|-------|--------|---------|
| `proof-simplifier` | Lean proofs | tactic chains, local block clusters |
| `proof-exposition-review` | Narrative proofs | integrating newly-added blocks |
| `readability-editing` | Chapter text | clarity, flow, grammar |
| `scientific-accuracy` | All prose | correctness of claims |
| **`proof-conciseness`** | **Narrative proofs** | **verbosity without reasoning loss** |

Workflow pairing: run `scientific-accuracy` first to lock
correctness, then `proof-conciseness` to tighten, then
`readability-editing` for final flow.

## When to Use This Skill

- Pre-publication pass on chapters with long proofs
- When a proof `.md` is over 50 lines and the underlying argument
  is "maybe 15 lines worth"
- When reviewers say "the proof is hard to follow because it says
  too much"
- After `formalizer` has left a proof in place but the narrative
  version is now bloated relative to the Lean version
- **Not** for expanding terse proofs (use `proof-gap-audit` for
  that — different direction)

## What to cut (verbosity patterns)

### A. Padding phrases

| Cut | Keep |
|-----|------|
| "We now show that..." | (just show) |
| "It is clear that..." (when it is) | (drop the phrase, keep the claim) |
| "First, we note that..." | (state the observation) |
| "It follows from the above that..." | "Hence..." |
| "We have now established that..." | (drop; restatement unnecessary) |
| "In what follows, we will..." | (just do it) |

### B. Restated hypotheses

If the proposition statement is immediately above the proof, do not
open the proof by re-quoting it. The reader has just read it. Open
with the first actual step.

### C. Over-explained elementary steps

| Verbose | Concise |
|---------|---------|
| "Since $a = b$ and $b = c$, by transitivity of equality, $a = c$." | "Chaining the two equalities: $a = c$." (or omit if trivial) |
| "Because multiplication distributes over addition, we can expand: $a(b+c) = ab + ac$." | "$a(b+c) = ab + ac$ (distributivity)." |
| "Applying the definition of X, we see that X(y) = ..." | "By definition, $X(y) = \ldots$." |

Rule: if the step is a one-symbol Lean tactic (`simp`, `ring`,
`rfl`, `unfold`), the narrative can usually be one phrase.

### D. Redundant cross-references

| Verbose | Concise |
|---------|---------|
| "As we saw in §3.2 Proposition 3.4, which states that for all $x \in X$ we have $P(x)$, applying this to $x_0$ gives $P(x_0)$." | "By [Prop 3.4](#prop:x), $P(x_0)$." |

One citation = one hyperref. Do not restate the cited result.

### E. Case analyses that collapse to tables

Multiple cases differing only in parameter values become a table.
Five paragraphs each of the form "In case $i$, we have $A_i = B_i$"
become one table with $i \in \{1, 2, 3, 4, 5\}$.

### F. Duplicate summary at end

"Combining the above, we have shown that..." followed by the
proposition verbatim. Delete — the reader can see the proof ended.

### G. Nested parentheticals

Chained `(X, which is Y, by Z, which generalizes W)` constructions.
Pull one fact into a footnote or short follow-up sentence.

### H. "Scene-setting" preambles

"Before giving the proof, we fix notation. Throughout, let..." If
the notation is paper-wide, cite the ontology block (§conventions).
If it's proof-local, declare it in one line.

## What NOT to cut

- **Any logical step.** If removing a sentence changes the
  argument's dependency chain, keep it. The test: could a careful
  reader reconstruct the proof from the remainder? If no, keep it.
- **Citations.** Dropping `\cite{}` to "save a word" breaks
  attribution — never do this.
- **Hypotheses being invoked.** "By the non-degeneracy of $\int_A$,
  ..." must stay so the reader knows which hypothesis is firing.
- **Critical WLOG justifications.** "Without loss of generality
  $n > 0$ (otherwise the claim is vacuous)" is short; keep it.
- **Domain-interpretation sentences.** If a step has a meaning in the
  paper's application domain (a physical, geometric, or operational
  reading), keep one sentence relating the math to that interpretation
  — this is often half the paper's value.
- **Transitions between major steps.** A one-liner like "Step 1
  establishes X; we now deduce Y." helps a long proof. Keep it
  if the proof has >4 steps.

## Workflow

### Phase 1 — Target the block

Identify the proof `.md`. Record:

- Current line count (`wc -l`)
- Current word count (`wc -w`)
- Number of display-math blocks
- Whether it is followed by a remark interpreting it (keep the
  proof terse; the remark carries the interpretation)

### Phase 2 — Read for pattern matches

Go through the proof top-to-bottom. Mark each candidate cut with
the category (A–H) from the table. A line can match multiple
categories.

### Phase 3 — Sanity-check each proposed cut

For each marked cut, verify:

1. No logical step is being removed (re-read with the cut applied;
   does the argument still close?)
2. No hypothesis invocation is lost
3. No citation is dropped
4. No domain-interpretation sentence is collapsed
5. If a case analysis is being tabulated, the table preserves all
   cases

### Phase 4 — Draft the tightened version

Apply cuts. Produce the revised `.md` text.

### Phase 5 — Report before/after

Show the author:

- Before/after line and word counts
- The categories of cuts applied (A: N, B: N, ...)
- Any sentences that were *kept* despite matching a verbosity
  pattern (with the reason — usually it carried a hypothesis
  invocation or domain meaning)
- Proposed edits as diff or side-by-side

## Output format

```
## Proof Conciseness: <block-label>

**File**: `<repo-relative-path>` (verified-exists ✓)
**Before**: <L> lines / <W> words / <M> display-math blocks
**After** (proposed): <L'> lines / <W'> words / <M> display-math blocks
**Reduction**: -<Lδ>% lines, -<Wδ>% words

### Cuts by category

| Category | Count |
|---------|------:|
| A. Padding phrases | N |
| B. Restated hypotheses | N |
| C. Over-explained elementary | N |
| D. Redundant cross-references | N |
| E. Case→table collapse | N |
| F. Duplicate summary | N |
| G. Nested parentheticals | N |
| H. Scene-setting | N |

### Representative cuts

Before (line X):
> It is easy to see that, since we have established $X = Y$ above,
> by transitivity of equality we can conclude that $X = Z$ from the
> fact that $Y = Z$.

After:
> Chaining $X = Y$ and $Y = Z$: $X = Z$.

### Sentences kept despite verbose pattern

- Line N matched Category A ("We now show that..."), but the
  phrase introduces Step 3 of a 5-step proof and the transition
  genuinely aids the reader. Kept.

### Proposed diff

```diff
- ...verbose text...
+ ...concise text...
```

### Next actions (author picks)

1. Apply all proposed cuts
2. Apply only cuts in categories A, C, F (low-risk)
3. Apply only the case→table collapse (E)
4. Reject — prefer current verbosity
5. Apply cuts and re-run `readability-editing` for flow
```

## Measurement

After applying cuts, the proof should satisfy:

- **Word count**: typically 20–40% reduction for bloated proofs;
  5–15% for already-tight ones
- **Logical step count**: unchanged
- **Cross-reference count**: unchanged (or increased if D-cuts
  replaced re-statements with citations)
- **Display-math count**: unchanged

If any of these shift unexpectedly, re-audit the diff.

## Role gating

- **collaborator**: may propose and apply cuts on proof blocks in
  chapters they're working on.
- **owner**: may apply cuts across the whole paper; also authorises
  structural changes (e.g. merging two proof blocks after the cuts
  reveal redundancy).

## Integration

- **Invoked by**: author directly, or `proof-editor` during a
  comprehensive pre-publication pass
- **Dispatches to**: `readability-editing` (for flow polish after
  cuts), `content-validation` (to confirm cross-refs still resolve)
- **Complements**: `proof-simplifier` (Lean side),
  `proof-exposition-review` (integrating new content),
  `scientific-accuracy` (correctness gate — run before this skill)
- **Pairs with**: `one-voice-style-guide` (author voice profile) and `one-voice-audit` (mechanical sweep for status leaks)

## Checklist

- [ ] Proof `.md` read top-to-bottom
- [ ] Each verbose pattern (A–H) marked
- [ ] Each proposed cut sanity-checked against logical/
      hypothesis/ citation/ domain-meaning preservation rules
- [ ] Before/after metrics reported (lines, words, math count)
- [ ] Diff produced; author sees exact changes
- [ ] No mathematical content removed
- [ ] GitHub blob URL for the affected `.md` (default `.md` per
      AGENTS.md)
- [ ] Edits applied only after author approves
