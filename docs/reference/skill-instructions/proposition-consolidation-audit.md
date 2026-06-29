---
layout: default
title: /proposition-consolidation-audit
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/proposition-consolidation-audit.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/proposition-consolidation-audit.md) — do not edit here.

{% raw %}
# /proposition-consolidation-audit

## Goal

Help the reader by **collapsing redundant exposition**: simply-stated
theorems with nice simple corollaries, not a forest of overlapping
propositions each handling its own special case. The author's
preferred shape:

| Anti-pattern (what we audit for) | Refactored shape |
|----------------------------------|------------------|
| `prop:foo-general` + `prop:foo-A=2` + `prop:foo-A=3` | `prop:foo-general` (theorem) + one explicit corollary listing the standard specialisations |
| Two `proposition` blocks with the same boxed identity, one general and one specialised | `proposition` (general) + `corollary` (specialisation), narrative one-line derivation |
| `prop:X` and `prop:Y` both state the same theorem, one with operator-valued coefficient, one with scalar — neither cites the other | One parent prop + one corollary; parent's `uses` includes none of Y's parents, Y is rewritten as a corollary |
| `prop:X` whose proof is "follows from `prop:Y` by substituting $n_i = 3$" | Demote `prop:X` to `corollary`, label `cor:X`, change kind |

## Out of scope

- **NOT a logical-equivalence audit.** Two distinct theorems with the
  same conclusion but different hypotheses are NOT consolidation
  candidates. See `local/proof-narrative-lean-equivalence` for that.
- **NOT a notation-collision audit.** Two blocks using the same
  symbol for different objects is `local/ontologist` territory.
- **NOT a section-reordering audit.** That's
  `local/chapter-complexity-review`.

## When to invoke

- Large new tranche of theorems landed in a chapter, want to check
  whether they introduce redundancy.
- Reader feedback: "this chapter is too long" / "there's a lot of
  special-casing".
- After authoring a new general parent theorem (this skill's birth
  case): check whether old specialised props should be demoted.
- Periodic: `/integration-watch consolidation` for a sweep.

## Inputs

```
/proposition-consolidation-audit                          → ask which chapter
/proposition-consolidation-audit chapter-A                → just that chapter
/proposition-consolidation-audit chapter-A chapter-B      → both chapters
/proposition-consolidation-audit all                      → whole paper
```

## Detection heuristics (ranked by signal strength)

### H1. Explicit "specialisation" wording (HIGH signal)

`grep -rE "specialisation of|special case of|corollary of|setting .* = " <chapter>/*.md`

