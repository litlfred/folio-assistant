---
layout: default
title: /proof-integration-watcher
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/proof-integration-watcher.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/proof-integration-watcher.md) — do not edit here.

{% raw %}
# /proof-integration-watcher

A concrete instance of [`local/integration-watcher`](integration-watcher.md).
The parent encodes the shared mechanics (Monitor, subscriptions,
queue, ledger, idle sweep, author-ask, watch-PRs-you-prepare,
sibling-PR comment protocol, witness-drift recovery, billing
quick-fail, post-completion one-voice). This file fills the nine
domain-specific slots A-I.

**Setup:** use `NAME=proof-integration-watcher` everywhere the
parent's §1 references `${NAME}`. Files land at
`.beans/proof-integration-watcher-queue.json` and
`.beans/proof-integration-watcher-ledger.md`.

## Slot A — Goal statement

No bare `sorry`, no new axioms beyond the accepted set
(`Classical.choice`, `Quot.sound`, `propext`, and any
`-- Ref:`-cited axiomatic conjectures per the project authoring conventions-cond), and
no naked `conjecture` blocks whose downstream scaffolding is
actually provable. Conjectures that genuinely need axiomatisation
as Lean classes per §3b-cond are fine.

## Slot B — §3 trigger filter

For a `MAIN <sha> <msg>` line (or PR commit event):

```bash
SHA=<event sha>
changed=$(git diff-tree --no-commit-id --name-only -r "$SHA")

is_proof_event=false
echo "$changed" | grep -qE '(^|/)proof.*\.md$|(-proof|_proof)\.md$' && is_proof_event=true
echo "$changed" | grep -qE '\.lean$'                              && is_proof_event=true
echo "$changed" | grep -qE 'content/.*\.md$' && {
  # An .md without "proof" in its name still counts if its sibling
  # .ts is a proof-kind block.
  for md in $(echo "$changed" | grep -E 'content/.*\.md$'); do
    ts="${md%.md}.ts"
    [ -f "$ts" ] && grep -qE '^export default (theorem|lemma|proposition|corollary|conjecture|definition)\(' "$ts" && is_proof_event=true
  done
}
```

For PR review-comment events, pass through if the comment body
mentions: `sorry`, `axiom`, `proof`, `conjecture`, OR cites a
content block label.

## Slot C — §4b dispatch table

| Specialist | When to run |
|------------|-------------|
| `proof-gap-audit` | Always (intra + inter gaps) |
| `proof-narrative-lean-equivalence` | **Whenever `.lean` is touched OR exists for the block** — covers the four drift classes A/B/C/D + the **missing-narrative** check (`.lean` exists, `.md` absent or stub-only) |
| `lean-proof-review` | If `.lean` changed |
| `lean-completeness-audit` | If `.ts` `kind` requires Lean and `.lean` is missing |
| `remark-audit` | If kind is `remark` |
| `proof-triage` | Always — produces fresh sorry inventory for the queue |

**Lean ↔ narrative coupling rule (STRICT):** for every block where
`.lean` exists, also check (1) `.md` presence + non-triviality and
(2) semantic match per the four drift classes.

### Sidecar criteria → Lean skill mapping

The 5 proof criteria registered in `qa-criteria-registry.ts §PROOF`
each route to a specific existing Lean skill on `fail`. This is
how `qa-sweep --axis proof` finds work to do, and how
`/integration-backlog proof` knows which agent to dispatch per
batch.

