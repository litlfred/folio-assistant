---
layout: default
title: Compute Integration Watcher
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/compute-integration-watcher.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/compute-integration-watcher.md) — do not edit here.

{% raw %}
# Compute Integration Watcher

## Role

When a new claim lands on the default branch (or an open PR introduces
one), the claim is not "done" until the compute chain that *consumes* it
has been updated to reflect it. A proved theorem is only valuable to the
project's predictions if the production computation actually uses it
rather than a fitted free parameter standing in for it.

This skill answers, on every new commit/PR event AND on demand against
all existing blocks: **for each claim, is the matching compute consumer
wired in, using the correct primitives, at the correct precision,
against the correct constants?**

It is the *cross-layer* counterpart to:

- `local/compute-audit` — patterns INSIDE one script
- `local/watch` — event-stream router for upstream commits / PRs
- `local/proof-gap-audit` — claims missing formal proofs
- `local/proof-integration-watcher` — the proof-side analogue (chases
  gaps / naked conjectures across the default branch + sibling PRs).
  When both are armed: proof-integration-watcher owns proof-QA gaps;
  this skill owns compute-wiring gaps. Gaps bridging both layers are
  double-claimed — pick the one whose delivery cycle reaches the default
  branch first.

Where those look at one layer in isolation, **this** skill looks at the
boundary between layers: narrative → compute, formal → compute, upstream
witness → downstream consumer.

## When to use

| User phrase | Action |
|------------|--------|
| "audit compute integration" | full idle-sweep |
| "is X wired in?" / "where is X consumed?" | targeted wiring check |
| "what claims are not in compute?" | idle-sweep, filtered to NOT_WIRED |
| "watch + check wiring" | reactive mode |
| post-merge of a provable block | reactive (auto-triggered from `watch`) |
| idle / waiting on a long task | start an idle-sweep agent in background |

## Invocation modes

### A. REACTIVE (called from `watch` — "Can we reuse?")

When `watch` sees a new commit on the default branch (or PR event) that
adds/changes a provable block (or its formal sibling) and reaches the
"Computation" step, invoke this skill on the affected label. Output:
WIRED / PROBE-ONLY / NOT-WIRED verdict, consumer scripts that use (or
should use) the block, and a recommended fix.

### B. IDLE-SWEEP (user-invoked or background)

When the foreground is blocked, walk every provable content block, apply
the I-patterns below, and emit a ranked workplan to a dated audit doc.
The idle-sweep MUST be safe to interrupt — checkpoint every 50 blocks to
a `.wip.json`.

### C. AUTHOR-QUESTION QUEUE (idle-driven)

Maintain a queue of author questions and pull one off when idle to ask
via `AskUserQuestion`. Each entry carries trigger context, a ≤2-sentence
stem, 3–4 mutually-exclusive options, a priority (P0 blocks production
wiring; P2 is design), and whether answering requires touching content.
Consume in priority order. **Never block on the queue** — if no pending
P0/P1 question and the foreground is busy, work the next improvement.
Add to the queue (don't ask immediately) when a fix has architectural
sub-decisions, a sibling PR needs owner sign-off, or a pattern hit is
ambiguous.

## The integration antipatterns (I-patterns)

### Group A — Missing wiring

- **I1. PROVEN, NO PROBE.** A provable block has a formal sibling with no
  open gaps but no probe script and no witness referencing the label via
  `contentBlock`. Fix: write a probe exercising the claim + emit a
  witness whose `contentBlock` points at it.
- **I2. PROBE-ONLY (NOT CONSUMED IN PRODUCTION).** A probe witness
  exists, but the production consumers do not import or reference its
  witness file or derived constants. Fix: thread the result into the
  relevant production formula, or, if intentionally probe-only, add a
  `# probe-only: <reason>` line.
  - **I2-a. PROBE-ONLY that SUPERSEDES a production element.** The new
    block is the *derived, no-fit* version of what an existing
    production element used as input. Wiring it in also requires a "fate
    of the predecessor" decision (keep as interpretation / demote /
    deprecate / delete; default keep + complementary), a calibration
    -count update if the predecessor was an input, a sweep for
    downstream consumers of the predecessor's derived constants, and
    verification that the predecessor's narrative content has a home
    before deprecating. Deliver in phases (foundation → predecessor
    deletion + repointing → production wiring), one commit each, keeping
    the validator clean.
- **I3. WIRED BUT GUARDED OFF.** A consumer references the witness but the
  call is behind an `if False` / off-by-default env var / legacy
  fallback. Fix: promote to default-on after an equivalence cross-check.

### Group B — Stale wiring

- **I4. WITNESS-HASH DRIFT.** A consumer records `upstream_witness_hashes`;
  an upstream hash on disk no longer matches. Fix: rerun the producer and
  recommit both.
