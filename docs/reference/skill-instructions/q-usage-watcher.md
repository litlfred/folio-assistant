---
layout: default
title: /q-usage-watcher
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/q-usage-watcher.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/q-usage-watcher.md) — do not edit here.

{% raw %}
# /q-usage-watcher

> **Folio-optional axis.** The `q-usage` criteria encode a substrate
> deformation parameter `q` and its regimes — one folio's mathematics,
> not a platform concern. They are registered only when the folio opts
> in via `folio.config.json`:
>
> ```json
> { "qaAxes": ["q-usage"] }
> ```
>
> Without that, `q-usage` criteria are absent from the registry and this
> watcher has nothing to run. See `folioOptionalAxes()` in
> `content/pipeline/qa-criteria-registry.ts`.


A concrete instance of [`local/integration-watcher`](integration-watcher.md).
The parent encodes the shared mechanics; this file fills the nine
domain-specific slots A–I and documents the q-regime taxonomy.

**Setup:** use `NAME=q-usage-watcher` everywhere the parent's §1
references `${NAME}`. Files at `.beans/q-usage-watcher-queue.json`
and `.beans/q-usage-watcher-ledger.md`.

**Authoritative references**:

- [AGENTS.md §7c — base-ring convention](../../../AGENTS.md) (generic
  `R` vs archimedean `ℝ`).
- [`notation-collisions.md`](../../../content/quantum-observable-universe/notation/notation-collisions.md)
  — base-ring convention notation row.
- [`qa-checkers-q-usage.ts`](../../../content/pipeline/qa-checkers-q-usage.ts)
  — the checker implementation, with the chapter → expected-regime
  registry.

## Slot A — Goal statement

Every content block in the paper handles the substrate parameter `q`
in one of several regimes — formal symbolic `q`, `q : R` for a generic
commutative ring `R`, archimedean `q : ℝ` with positivity hypotheses,
`|q| > 1` / `|q| < 1` formal-power-series convergence, `q` a root of
unity, or pinned to the substrate value `q_0 ≈ 1.10977859…`. Each
chapter has a narrative-expected profile (categorical/symbolic chapters
should keep statements over generic `R`; archimedean chapters use
`ℝ` + `fixed q_0`). The watcher detects each block's regime vector and
flags blocks whose vector mismatches the chapter — most commonly:
fixed-q_0 numerical pins in a categorical chapter, `Real.*` archimedean
functions in a generic-R block, root-of-unity constructions used
without declaration, or formal-power-series prose using `q > 1`
instead of `|q| > 1`.

### Q-regime taxonomy

| Tag | Meaning | Typical evidence |
|-----|---------|-------------------|
| `na` | Block doesn't mention `q` | no `$q$`, no `\bq\b`, no `q_0` |
| `symbolic` | Formal `q` (polynomial / power-series identity) | `H_n(q)`, `\mathbb{Z}[q, q^{-1}]`, Hecke generator relations |
| `generic-R` | `q : R` for `{R : Type*} [CommRing R]` (Lean) | `{R : Type*}`, `[CommRing R]`, `(q : R)` |
| `real-positive` | `0 < q` (archimedean specialisation) | `Real.sqrt`, `Real.cos`, `linarith`, `positivity`, `noncomputable def f (q : ℝ)` |
| `real-gt-1` | `q > 1` literal | `$q > 1$`, `q > 1` in `.lean` |
| `real-lt-1` | `0 < q < 1` literal | `$0 < q < 1$`, `q < 1` |
| `mod-gt-1` | `|q| > 1` (formal-power-series regime) | `\|q\| > 1`, `\lvert q \rvert > 1` |
| `mod-lt-1` | `|q| < 1` | `\|q\| < 1` |
| `unit-circle` | `|q| = 1` (finite quantum group regime) | `\|q\| = 1` |
| `root-of-unity` | `q` a primitive `N`-th root | `q = e^{2πi/N}`, fusion category, Lusztig integral form, modular crystal, divided-power algebra |
| `fixed-q0` | Numerical substrate value | `q ≈ 1.1097…`, `q_0`, `MeV`, `CODATA`, `ppb` |

### Chapter → expected-regime profile

Chapters are partitioned into three groups in the implementation:

- **categorical** — `quantum-universes`, `lifting-and-descent`,
  `braids-and-knots`, `appendix-knot-operations`, `appendix-surreals`.
  Expected: `symbolic`, `generic-R`. **Fixed-q_0 leak is a fail.**