| Criterion | Reviewer kind | Routes to | Failure handler |
|-----------|---------------|-----------|-----------------|
| `proof-no-bare-sorries` | script | `proof-status-tracking` + `proof-gap-audit` | Add `-- Ref: [key] <url>` per the project authoring conventions |
| `proof-no-axiom-growth` | script | `lean-witness-audit` | Investigate new axiom dep; usually demands a proof refactor or an `axiom` declaration with `-- Ref:` |
| `proof-build-green` | script | `lean-build-fix` | Walk failure log → patch `.lean` → re-build |
| `proof-lean-compiles` | script | `lean-build-fix` | Invoke `mcp__lean-lsp__lean_diagnostic_messages` on the `.lean` file; read compiler errors; patch → re-check |
| `proof-narrative-lean-equiv` | agent | `proof-narrative-lean-equivalence` | Adjudicate the four drift classes A/B/C/D |
| `proof-substantive` | script | `lean-substantive-pass` | Bulk-split typed sub-claims; replace `holds:Prop` with hypothesis |
| `proof-statement-integrity` | agent | `lean-proof-review` (Review Type 4) | Signature-diff vs prior commit + `lean_verify` axiom sweep; FAIL on weakened statement / `sorryAx` |
| `proof-no-self-assuming-projection` | agent | `lean-proof-vacuity-audit` | Confirm proof is not `:= d.<conclusion-field>` (or `⟨d.claim_a,…⟩`) with sibling hyps unused; fix → genuine proof / §3b-cond / honest `axiom`+`-- Ref:` / demote to `conjecture` |
| `proof-no-trivial-true` | agent | `lean-proof-vacuity-audit` | Flag conclusion `True` / `x=x` / `holds:Prop:=True` with hypotheses unused; fix → restore the real statement + honest proof or `sorry`+`-- Ref:` |
| `proof-no-false-premise` | agent | `lean-proof-vacuity-audit` | Flag theorem resting on `False` or uninhabited type; fix → correct the premise or remove theorem if invalid |
| `proof-no-unused-hypotheses` | agent | `lean-proof-vacuity-audit` | Flag proofs that don't use all hypotheses; fix → remove unused hyps or use them if statement weakened |
| `proof-no-decide-masking` | agent | `lean-proof-vacuity-audit` | Flag non-trivial goals closed via `decide`; fix → structural proof or explicit justification |
| `proof-rater-strategy-clarity` | agent **(score)** | `proof-simplifier` / `proof-conciseness` | Score 0–1 → `score` field; if < 0.66, make the strategy explicit, re-rate |
| `proof-rater-goal-plausibility` | agent **(score)** | `proof-triage` / `lean-build-fix` | Score 0–1 (cross-ref gap-criticality); improve by discharging `routine` gaps, re-rate |
| `proof-rater-novelty` | agent **(score)** | `proposition-consolidation-audit` | Score 0–1; if redundant (~0), consolidate with the sibling, re-rate |

> **Rater rubric (scored, not gating).** The `proof-rater-*` criteria
> (AlphaProof-Nexus adoption) write a **0–1 `score`** to the block's
> `.qa.json` (`QaCriterionEntry.score`), NOT a merge gate. The watcher is the
> **rate** half (dispatch a rater agent per fresh proof block → write
> `score`); `/integration-backlog proof` is the **improve** half (drain
> ascending-score, apply the routed skill, **re-rate** to confirm the score
> rose). This raises *corpus* quality the way their Elo search raises sketch
> quality — but the population is the whole corpus, not a single proof.

Watcher invocation pattern:

```
1. qa-sweep --axis proof writes pass/fail entries to each block's .qa.json
2. proof-integration-watcher inherits §5a backlog discovery — reads
   the fail entries to produce its work queue
3. For each fail, dispatch the mapped skill above as an Agent call
4. Apply the skill's recommendation (auto-discharge if §4e band 0-3,
   author-ask if band 4+)
5. Re-run qa-sweep --only <criterion> after the fix to confirm pass
```

#### `proof-lean-compiles` — lean-lsp-driven compilation audit

This criterion uses the lean-lsp MCP server to get real compiler
diagnostics per `.lean` file, rather than relying solely on CI
artefacts (`proof-build-green`). The workflow:

1. **Populate the diagnostics cache.** Either:
   - Agent calls `mcp__lean-lsp__lean_diagnostic_messages(file_path)`
     per `.lean` file and writes results to
     `docs/audits/lean-compile-diagnostics.json`, OR
   - Run `bun run pipeline/lean-compile-audit.ts --list` to enumerate
     `.lean` files, then feed diagnostics via `--ingest`.
2. **qa-sweep reads the cache.** The `checkProofLeanCompiles` checker
   reads the cached diagnostics JSON; returns `n/a` when no cache
   exists, `pass` when no errors, `fail` with up to 10 error hits.
3. **On fail → `lean-build-fix`.** The watcher dispatches
   `lean-build-fix` with the specific error messages from the
   diagnostics. The lean-lsp tools (`lean_goal`, `lean_multi_attempt`,
   `lean_code_actions`) are used to interactively fix the errors.
