---
name: proof-exposition-review
roles: [collaborator, owner]
description: >
  Paper-wide retrospective review of a single proof block. Given the
  current state of the paper — including all blocks added since the
  proof was written — suggest simplifications to the statement,
  proof, or surrounding exposition. Complements proof-simplifier
  (which operates on 2-4 block local clusters) by considering the
  full dependency graph and all recently-added content.
allowed-tools: Read Grep Glob Bash Agent
---

# Proof Exposition Review

## Purpose

When a proof is first written, the author cites what's available at
the time. As the paper grows, new definitions, lemmas, and witnesses
accumulate that might simplify existing proofs — but the original
author rarely revisits every proof to integrate them. This skill
does that revisit.

For each target prop/theorem/lemma/corollary:

1. Re-read the statement and the proof `.md`
2. Scan the full paper for blocks added after the proof was written
   (or blocks the proof doesn't cite) that would shorten, clarify,
   or strengthen the exposition
3. Propose concrete edits: citations to add, arguments to replace,
   hypotheses to drop, restatements to adopt
4. Flag whether the proof should be restructured (not just tweaked)

## When to Use This Skill

- Pre-publication sweep: "before we submit, revisit every proof"
- After a large batch of new content (e.g. §J extractions from
  proof-gap-audit produced new bridging lemmas)
- When the author notices a proof feels stale: "I wrote this before
  we had `prop:X`; does it use it now?"
- During `proof-editor` dispatch (coordinator passes blocks to this
  skill)
- **Not** for tactic-level cleanup — use `proof-simplifier` instead

## Difference from `proof-simplifier`

| Skill | Scope | Unit | Focus |
|-------|-------|------|-------|
| `proof-simplifier` | 2-4 connected blocks | tactic chain / block text | local redundancy |
| `proof-exposition-review` | full paper | one block's statement + proof + surrounding prose | retrospective integration |

Both may fire on the same target, but `proof-simplifier` asks "are
these three proofs redundant with each other?" and
`proof-exposition-review` asks "is this one proof still the best
way to say it given everything else the paper now contains?"

## Workflow

### Phase 1 — Target the block

Read the proof `.md` and its statement `.md`. Record:

- Statement claim (what the block proves)
- Current proof length (`wc -l`)
- Current `uses[]` array
- Current `cites[]` array
- Date of last substantive edit (`git log -n 3 --oneline -- <file>`)

### Phase 2 — Scan for integrable content

Build the candidate set:

1. **All blocks added after the proof's last edit**
   ```bash
   git log --diff-filter=A --name-only --pretty=format: \
       --since="<last-proof-edit-date>" content/<paper>/ \
     | grep '\.ts$' | sort -u
   ```
2. **Blocks sharing tags with the target**
   ```bash
   # $TARGET_TS resolves to the absolute path of the block's .ts manifest
   grep -l "$(bun -e "import(\"$TARGET_TS\").then(m => console.log(m.default.tags.join(\"|\")))")" \
       content/<paper>/**/*.ts
   ```
3. **Propositions that interpret or generalize what the proof does**
   (same keywords in title; same labels in other blocks' `uses[]`)
4. **Computational witnesses** under `computations/`
   matching the proof's topic

### Phase 3 — Check each candidate

For each candidate block `B` in the integrable set, ask:

| Question | If yes → |
|---------|---------|
| Does `B` state a lemma the proof currently re-derives inline? | Add `B.label` to `uses[]`, replace the inline derivation with a one-line citation |
| Does `B` provide a shorter construction of the same object? | Restate the proof using `B`'s construction; drop the old one |
| Does `B` tighten a hypothesis (proof works more generally than stated)? | Weaken the statement to match `B`'s level of generality |
| Does `B` have computational witnesses relevant to a numerical claim? | Cite the witness (`computations/*.witness.json`) in the prose |
| Does `B` supersede the proof entirely (a later theorem implies the earlier one trivially)? | Consider demoting the proof to a corollary of `B`, or merging |
| Does `B` add notation/conventions that would make the proof clearer? | Adopt the new notation in the proof `.md` |

### Phase 4 — Check for repeated-invocation (§J) opportunities

Per `proof-gap-audit.md §J`, if the proof cites the same block 3+
times under identical conditions, propose extracting a specialisation
lemma. (This heuristic is shared with `proof-simplifier`.)

### Phase 5 — Narrative cleanup

Beyond the logical structure, check the prose:

- Does the proof open with context that's now covered by earlier
  blocks? (e.g. re-explaining notation the reader has seen)
- Are there forward references now resolved by completed work?
- Are there stale parenthetical remarks ("will be proved later",
  "conjecturally", "assuming X") that should be updated?

### Phase 6 — Produce suggestions

One consolidated report per target block. Do not edit files.

## Output format

```
## Exposition Review: <block-label>

**File**: `<proof-path>` (<N> lines, last edited <date>)
**Statement**: <one-line summary>
**Current uses[]**: [<list>]

### Integrable content found

| Block added after proof | Relevance | Suggested integration |
|------------------------|-----------|----------------------|
| `prop:foo` (YYYY-MM-DD) | states `lem:inline-step` already | add to uses[]; replace lines X-Y with citation |
| `rem:baz` | cleaner notation | adopt $\varrho$ instead of $\gamma$ in lines A-B |
| `computations/bar.witness.json` | numerical backing | add sentence "computationally verified at the reference parameter value" |

### Repeated-invocation (§J)

- Proof cites `def:X` 4 times with same hypothesis suffix → extract `lem:X-specialisation`

### Structural suggestions

- Proof could be demoted to a corollary of `thm:Y` (added after this proof)
- Statement can be generalized from "for rank-2 objects" to "for any rigid object" given `lem:Z`

### Prose cleanup

- Line N: "will be proved in Ch 5" is now stale — `prop:W` proves it
- Line M: re-explains "weight decomposition" which is now well-known from §<earlier>

### Estimated impact

- Proof length: <before> → <after> lines
- Dependencies: +<N> citations, -<M> inline derivations
- Hypotheses: <same | weakened | strengthened>

### Next actions (author picks)

1. Apply all suggestions
2. Apply only the integration suggestions, skip restructuring
3. Apply only prose cleanup
4. Defer — proof is fine as-is
5. Demote to corollary / merge with `thm:Y`
```

## Role gating

- **collaborator**: can invoke this skill on any block in the paper
  they're working on
- **owner**: can invoke on all blocks, and can approve structural
  suggestions (demotion / merging)

## Integration

- **Invoked by**: `proof-editor` as part of a comprehensive review
  pass, or directly by the author on a single block
- **Dispatches to**: `proof-simplifier` (for approved local cluster
  changes), `content-validation` (after edits), `ontologist` (if
  notation changes are needed)
- **Reads from**: the full block DAG, git history, computational
  witness directory
- **Complements**: `proof-gap-audit` (which looks for missing
  content) — this skill looks for missing uses of existing content

## Checklist

- [ ] Target block statement + proof read in full
- [ ] Integrable candidate set built (post-proof-edit content)
- [ ] Each candidate checked against the integration questions
- [ ] §J repeated-invocation check performed
- [ ] Structural options considered (demotion, merger, generalization)
- [ ] Prose staleness checked
- [ ] Report produced; no edits made
- [ ] GitHub blob URLs for all cited blocks (default `.md`)