- **archimedean** — `mass-theory`, `particle-interactions`,
  `gravity-spacetime`, `climax-volume-mass`, `observations`,
  `predicted-spectra`, `measurement-observation`,
  `molecular-construction`, `organic-chemistry`, `fluid-dynamics`,
  `appendix-qvalues`, `appendix-atomic-mass-calculations`. Expected:
  `real-positive`, `real-gt-1`, `fixed-q0`.
- **mixed** — `models-of-qous`, `quantum-observable-universes`,
  `stochastic-mechanics`, `information-theory`, `mass-endomorphism`,
  `brings-surface`, `q-geometric-langlands`. The expected set is
  documented in `CHAPTER_EXPECTED_REGIMES` in `qa-checkers-q-usage.ts`.

The complete per-chapter map is in
[`qa-checkers-q-usage.ts`](../../../content/pipeline/qa-checkers-q-usage.ts)
under `CHAPTER_EXPECTED_REGIMES`. To update a chapter's expected set,
edit that registry — the watcher reads it directly, no extra wiring
required.

## Slot B — §3 trigger filter

```bash
SHA=<event sha>
changed=$(git diff-tree --no-commit-id --name-only -r "$SHA")

is_q_usage_event=false

# (i) any block .ts / .md / .lean change
echo "$changed" | grep -qE 'content/quantum-observable-universe/.*\.(md|ts|lean)$' \
  && is_q_usage_event=true

# (ii) the checker module or registry itself changed (sweep all blocks)
echo "$changed" | grep -qE 'content/pipeline/(qa-checkers-q-usage|qa-criteria-registry|q-usage-audit)\.ts$' \
  && is_q_usage_event=true

# (iii) the chapter-regime table or notation register changed
echo "$changed" | grep -qE 'content/quantum-observable-universe/notation/notation-(collisions|register)\.md$' \
  && is_q_usage_event=true
```

For PR review-comment events, pass through if the comment body
mentions: `q regime`, `q usage`, `q_0`, `Real.sqrt`, `|q|`, `q > 1`,
`q < 1`, `root of unity`, `fusion category`, `Lusztig`, `Kashiwara`,
`fixed q_0`, `archimedean leak`, `categorical chapter`, `wall side`.

## Slot C — §4b dispatch table

| Specialist | When to run | What it checks |
|-----------|--------------|-----------------|
| `q-usage-audit.ts` | Any changed block | Runs the full 7-criterion suite, updates `<block>.qa.json`, emits witness |
| `q-usage-audit.ts --chapter <dir>` | Chapter-scoped change | Same but on one chapter |
| `qa-checkers-q-usage.ts` (direct call from `qa-sweep`) | Any sweep run | Per-criterion checker function for the new q-usage axis |
| `production-vs-exploratory-discipline` | Fixed-q_0 leak finding | Cross-axis — fixed-q_0 leak in a categorical chapter often signals an exploratory block that needs the production-vs-exploratory decision |
| `compute-audit` (existing skill) | Real.* leak finding | Cross-axis — Real.* in a Lean block flags archimedean specialisation; compute-audit verifies the archimedean side actually consumes it |

## Slot D — §4c finding taxonomy

| Violation | Severity | Definition | Auto-fix possible? |
|-----------|----------|-------------|--------------------|
| `q-usage-regime-detected` | minor (always pass) | Infrastructure — records the regime vector in the sidecar | n/a |
| `q-usage-fixed-q0-leak` | major | Categorical chapter + numerical `q_0` / substrate pin in the block | Sometimes — move the block to an archimedean chapter, or split off the numerical evaluation to a `archimedean-specialisation` block |
| `q-usage-archimedean-in-categorical-chapter` | major | Categorical chapter + `Real.*` / `linarith` / `positivity` / `MeV` / `CODATA` reference | Sometimes — same fix patterns as fixed-q_0 leak; sometimes the `Real.*` is legitimate (`Real.sqrt 5` for Lagrange resolvent) and just needs a tag |
| `q-usage-positivity-implicit` | minor (warn) | `Real.sqrt q` / `Real.log q` / `Real.rpow` on `q` without `0 < q` hypothesis | Author-assist — add the missing hypothesis |
| `q-usage-modulus-vs-real-mismatch` | minor (warn) | Formal-power-series / shuffle / Macdonald prose uses `q > 1` instead of `|q| > 1` | Author-assist — rewrite to modulus form |
| `q-usage-root-of-unity-undeclared` | minor (warn) | Fusion category / Lusztig / Kashiwara construct used without explicit root-of-unity regime declaration | Author-assist — add `q = e^{2πi/N}` / "primitive N-th root" declaration |
| `q-usage-narrative-chapter-mismatch` | minor (warn) | Block's regime vector disjoint from chapter's expected profile (none of the detected regimes is expected) | Author-assist — move block to a chapter whose profile matches |