4. **Re-check.** After fixing, re-invoke
   `lean_diagnostic_messages(file_path)` to confirm zero errors,
   then update the diagnostics cache.

### When the registry is updated

If a new proof criterion lands in `qa-criteria-registry.ts §PROOF`,
this dispatch table must be updated in the same PR. The
`/integration-audit proof` command will then mark existing sidecars
stale + the sweep will populate fresh entries.

## Slot D — §4c finding taxonomy

| Finding | Severity | Description |
|---------|----------|-------------|
| `uncited-sorry` | critical | `sorry` with **no** `-- Ref:` anywhere within: (a) the 6 lines above the sorry, **OR** (b) the 6 lines above the enclosing decl header. the project authoring conventions strictly requires the Ref **immediately above** the sorry; this finding catches the "no Ref reachable at all" case. The looser-but-not-strict case (Ref present somewhere in the enclosing decl but not adjacent to the sorry) is the **separate** `cite-position-hygiene` (minor) finding. The 2-tier split deliberately surfaces "missing entirely" as critical and "wrong position" as polish. |
| `hidden-axiom` | critical | New `axiom` declaration that isn't a §3b-cond class encoding |
| `drift-class-A` | critical | Lean stub-weakening — `theorem foo : True := trivial` while narrative claims something substantive |
| `conditional-class-violation` | critical | Theorem's `uses[]` transitively includes a `conj:` but the block isn't class-axiomatised per §3b-cond |
| `naked-conjecture` | major | `conjecture` block with no `.lean` sibling whose downstream scaffolding suggests it's provable |
| `gap-existence` | major | "There exists X" without construction |
| `gap-uniqueness` | major | "The unique X" without uniqueness lemma |
| `inter-proof-bridge` | major | Cited fact has no block / no import / no `-- Ref:` |
| `drift-class-B` | major | Lean proves a special case; narrative claims the general one |
| `drift-class-C` | major | Hypothesis count/strength mismatch between Lean and narrative |
| `missing-narrative` | major | `.lean` exists but `.md` sibling absent |
| `narrative-stub` | major | `.lean` exists but `.md` is < 5 body lines + no math |
| `lean-compile-error` | critical | `.lean` file has compiler errors (via `lean_diagnostic_messages` from lean-lsp MCP) |
| `drift-class-D` | minor | Notation drift (paper uses `$\varrho$`, Lean uses `gamma`, etc.) |
| `cite-position-hygiene` | minor | `-- Ref:` is in the enclosing decl body but not in the 6-line window above the sorry |
| `holds-prop-placeholder` | minor | Lean class has a `holds : Prop` (or `claim : Prop`) field with no type-level structure capturing the manuscript claim; .md sibling has numbered sub-claims OR an explicit boxed identity that could be typed |
| `claim-i-generic-docstring` | minor | Sub-claim fields `claim_i, claim_ii, ...` carry generic `/-- Manuscript sub-claim (i). -/` docstrings rather than manuscript-fragment summaries — symptomatic of an incomplete `lean-substantive-pass` |
| `mechanical-rename-without-md-check` | minor | Lean class has `claim : Prop` (singular) but .md has 2+ numbered sub-claims — bulk-rename was applied without checking .md structure; should be split into `claim_i, claim_ii, ...` |

## Slot E — §4d discharge bands (examples)

| Band | Examples |
|------|----------|
| **Auto-discharge** | `uncited-sorry` with goal matching positivity / ring / linarith / aesop / norm_num — try `lean_multi_attempt` with the canonical tactic set; `cite-position-hygiene` — move/add the `-- Ref:` line; `lean-compile-error` with simple import/namespace issues — fix import, re-check via `lean_diagnostic_messages` |
| **Auto-discharge (script)** | `holds-prop-placeholder` + .md has numbered sub-claims — run `.work/bulk-split-holds.py` on the file. `claim-i-generic-docstring` — run `.work/enrich-subclaim-docstrings.py`. `mechanical-rename-without-md-check` — run the bulk-split script (it handles the split case correctly) |
| **Auto-discharge (special)** | **Naked conjecture with fully-defined `uses[]` cone** — attempt discharge via `local/formalizer` + `local/lean-generation` before defaulting to author-assist. This is the *"if a conjecture is a placeholder for something to be proved, try"* clause of this watcher's mission. **`holds-prop-placeholder` with explicit boxed identity in .md** — invoke `local/lean-substantive-pass` to hand-craft typed sub-claims per the recognised manuscript patterns (boxed identity / piecewise / equivalence relation / table of moves / existence + uniqueness). |
| **Author-assist** | Class A stub-weakening, hidden axiom, naked conjecture without conditional-class scaffolding, broken inter-proof chain, conjectural-propagation violation |
| **Defer** | Minor stylistic gap, sorry already carrying `-- Ref:`, conjecture correctly class-axiomatised per §3b-cond |