- **I5. CONTENTBLOCK REFERENCES MISSING LABEL.** A witness's
  `contentBlock` names a label with no `.ts`/`.md` file. Fix: create the
  block or point at the nearest neighbour.
- **I6. EMPTY `data` SECTION IN A PRODUCTION WITNESS.** Run the script
  with fault handling; usually a silently-caught exception.
- **I7. PROBE WITNESS STALE vs THE BLOCK'S MTIME.** The block was edited
  and the probe wasn't rerun. Fix: rerun; if numbers shift, surface to
  the author before recommitting.

### Group C — Wrong primitive

- **I8. PRODUCTION CHAIN USES LOW PRECISION WHERE THE WITNESS IS HIGH.**
  The consumer erodes the witness's precision via a lossy float cast.
  Trace the value through a precision-preserving conversion and confirm
  the final precision matches.
- **I9. HARDCODED EXTERNAL/DERIVED LITERAL OUTSIDE THE REGISTRY.** A
  production literal that should be derived from a claim or imported from
  the registry. Surfaced here because it also breaks wiring.
- **I10. LEGACY FORMULA USED IN PLACE OF CANONICAL.** A consumer
  inlines/imports a deprecated formula superseded by the current one.
  Fix: replace the call; keep the deprecated import in `_deprecated/`.

### Group D — Cross-paper / cross-layer

- **I11. CROSS-PAPER `uses[]` NOT CONSUMED.** A block's `uses[]` cites a
  `paper-dir:label` upstream but no compute consumer references the
  upstream's witness. Fix: drop it if narrative-only, or wire the
  dependent witness in.
- **I12. FORMAL-REFERENCE MISMATCH.** A block's formal-reference URI does
  not resolve to an actual declaration. Detected by the validator;
  surfaced here because it commonly catches "renamed, forgot to update".

### Group E — Discipline drift

- **I13. FITTED LITERAL LABELLED AS DERIVED.** A production script defines
  a high-precision literal AND claims (docstring/witness) it is
  "derived"/"canonical"/"predicted", but it was solved from external data
  rather than from the declared calibrations. The discrepancy inflates
  the project's apparent accuracy. Fix: rename to `*_FITTED_FROM_DATA`,
  add a discipline-violation banner, emit the honest derivation status,
  and demote any downstream "canonical" label.

## Workflow

### Reactive (per-commit / per-PR-event)

For each new/changed provable label in the commit: diff to find affected
labels; for each, walk I1–I13 in order, stop at the first hit, emit a
concrete fix; if clean emit `L: ✓ wired`. Roll up into one comment with
actionable items at the top. On a sibling-PR commit, act if the fix is
small and local to your branch; otherwise queue a TODO on the PR.

### Idle-sweep (full content scan)

Enumerate every provable `.ts` block. For each: read the formal sibling
(skip conjecture-class blocks — they don't need a compute consumer);
grep witnesses for `"contentBlock": "L"`; grep production scripts for
the producer witness or the label; walk I1–I12; emit hits. Emit a dated
audit doc with a per-label table, aggregate counts by pattern, and
next-actions ranked by leverage × tractability. Batch ≤30-minute fixes
into one follow-up branch.

## Verification checklist before declaring a claim "wired"

1. Formal side proved (or conjecture-class instance).
2. Probe witness exists with `contentBlock: "<label>"` and an assertion
   that fails CI if the claim is broken.
3. At least one production consumer imports the probe witness, the
   producer script, or the derived constant.
4. Equivalence cross-check recorded in the consumer's witness.
5. Anti-staleness wiring — consumer's witness has an
   `upstream_witness_hashes` entry for the probe witness.
6. The project validator passes (catches I5 / I12).

## Anti-patterns this skill explicitly rejects

- **Auto-fixing wiring on someone else's PR branch** — I-pattern hits on
  sibling PRs become one batched comment, not a force-push.
- **Generating probes for conjecture-class claims** — they don't need
  compute consumers.
- **Declaring "wired" on a docstring-only mention** — the consumer must
  actually load the witness or compute the derived constant.
- **Overclaiming convergence** — "we wired it, look at the agreement!"
  when the routes compute different objects.

## Tie-in with `local/watch`

`watch`'s "Can we reuse?" → "Computation" step is the entry point: when
a commit adds a provable block, `watch` delegates here, captures the
verdict, and acts-or-defers. When the commit adds *only* a witness (no
new claim), this skill is unnecessary — `compute-audit` covers
in-script patterns.

## AGENTS.md interaction

Respects the same rules as `compute-audit`: never write to protected
files; never close/resolve TodoItems (human-only); cite the matching
I-pattern for every recommended fix; for dual paths (probe-only vs
production), preserve the probe-only path as an opt-out — never delete
it.
{% endraw %}