## Slot E — §4d discharge bands

| Band | Examples |
|------|----------|
| **Auto-discharge** | None today — all q-usage findings touch semantic placement of a block and need author input. The infrastructure criterion `q-usage-regime-detected` is always recorded automatically. |
| **Author-assist** | All seven criteria — `fixed-q_0` placement, `Real.*` placement, positivity-hypothesis additions, modulus-vs-real prose rewrites, root-of-unity declaration insertions, chapter relocations. |
| **Defer** | A block with an author-granted **dispensation** in its sidecar (per §Dispensations below) — the dispensation overrides the script's fail. The paper content (`.ts` / `.md` / `.lean`) is never tagged for dispensation; the dispensation lives entirely in the audit sidecar. |

## §Dispensations — how to grant per-block opt-out (STRICT)

Dispensations live in the sidecar `<block>.qa.json`, **never** in the
paper content (`.ts` / `.md` / `.lean`). The `block-qa/v1` schema's
multi-reviewer mechanism is the dispensation primitive: a
`kind: "human"` reviewer entry with `result: "pass"` overrides the
script's `result: "fail"` for the same criterion, as long as the
human entry's `field_hash` matches the current source files (the
qa-sweep "most-recent matching-hash entry wins" rule).

### Pattern

A dispensed block's sidecar looks like:

```jsonc
"q-usage-fixed-q0-leak": [
  {
    // The script's raw finding — preserved for audit trail.
    "field_hash": { "md": "ab12…", "ts": "cd34…" },
    "result": "fail",
    "severity": "major",
    "evidence": "…",
    "reviewer": { "kind": "script", "id": "q-usage-audit", … },
    "reviewed_at": "2026-06-01T13:32:21Z",
    "reviewed_sha": "70cc682c…"
  },
  {
    // Author dispensation — overrides the script entry.
    "field_hash": { "md": "ab12…", "ts": "cd34…" },
    "result": "pass",
    "reviewer": { "kind": "human", "id": "litlfred" },
    "reviewed_at": "2026-06-02",
    "reviewed_sha": "<sha at dispensation time>",
    "notes": "Acknowledged archimedean specialisation. This block is the substrate-evaluation companion of `prop:proton-mass-substrate-identity` (which keeps the generic-q categorical statement). Dispensation kind: archimedean-specialisation. Re-grant after any change to the .md / .ts."
  }
]
```

### Rules

1. **`field_hash` on the human entry must match the current source
   files.** If a sibling file is later edited, the hash drifts, the
   human entry becomes stale, and the script's fail re-surfaces. The
   author re-grants the dispensation (or removes it) on the next
   sweep.
2. **`notes:` must explain the dispensation rationale.** A free-text
   sentence (or two) — what kind of dispensation (archimedean
   specialisation / paired-block / acknowledged-Class-A / etc.) and
   why this block is the exception. Reviewers reading the sidecar
   need the context.
3. **Never tag the paper content** with dispensation metadata. The
   `wall:` field on a `.ts` manifest is a SEPARATE concept — it
   declares the block's intrinsic archimedean / algebraic side for
   the detangler axis. Don't conflate the two.
4. **Apply at the criterion granularity.** A block can be dispensed
   for `q-usage-fixed-q0-leak` while still failing
   `q-usage-archimedean-in-categorical-chapter` — each criterion is
   tracked independently. Add one human entry per dispensed criterion.

### Why this works

- **Zero schema change** — `block-qa/v1` already supports
  multi-reviewer entries with the most-recent-matching-hash-wins
  rule.
- **CI / qa-sweep / qa-staleness / one-voice-integration-watcher
  already understand the pattern** — they don't need to know about
  q-usage specifically; the dispensation works because it's a
  generic block-qa primitive.
- **Hash-staleness is safety.** A dispensation written against
  yesterday's content can't silently mask today's drift. Re-granting
  is the explicit acknowledgement that the dispensation still applies.
- **Paper content stays clean.** Readers reading the `.md` / `.ts`
  see no audit metadata.