### Author rules when writing class-axiomatised `.lean` stubs (§3b-cond)

When this watcher (or `local/formalizer`) authors a new
class-axiomatised `.lean` stub for a naked conjecture:

1. **Imports first, doc block second** (Lean v4.24+). Module
   documentation `/-! … -/` must come AFTER any `import`
   statements; placing it first causes parse errors in
   Lean v4.24.0 and later.

   ```lean
   import Mathlib.Data.Nat.Defs
   import Mathlib.Data.Real.Basic

   /-!
   # <Conjecture title>
   ...
   -/

   namespace MyPaper.<Module>
   ...
   ```

2. **Add the imports the opaque Props actually need.** If your
   opaque Prop signatures mention `ℕ`, import `Mathlib.Data.Nat.Defs`;
   `ℝ` → `Mathlib.Data.Real.Basic`; `ℂ` → `Mathlib.Data.Complex.Basic`;
   nothing math-y → `import Mathlib.Tactic` as a safe baseline
   (still places imports first per rule 1). Missing imports
   produce "unknown identifier" errors at every `Type*` site.

3. **Always set `lean.ref` in the sibling `.ts`** to the
   fully-qualified `<pkg>:MyPaper.<Module>.<ClassName>` URI matching
   the new namespace+class. Otherwise the watcher's Slot G
   discovery will still flag the block naked on the next pass.

4. **Cite the conjecture's source** in a `-- Ref:` immediately
   above the canonical instance's `sorry` field(s) per
   the project authoring conventions. Use `[manuscript]` if no published source.

5. **Verify locally** with `bun run validate <paper>` before
   pushing. The validate run won't catch Lean syntax errors
   (Lean isn't installed in CI here for content-only changes)
   but it will catch broken `lean.ref` resolution + schema
   shape issues.

## Slot F — §4e author-ask templates

For `missing-narrative` / `narrative-stub`:

> The Lean sibling at `<lean-url>` proves `<lean-statement>`.
> The narrative `.md` is `<missing | stub | claims X instead>`.
> Question: 1) write narrative to match Lean, 2) weaken Lean to
> match narrative, 3) split into two blocks?

For `naked-conjecture` (after auto-attempt failed):

> Naked conjecture `<label>` at `<url>` has no `.lean` sibling and
> discharge attempts via formalizer + lean-generation failed
> (tried tactics: <…>). Question: 1) author conditional-class
> encoding, 2) demote to remark with `interprets`, 3) mark wontfix.

For `drift-class-A` (stub weakening):

> Lean `<decl>` at `<url>` is `: True := trivial` while narrative at
> `<url>` claims `<substantive statement>`. Question: 1) write a
> real Lean statement + sorry with Ref, 2) demote narrative to a
> remark with `interprets`, 3) confirm stub is intentional (will
> record as Class-A acknowledged).

## Slot G — §5a backlog discovery

