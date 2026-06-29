---
name: compute-audit
roles: [collaborator, owner]
description: >
  Audit compute scripts for a catalogue of correctness and performance
  antipatterns extracted from a long review of the project's compute
  history. Distinguishes CORRECTNESS antipatterns from PERFORMANCE
  antipatterns. Produces a ranked workplan citing concrete files+lines.
allowed-tools: Read Bash Grep Glob Edit Write Agent
---

# Compute Audit Skill

## Role

When a user asks "audit compute", "what can be sped up", "performance
audit", "find slow scripts", or "find the bottleneck" — run the scanner,
read the witness, and produce a ranked workplan. **Never** rewrite
scripts blindly: every change must cite a specific pattern from the
catalogue and verify numerical equivalence at the target point
before/after.

## When to Use This Skill

- "audit compute" / "compute audit"
- "what can be sped up?" / "find slow scripts" / "what's the bottleneck"
- "where is expensive symbolic simplification being called?"
- "is the fast number kernel / shared cache wired everywhere it should be?"
- After a new compute script lands (review pass)
- Before a release (perf regression sweep)

## Workflow

1. Run the project's `compute_audit_scan` (writes a scan witness).
2. Read the JSON: per-file findings tagged by pattern ID.
3. Cross-reference findings against the project's ranked audit workplan.
4. For each candidate fix, **verify the antipattern is real** by reading
   the cited lines — the static scanner has false positives on idiomatic
   uses.
5. Implement only items where you can: cite the matching pattern, cite a
   prior successful instance from the audit docs, and provide a
   numerical-equivalence cross-check at the target point.
6. Update the formalization-status manifest only if a content block's
   witness changed — pure perf changes do not change formal status.

## The pattern catalogue

The project maintains a numbered catalogue of antipatterns, split into a
correctness group and a performance group. The genuinely-generic
patterns below recur across compute-heavy projects; extend the catalogue
with project-specific ones.

### Group A — Correctness antipatterns (must fix before optimising)

- **Normalisation confusion.** Two normalisation conventions that agree
  only at a special point; always state which one is in use.
- **Type-conflation.** Two objects with the same surface label but
  distinct identity collapsed into one; never collapse by the surface
  label.
- **Off-by-one bound.** An index/length bound off by one (e.g. 0-based vs
  1-based reduced-word indices).
- **Cache key not incorporating the coefficient.** Caching by the
  structural key alone is wrong when the element carries a coefficient;
  include the coefficient in the key.
- **Recursive function bypassing its own cache decorator.** Internal
  recursion must call the decorated entry point, not the bare worker.
- **Falsified universality / sign-balance criterion.** An empirical
  "criterion" that doesn't hold under a sweep; replace with the proved
  criterion.
- **Pickle (or other code-bearing serialization) for cache files.** RCE
  risk on tampered caches; serialize as data (e.g. a string form) and
  re-parse on load.
- **Whole-expression GCD reduction on huge numerator/denominator.**
  Walls past the timeout; use a no-GCD recombination then divide for the
  next step.
- **Cosmetic symbolic simplification before a numerical evaluation.**
  For a numerical evaluation, simplification is purely cosmetic and can
  exceed the timeout; make it opt-out.

### Group B — Performance patterns (apply when correctness is clean)

- **Wrong number kernel.** When coefficients have a known restricted form
  (e.g. Laurent polynomials over the rationals), a general symbolic type
  is overkill; use the specialized kernel. Note where the sweet spot is
  and where it fades.
- **Recursive ascent beats block matrix products** past a size threshold.
- **Shared cache across sub-computations** (precompute index dicts to
  eliminate repeated searches).
- **Sparse representation** when the matrix is sparse past a threshold.
- **Process-pool parallelism on independent sub-work** (serialize
  exprs as strings to dodge pickling fragility). Prefer pushing
  parallelism into the native kernel and calling once.
- **Disk caches for restart-safety on multi-hour runs** (gitignored).
- **Symmetry / det-law shortcuts** that halve work — guard with the §3
  algebraic preflight from `compute-author`.
