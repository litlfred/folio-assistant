---
layout: default
title: FFI roundtrip audit
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/ffi-roundtrip-audit.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/ffi-roundtrip-audit.md) — do not edit here.

{% raw %}
# FFI roundtrip audit

## Role

When a user asks "find back-and-forth script ↔ native", "where are we
shuttling data across the FFI boundary in a loop", "FFI ping-pong
audit", "compute boundary audit", or "where should we consolidate to the
native side" — run the scanner, read the output, and produce a ranked
workplan. Companion to `compute-audit.md` but narrower: only catches the
boundary-crossing anti-pattern. Performance-only.

## When to use

- "audit FFI" / "ffi roundtrip" / "native-script ping-pong" / "back-and-forth"
- "where are we crossing the FFI boundary in a loop"
- "find wall savings via consolidation"
- After landing a new native kernel (sweep for callers stuck on per-item
  APIs when a batch exists or could be added)
- Before optimising a script that calls a native extension or a native
  binary via subprocess

## What the anti-pattern looks like

A **script loop** that calls a **native function** per iteration, then
does script-side combine (arbitrary-precision accumulation, symbolic
ops, dict-merge, etc.):

```python
# ANTI-PATTERN — N FFI crossings + N script-side combines
total = mp.mpf(0)
for item in items:
    val = native.compute_one(item, q)      # ← per-item FFI crossing
    weight = table.get(item)               # ← script-side lookup
    total += weight * mp.mpf(str(val))     # ← script-side combine
```

The same compute as a **single FFI call**:

```python
# CONSOLIDATED — 1 FFI crossing, script only stamps the result
result_str = native.compute_all(items, q, dps)
return mp.mpf(result_str)
```

## Why the cost is non-trivial

Each crossing pays: an FFI acquire/release (small fixed cost, larger for
bigger args/returns); marshalling the args into the native side
(allocation + per-item type conversion + serialising big numbers to
decimal strings); marshalling the result back; and the script-side
combine work in the loop body (often far slower than the equivalent
native ops). For large N these add up to a dominant fraction of the
wall.

## Workflow

1. **Survey** — run the scanner (below) to enumerate scripts containing
   native-extension or subprocess calls inside a loop.

2. **Classify** each finding:
   - **P-F1: Per-item FFI in a loop.** `for x in items: native_fn(x)`.
   - **P-F2: FFI + script-side combine.** P-F1 plus an accumulator that
     should have stayed on the native side.
   - **P-F3: Decimal-string shuttle.** Per-item FFI where the return is a
     decimal string the loop re-parses to arbitrary precision.
   - **P-F4: Subprocess-per-item.** A native binary invoked per item via
     `subprocess.run` — the same anti-pattern via stdin/stdout.

3. **Pick the fix** (cheapest first):
   - **F-A. Use an existing batch API** if one exists.
   - **F-B. Add a batch API** if none exists — enumerate internally on
     the native side and parallelise there; expose a single binding that
     returns a vector of results (a decimal-string variant for arbitrary
     precision).
   - **F-C. Push the combine into the native side + return one scalar.**
     Use this when the script-side combine loop is non-trivial.
   - **F-D. Keep the script loop** if N is small (< ~10) AND per-call
     work is large (seconds per item) — FFI overhead is negligible.
     Document the exemption in a code comment.

4. **Verify equivalence at the target point** — every consolidation must
   match the per-item version at the floor tolerance on a representative
   input set. No silent precision loss.

5. **Bench** — report wall before/after on a real input; the commit
   message should include a small table.

## Scanner (manual, until automated)

Run from the repo root; adapt the native-call token to the project:

```bash
# P-F1: native call inside a `for` block
grep -rnB4 "native\." computations/*.py 2>/dev/null \
  | grep -B0 "for " | sort -u

# P-F2: per-iteration call + an accumulator
grep -rnA5 "native\." computations/*.py 2>/dev/null \
  | grep -B1 "mp\.mpf\|total +=\|sp\.Float" | sort -u

# P-F4: subprocess.run([native_bin, ...]) in a loop
grep -rnB4 "subprocess\.run(" computations/*.py 2>/dev/null \
  | grep -B0 "for "
```

For each candidate, open the file at the cited line. The static scan has
false positives (e.g. a loop that merely *builds* a single native input
is fine). Maintain a catalogue of catalogued offenders + their fix
column and a status row tracking when each is discharged.

## How to add a new batch API (F-B)

1. **Native kernel**: add a `compute_all(...)` that enumerates the work
   internally and parallelises (data-parallel map → collect).
2. **Binding layer**: add a wrapper returning a vector of `(key, value)`
   or `(key, decimal-string)` pairs (the string variant for arbitrary
   precision).
3. **Build manifest**: bump the version (minor for a new public API).
4. **Caller**: replace the loop with the batch call.
5. **Cross-check** at the target point on a representative input — floor
   tolerance.
6. **Bench** before/after.
7. **Audit-doc** the change.

## Anti-pattern in subprocess form (P-F4)

A binary that takes one input spec and returns one output is *fine* —
not P-F4. P-F4 fires when the *script loop* invokes the binary per item.
The fix is the same as F-B: have the binary accept a list of specs and
return a list of results in one invocation, or expose the kernel as a
binding and skip subprocess entirely.

## Verification harness

After every consolidation, add a cross-check that evaluates the old
per-item path and the new batch path on each test input and asserts
`rel.diff < floor tolerance`. The cross-check passes because both paths
use the same native kernel internally; only the boundary differs.

## Skill output

Produce a markdown table:

```
| file:line | pattern | native api | N | fix | est savings |
```

Plus a prose summary noting which fixes are mechanical (F-A, F-D) vs
require native-side work (F-B, F-C). **No code changes from the audit
pass itself** — the agent that *acts* on the audit is `compute-author`
for the native side and a follow-up PR for the script side.

## Out of scope

- Numerical correctness changes (use `compute-audit`).
- Inner-kernel performance — see `compute-author.md`.
- Architectural overhauls that change the compute graph — roadmap-level
  decisions, not audit-level.

## References

- `compute-audit.md` — the broader correctness/performance catalogue
  (this skill is the FFI-specific complement).
- `compute-author.md` — guidance for writing new compute that avoids
  these anti-patterns up front (see its native↔script boundary-cost
  rule).
{% endraw %}