```bash
# 1. Proof-relevant content blocks
grep -rlE '^export default (theorem|lemma|proposition|corollary|conjecture|definition)\(' \
  content/ --include='*.ts' 2>/dev/null \
  | sort -u > /tmp/_pw_proof_blocks.txt

# 2. Uncited sorries — smart detection. Inline pseudocode:
#
#    DECL_RE  = ^(noncomputable\s+|@\[[^\]]+\]\s+)*(theorem|lemma|
#                 proposition|corollary|instance|def|example)\b
#    SORRY_RE = (^|\s)(sorry)(\s|$|\b)
#
#    For each .lean file:
#      1. Mark which lines are inside `/- ... -/` block comments.
#      2. For each line that is NOT in a block comment AND matches
#         SORRY_RE AND does not start with `--` AND does not contain
#         "sorry-free" or "no sorry":
#         a. Strip line-comment with `re.sub(r'--.*$', '', ln)`;
#            re-test SORRY_RE on the stripped form.
#         b. If a `-- Ref:` appears in the 6 lines above → cited.
#         c. Else walk backward to the nearest line matching DECL_RE;
#            if a `-- Ref:` appears in the 6 lines above the decl
#            header → cited.
#         d. Otherwise → `uncited-sorry` finding (critical).
#
#    Calling code lives in the watcher's session script (e.g. a
#    one-off block in the agent's working memory, NOT a committed
#    .py module). This avoids creating maintenance burden for a
#    function whose only consumer is the watcher's own backlog scan.
#
#    HARD-GATE — ground-truth cross-check (MANDATORY before queueing
#    any `uncited-sorry` as `severity: critical`):
#
#      Before adding an `uncited-sorry` finding to the watcher queue,
#      ALWAYS cross-check the heuristic flag against the Lean
#      elaborator's ground truth via the lean-lsp-mcp tool:
#
#        mcp__lean-lsp__lean_diagnostic_messages(file_path)
#
#      The elaborator reports REAL sorries — uses of the `sorry`
#      tactic or term — and never matches the word `sorry` inside
#      doc strings, block comments, or string literals. If the
#      diagnostic list for the file is empty (no `sorry`-class
#      warning) OR the file does not appear among the diagnostics,
#      the heuristic flag is a FALSE POSITIVE. Mark `status:
#      wontfix` with a one-line explanation; do NOT queue.
#
#      Historical false-positive shapes the heuristic has hit:
#        - Doc comment "(proved, no sorry)" — comment-stripping
#          regex on line above failed to suppress a `sorry` token
#          inside the parenthetical.
#        - Doc comment "Key properties (all proved, no sorry):" —
#          colon at end suppressed the "no sorry" exclusion.
#        - File with ZERO `sorry` tokens flagged due to recursion
#          in the SORRY_RE regex's tokenisation.
#
#      The hard-gate is non-optional. A watcher agent that queues
#      `uncited-sorry` items without running the diagnostic check
#      is an audit failure (per `proof-integration-watcher §6`
#      invariants, finding-class `false-positive-without-gate`).

# 3. Naked conjectures — REFINED:
#    A `conjecture` block is naked iff its `lean.ref` URI does NOT
#    resolve to an actual Lean declaration. Sibling-`.lean` presence
#    is NOT sufficient (the declaration may live in a chapter-level
#    module like `MyPaper/SomeChapter.lean`); sibling-`.lean` absence
#    is NOT sufficient (the ref may resolve via the grep fallback).
#
#    Note: there is no automated `lean-ref-resolves` rule in
#    `content/pipeline/validate.ts` today (it only enforces schema
#    shape + constraint rules). The watcher implements this
#    resolution test in-session as documented below; if the
#    pipeline later adopts the same test as a constraint rule,
#    update this comment to point at it.
#
#    Resolution test (in-session, namespace-walk verification):
#
#      DECL_PREFIX_RE = ^\s*(?:noncomputable\s+|@\[[^\]]+\]\s+
#                          |private\s+|protected\s+)*
#      DECL_KIND_RE   = (theorem|lemma|class|def|structure|instance
#                       |opaque|axiom)
#      DECL_RE        = DECL_PREFIX_RE + DECL_KIND_RE + r'\s+'
#
#      for each .ts with `export default conjecture(...)`:
#        ref = extract lean.ref from manifest
#        if ref is missing → naked
#        decl_name = ref.split('.')[-1]
#        candidates = grep -rEln --include='*.lean' "<DECL_RE><decl_name>\b"
#                     content/<paper>/  (NOT just content/<paper>/lean/ —
#                     sibling .lean files at chapter level also contain
#                     declarations and were silently missed by the
#                     lean/-only path)
#                     The --include='*.lean' flag is essential: without
#                     it the grep would match fenced Lean snippets inside
#                     .md narratives (e.g. "class Foo" code blocks),
#                     producing false-positive WIRED classifications.
#        if no candidates → naked
#        for each candidate file:
#          read namespaces above the decl line
#          full = '.'.join(reversed(namespaces)) + '.' + decl_name
#          if full matches ref's qualifier → WIRED (not naked)
#        if no namespace match → wrong-namespace ref (separate finding:
#          `lean-ref-namespace-mismatch`, minor severity, auto-discharge
#          by setting ref to the discovered `full`)
#
#    The DECL_PREFIX_RE handles `@[simp] theorem`, `noncomputable def`,
#    `private theorem`, etc. — without it the watcher will false-positive
#    "naked" on decorated declarations. Mirrors the DECL_RE used in
#    Slot G item 2 (uncited-sorry detection).
#
#    The previous (sibling-`.lean`-only) heuristic over-counted naked
#    conjectures substantially; the refined namespace-walk test is the
#    ground truth.