### Anti-pattern (do NOT do)

- ❌ Add `wall: "archimedean-specialisation"` (or any other
  audit-control tag) to the block's `.ts` manifest. This was the
  previous (pre-2026-06-01) approach; it was rejected for mixing
  audit concerns with paper content.
- ❌ Set a `human` entry's `result: "pass"` without populating
  `notes:` — undocumented dispensation defeats the audit trail.
- ❌ Re-use one human entry across multiple criteria — each
  criterion gets its own entry under its own key in `criteria`.

## Slot F — §4e author-ask templates

Per-violation template:

```markdown
**q-usage-watcher ask — `<block>`** (from <source>)

- Finding: `<criterion-id>` (severity `<sev>`)
- Chapter: `<chapter-dir>` (expected regime: `<expected-set>`)
- Detected regime vector: `<detected-set>`
- File: <github-blob-url to `.md`>
- Evidence: `<file:line>` — `<verbatim quote>`
- Question:
  1. Add `wall: "archimedean"` / `"archimedean-specialisation"` tag on
     `<ts-file>` (treat as legitimate archimedean specialisation)
  2. Move the block to an archimedean chapter (suggest: `<best-fit>`)
  3. Split off the numerical evaluation into a sibling
     `<block>-substrate-evaluation.md` in the appropriate archimedean
     chapter; keep the categorical statement here.
  4. (root-of-unity only) Add explicit "primitive N-th root" / `q = e^{2πi/N}`
     declaration to the .md
  5. (positivity-implicit only) Add the missing `hq : 0 < q` hypothesis
  6. Acknowledge — mark as wontfix with reason
```

## Slot G — §5a backlog discovery

```bash
# Run the audit, read the witness, queue every fail + warn
bun run content/pipeline/q-usage-audit.ts --no-write --json \
  | jq -r '.findings[] | "\(.severity)\t\(.criterion)\t\(.chapter)/\(.label)\t\(.result)"'
```

## Slot H — §5b prioritisation

1. **Severity** (major > minor).
2. **Categorical-chapter fails first** (those represent the strongest
   wall-violation signal).
3. **Downstream dependents** — blocks cited by many others move earlier
   so the fix lands before downstream readers reach a confused state.
4. **Alphabetical** as tie-breaker.

## Slot I — §6 invariants

| Invariant | Check |
|-----------|-------|
| No new categorical-chapter block with fixed-q_0 leak | Compared against baseline in `docs/audits/<date>-q-usage-audit.witness.json` |
| No new `Real.*` on `q` without positivity hypothesis | Same |
| Regime detector hash stable | `qa-checkers-q-usage.ts` `script_hash` matches the value recorded in the watcher's PR baseline (a checker-logic change invalidates all sidecar entries; treat as a sweep trigger) |

## How to run the audit (one-liners)

```bash
# Full sweep, write sidecars + witness
bun run content/pipeline/q-usage-audit.ts

# Dry run (report only, no writes)
bun run content/pipeline/q-usage-audit.ts --no-write

# Single chapter
bun run content/pipeline/q-usage-audit.ts --chapter braids-and-knots

# JSON output (for piping into jq / queue)
bun run content/pipeline/q-usage-audit.ts --no-write --json

# Strict (exit 1 on any fail — for CI)
bun run content/pipeline/q-usage-audit.ts --no-write --strict
```

## Cross-references

- Parent: [`local/integration-watcher`](integration-watcher.md)
- Sibling watchers: [`canonical-watcher`](canonical-watcher.md),
  [`proof-integration-watcher`](proof-integration-watcher.md),
  [`compute-integration-watcher`](compute-integration-watcher.md),
  [`detangler-integration-watcher`](detangler-integration-watcher.md),
  [`one-voice-integration-watcher`](one-voice-integration-watcher.md).
- Skill for placement decisions:
  [`production-vs-exploratory-discipline`](production-vs-exploratory-discipline.md).
- Checker source: [`content/pipeline/qa-checkers-q-usage.ts`](../../../content/pipeline/qa-checkers-q-usage.ts).
- CLI runner: [`content/pipeline/q-usage-audit.ts`](../../../content/pipeline/q-usage-audit.ts).
- Criterion registry entries:
  [`content/pipeline/qa-criteria-registry.ts`](../../../content/pipeline/qa-criteria-registry.ts)
  (search for the `Q_USAGE` const array).
{% endraw %}