- **Pre-parse / hoist setup out of inner loops.**
- **Always emit a per-unit benchmark table** in the commit message and
  the witness when landing a speedup (caller-vs-caller, with the
  equivalence cross-check at the target point).
- **Profile to identify the actual bottleneck before optimising.**
- **Structured-witness metadata** (script hash + file) so a pipeline can
  detect staleness; hand-written witnesses are treated as current and
  silently skip regeneration.
- **Hardcoded external-data literal outside the registry.** Such literals
  must come from the data registry, never as free-floating string
  literals in production scripts; audit-only scripts may use them inside
  an explicit justifying comment.
- **Non-deterministic builder.** A builder must produce byte-equal output
  across two consecutive runs in the same environment; drift indicates
  dict-iteration order (fix the hash seed), an embedded timestamp,
  float-precision variation, or hand-edits the script doesn't reproduce.
- **Latent shadowing of an imported constant.** A module imports a shared
  constant and then locally redefines it; the local definition wins and
  upstream fixes don't propagate. Detection: for each
  `from <module> import <CONST>`, flag any subsequent `CONST =`
  assignment in the same file.
- **Algebraic-invariant cross-check absent.** A producer emits
  algebra-valued data without cross-checking the invariants it must
  satisfy (symmetry of a pairing matrix, a recursion/cyclicity identity,
  a defining quadratic relation, an involution identity). Every
  algebra-valued witness should emit a `cross_checks` field listing the
  verified invariants and their residuals, with a strict-mode CI gate
  failing on any residual above tolerance (tighter for symbolic/exact,
  looser for arbitrary-precision, loosest for machine float).

## Verification checklist before landing any speedup

1. **Numerical equivalence at the target point** vs the slow path, at
   the floor tolerance.
2. **Per-unit benchmark table** in the commit message AND the witness.
3. **Honesty**: if the new path is slower on small inputs, say so and
   gate by size or keep both paths via an opt-in default.
4. **Cross-check structural invariants** where applicable — speedups
   must not perturb exact algebraic outputs.
5. **Run the project validator** for any content-block touch.

## Sibling skills

- **`production-vs-exploratory-discipline`** — before flagging a script
  as a hidden-input / numerology violation, route through its 3-category
  framework, derivation-menu check, escalation rule, and locality gate.
- **`compute-author`** (pre-work) — for agents about to *write* compute,
  invoke it first; it prevents these patterns at authoring time.
- **`compute-integration-watcher`** — for *cross-layer wiring* (is a
  claim consumed by production compute at all?). This skill scans
  patterns INSIDE one script; that one checks the boundary between
  layers.

## Anti-patterns this skill explicitly rejects

- "Numerology": pattern-matching numerical agreements without a
  derivation. Demote to remark or null result.
- "N-route convergence" claims when the routes compute different objects.
- "Universal" extrapolation from a single case.
- Removing the slow path. Always keep it as an opt-out for symbolic
  -output callers.

## §Long-compute logging discipline (STRICT)

Any script expected to run **> 5 minutes wall** **must** emit periodic
progress lines — not silent until finish. Silent long computes are
unmonitorable: a background run that prints nothing for an hour is
indistinguishable between "progressing", "hung", and "crashed silently".

**Rules for the script author:** print a header (total work units,
expected scaling, estimated wall); per-unit progress every ~10 s or ~5%
of work, whichever is more frequent (unit index, wall elapsed,
units/sec, ETA); phase markers between expensive steps; per-unit timing
for variable-cost loops; flush stdout (or run unbuffered).

**Rules for the agent launching the script:** always run unbuffered; tee
to a log file for post-hoc inspection; monitor task output at intervals;
**when the script ends silently with no output, assume it crashed** and
re-launch with stricter logging; report bottlenecks in the end-of-task
summary.

```bash
# WRONG — silent until finish
python3 script.py --args ...

# RIGHT — unbuffered + teed + verbose
python3 -u script.py --args ... 2>&1 | tee /tmp/script.log
```