# 4. Dual-sibling discovery — .lean exists but .md missing or stub.
#    Heuristic must handle (a) .md files without `---` frontmatter
#    (don't count 0 body lines) and (b) .md files using LaTeX
#    `\begin{equation}` instead of `$...$` (count as has_math).
> /tmp/_pw_missing_narrative.txt
> /tmp/_pw_narrative_stub.txt
find content -name '*.lean' -type f 2>/dev/null \
  | grep -v '/lean/' \
  | while IFS= read -r lean; do
      md="${lean%.lean}.md"
      ts="${lean%.lean}.ts"
      [ ! -f "$ts" ] && continue
      if [ ! -f "$md" ]; then
        echo "$lean" >> /tmp/_pw_missing_narrative.txt
        continue
      fi
      if head -1 "$md" | grep -q '^---$'; then
        body_lines=$(awk '/^---$/{f++; next} f>=2 && NF' "$md" | wc -l)
      else
        body_lines=$(grep -c . "$md")
      fi
      has_math=$(grep -cE '\$|\\begin\{(equation|align|tikzcd|gather|displaymath)' "$md")
      if [ "$body_lines" -lt 5 ] && [ "$has_math" -eq 0 ]; then
        echo "$lean" >> /tmp/_pw_narrative_stub.txt
      fi
    done
```

## Slot H — §5b prioritisation

Override the parent's default rule with this proof-specific ordering:

1. **Sorry count** (more sorries → earlier): `grep -c '^[^-]*sorry' <block>.lean`
2. **Lean-without-narrative** (any `.lean` block whose `.md` sibling
   is missing or stub-only). These are presumed-published Lean
   results with no human-readable statement.
3. **Downstream dependents** (more dependents → earlier): walk
   `uses[]` from every other block; count edges pointing here.
4. **Last-audit recency** (older → earlier) from `queue.audited[]`.
5. **Alphabetical** as tie-breaker.

## Slot I — §6 invariants

| Invariant | Check |
|-----------|-------|
| Every `sorry` has `-- Ref:` | `grep -B6 '^[^-]*sorry' <file>.lean \| grep -qE -- '-- Ref:'` OR enclosing decl header carries it |
| No new `axiom` declarations | `git diff origin/main -- <file>.lean \| grep -E '^\+axiom '` is empty |
| Naked conjectures attempted | Every `conjecture` block touched in this branch has a `formalizer` attempt log in the queue (status `resolved` or `needs-author`) |
| No conjectural propagation regressions | `cd content && bun run pipeline/conjectural-propagation-audit.ts` reports no new violations vs main |

If any invariant fails on a proposed commit, **block the commit**,
queue the violation as `critical`, and ask the author (per
parent §6).

## Domain-specific anti-patterns (extends parent)

- ❌ Auto-fix a conjecture statement (turn `conjecture` block into
  a `theorem` block) without explicit author approval.
- ❌ Add a `-- Ref:` to a sorry without verifying it actually
  cites a real entry in `content/schema/references.ts`.
- ❌ Discharge a sorry without `lean_verify` post-check (axiom
  audit). An "easy fix" adding `Decidable.em` isn't a fix.

## Checklist (extends parent)

- [ ] Slot G discovery produced the four enumerations
- [ ] Slot D taxonomy applied to every finding
- [ ] Naked-conjecture special case (Slot E auto-discharge band)
      attempted before any conjecture finding is asked
- [ ] Conditional-class violations (Slot D
      `conditional-class-violation`) block the commit per
      Slot I invariants
{% endraw %}