If `prop:X.md` says "specialisation of `prop:Y`" / "setting `<param>
= <value>` in `prop:Y`", then `prop:X` is almost certainly demotable.
**Action**: change kind to `corollary`, rename label `prop:` →
`cor:`, add `uses: prop:Y`.

### H2. Same boxed equation under different parametrisation (HIGH signal)

For every `prop` / `thm` / `lem` block, extract the boxed identity
(content inside `$$ \boxed{...} $$` or the first display equation
under the **Proposition** banner). Normalise: replace bound-variable
names (α, β, λ, μ, ν, n, m, k, i, j, …), strip subscripts/superscripts
that are pure index, lowercase tag names. Group blocks whose
normalised forms are >70% string-similarity (Levenshtein) or share
the same structural pattern (e.g. the same identity skeleton with
bound variables renamed).

A group of size > 1 is a consolidation candidate. **Action**:
identify the most general member (smallest assumptions / largest
hypothesis space); demote the rest to corollaries citing it.

### H3. Sibling parents in `uses[]` (MEDIUM signal)

Two blocks A, B with `A.uses ∩ B.uses` covering > 70% of A.uses, and
both being `proposition`/`theorem`/`lemma`, where neither cites the
other, are candidates for sibling-merger.

`bun run pipeline/uses-overlap-audit.ts <chapter>` (script to add)
computes the matrix.

### H4. Identical citation tuple (LOWER signal)

Two propositions citing identical `cites: [a, b, c]` from the
references registry. Often two formulations of the same source
result. Manually confirm.

### H5. Identical tag set (LOWER signal)

Two propositions whose `tags` arrays are within 1 element of each
other. Useful as a secondary filter on top of H1/H2.

## Procedure

For each chapter in argument list:

### 1. Inventory

```bash
# Find all proposition/theorem/lemma/corollary blocks in the chapter
grep -lE "^export default (proposition|theorem|lemma|corollary)" \
  content/<paper>/<chapter>/*.ts
```

Build a table: `label | kind | title | uses | cites | tags | line count`.

### 2. H1 sweep — explicit specialisation hits

```bash
grep -nE "specialisation of|special case of|corollary of|specialising|specialise.*to|setting .* = " \
  content/<paper>/<chapter>/*.md
```

For each hit:
- Read the cited parent's `.md` to confirm the relationship is genuine.
- Check the child's block kind in the `.ts`. If it's still
  `proposition`, this is an H1 finding.

### 3. H2 sweep — boxed-equation similarity

```python
# pseudocode for the helper script
for block in chapter_blocks:
    body = read_md(block)
    eqs = extract_display_eqs(body)
    canonical = normalise(eqs[0])  # first display eq
    sig = (canonical, kind)
    sig_buckets[sig].append(block)

for sig, blocks in sig_buckets.items():
    if len(blocks) > 1:
        report("H2 candidate", blocks)
```

(For the first cut, run grep + manual inspection rather than
implementing the helper. The skill's value is the heuristic
checklist; the script is an optimisation.)

### 4. H3 sweep — uses-overlap

For each pair of provable-kind blocks in the chapter:
```
overlap = |A.uses ∩ B.uses| / max(|A.uses|, |B.uses|)
```
Report pairs with `overlap > 0.7` AND neither cites the other.

### 5. Compose findings

For each candidate group, write a short paragraph:

```
[FINDING N — H1]
parent: <label> (file)
candidate child: <label> (file)
relationship: <one-line>
proposed action: demote child to corollary OR merge OR delete
estimated churn: <files touched>
```

### 6. Surface to user with AskUserQuestion

Per AGENTS.md "User accessibility" — multiSelect: true, 🟡 marker,
rich context. One question per finding group OR a consolidated
"apply N findings" question when findings are independent.

```
🟡 Waiting on user — consolidation findings for <chapter>:

FINDING 1 (H1): cor:foo ⊆ prop:bar (explicit "specialisation of")
  Files: foo.{ts,md} (kind change + label rename), bar.ts (no change)
  Estimated churn: 2 files, 1 consumer rewire
  Action options:
    1. Demote (kind → corollary, label cor:foo, narrative rewrite)
    2. Delete (merge narrative into bar.md, rewire consumers)
    3. Skip (the parametrisations are pedagogically distinct)
    4. Defer to follow-up branch

FINDING 2 (H2): prop:baz and prop:qux share boxed identity ...
  ...
```

## Applying a consolidation (mechanical pattern)

### Pattern A — demote to corollary

1. **`.ts`**: change `proposition(` → `corollary(`, change
   `label: "prop:X"` → `label: "cor:X"`, add the parent prop to
   `uses[]`.
2. **`.md`**: rewrite header `**Proposition.**` → `**Corollary (X
   case of [`prop:Y`](Y.md)).**`. Replace standalone proof with a
   2-3 line derivation pointing back to the parent. Keep
   computational/witness sections.
3. **`.lean`**: usually no change needed (the Lean declaration name
   doesn't have to match the label slug). Update the internal
   `Status.` comment to read "Corollary of …".
4. **Consumers**: `grep -rln "prop:X" content/ --include="*.ts"` →
   replace with `cor:X`.
5. **Chapter manifest**: if the slot name (file basename) is unchanged,
   no manifest update needed.

### Pattern B — delete

1. **`.ts`/`.md`/`.qa.json`**: `git rm`.
2. **`.lean`** (if no other content cites it): `git rm`.
3. **Consumers**: rewire `uses[]` to the parent prop.
4. **Chapter manifest**: remove the slot.
5. **Narrative**: absorb any unique paragraphs (compute pointers,
   verification records) into the parent's `.md`.

### Pattern C — merge

1. Pick the more general statement as the survivor.
2. Add a clearly-labeled subsection to the survivor's `.md` covering
   the specialised case (one-sentence "Specialisation: when X = Y,
   the identity reduces to …").
3. Delete the specialised block.
4. Rewire consumers.

## Output

End the run with:

- A short consolidation report (one chapter per section).
- Each finding tagged with severity (H1 / H2 / H3 / H4 / H5).
- An AskUserQuestion (multi-select) listing which findings to apply.
- For "apply N findings" answers, perform the consolidations on the
  current branch and commit one consolidation per commit (cherry-
  pickable).

## Integration with `/integration-watch`

A `consolidation` chip in the dispatcher's `AskUserQuestion`:

```
/integration-watch consolidation              → just this audit
/integration-watch proof consolidation         → in parallel with proof
/integration-watch all                         → includes consolidation
```

Per the `local/integration-watch` argument grammar, dispatch this
skill as a child whose Monitor watches for new `proposition` /
`theorem` blocks added to `origin/main` and re-runs H1+H2 on the
new block against its chapter neighbours. New consolidation
candidates surface as PR-level findings.

## Anti-patterns

- ❌ **Aggressive merging across chapters.** A proposition that
  appears similar to one in another chapter is usually a
  cross-reference, not a duplicate. Cross-chapter consolidation
  is escalated to the author.
- ❌ **Demoting a theorem to a corollary purely on H4/H5 (cites/tags).**
  These are weak signals. Require an H1 or H2 hit to take action.
- ❌ **Deleting a block with a unique witness** (`computation:` field
  pointing to a script that has no other reference). The witness
  may be the only evidence that the block holds; merge the witness
  into the survivor first.
- ❌ **Renaming a label without grepping for consumers.** `prop:X` →
  `cor:X` requires updating every `uses[]` array. Missing one
  silently breaks the manifest.
- ❌ **Auto-applying H1 findings without reading both `.md` files.**
  The "specialisation of" wording is sometimes wrong, especially in
  older blocks written before the parent existed.

## Example session

```
User: /proposition-consolidation-audit chapter-A

→ Inventory: 47 provable blocks in the chapter.

→ H1 sweep: 3 hits
  - prop:special-case-1.md says
    "specialisation of (prop:general-result)"
  - prop:special-case-2.md says
    "reduces to the disjoint case…" (no explicit specialisation
    wording, falls to H2)
  - prop:already-corollary.md says "Generic case of …"
    (already cites the parent in uses[]; no action)

→ H2 sweep: 1 candidate group
  - prop:special-case-1 + prop:special-case-2
    share the boxed identity F(Π x_k) = Σ c_{μ} Π g_{μ_k}(x_k)
    (special-case-2 is the setting <param> = <value> specialisation
    of special-case-1)

→ Consolidated findings:
  1. demote prop:special-case-1 → cor: under
     prop:general-result (H1)
  2. delete prop:special-case-2, absorb narrative into
     cor:special-case-1 (H1+H2)

🟡 Waiting on user — apply findings? [multi-select]
  □ Apply finding 1 (demote special-case-1)
  □ Apply finding 2 (delete special-case-2)
  □ Apply both
  □ Defer to follow-up branch
```
{% endraw %}
