---
name: compute-author
roles: [collaborator, owner]
description: >
  Pre-work briefing + durable patterns for anyone writing or modifying
  compute scripts (or the native crates they call). Read this BEFORE you
  write or change compute code — it covers precision discipline, the
  native↔script boundary cost, exact-arithmetic choices (big-integer vs
  big-rational vs arbitrary-precision float), algebraic-preflight
  requirements before optimization shortcuts, and witness-emission
  discipline. Sibling to `compute-audit` (post-hoc); this skill is
  pre-work.
allowed-tools: Read Bash Grep Glob Edit Write Skill
---

# Compute-author skill — read before writing compute code

## Role

When you are about to **author new compute** (a script, or a native
kernel it calls) or modify existing compute in a way that touches
precision, performance, or derivation discipline — run this skill
**before** any code change. This is the pre-work counterpart to
`local/compute-audit` (post-hoc review). Both share a vocabulary; this
one gates entry, that one gates exit.

**Workflow precondition.** Before writing the first line of compute,
create a branch and open a PR; commit early and often (small structured
commits cherry-pick cleanly).

## When to use this skill

Whenever a request mentions: authoring/optimizing/porting/"make it
faster"; precision / tolerance / "float vs exact" / arbitrary-precision;
crossing a native↔script language boundary (FFI / extension module /
round-trip); memory / cache / bottleneck / profile; cross-check /
identity / residual / drift; or any pre-work question about which type /
precision / boundary granularity to use, or whether a shortcut identity
is safe. **Anything performance-related is in-scope, even if the request
looks small** — a one-line "use a fast float here" change can break the
precision floor.

## §0. Canonical references (read these first)

Maintain, per project, pointers to: the precision-goals doc (what the
project's precision targets mean and the conventions behind them); the
derivation-discipline doc (the declared calibration inputs, the no
-fitting rule); `production-vs-exploratory-discipline.md` (where a
candidate result goes — read BEFORE deciding whether it goes into a
production script or stays in a probe); the current optimization
roadmap; and the reference implementations for the project's number
kernels, exact-arithmetic types, and witness base.

### §0.1 Sandbox / fresh-container bootstrap

A fresh container often ships **neither** the script-side deps **nor**
the compiled native module. Do **not** declare a compute "blocked (no
native module)" — it is almost always buildable in-place: install the
core numeric deps, install the in-repo packages editable, then build the
native module from source with the project's build tool (the native
toolchain usually ships in the sandbox even when other toolchains are
firewalled). The pure-script paths typically do NOT need the native
module — only the large/slow producers do, and even those unblock after
the in-place build. Build it before reporting a capability as
unavailable.

## §1. Precision discipline (STRICT)

Set the project's precision floor (e.g. high-precision compute, slightly
lower output) and obey it on every production path.

### §1.1 Numeric-type decision table

| To represent… | Use | Rationale |
|---------------|-----|-----------|
| Exact integer | language `int` / big-integer type | exact, no precision issue |
| Exact rational | a big-rational type | exact, required for identity checks at the target point |
| Real at the precision floor | an arbitrary-precision float (pass the value as a *string*, never round to a machine float) | matches the floor |
| Machine float | **only for cross-checking**, clearly marked LOSSY | NEVER on the production critical path |

**Cross-check tolerance must match the floor.** At N significant
digits, a loose tolerance defeats the floor — set the cross-check bar at
the floor's precision, not at machine-float precision.

**No lossy float casts of an exact expression in production.** Convert
via a decimal-string round-trip at the requested precision, or via the
rational's numerator/denominator when the value is rational.

### §1.2 Calibration discipline (STRICT)

Only the project's **declared calibration anchors** are inputs; any
compute that introduces a new free parameter calibrated against a
measured observable is a hidden-extra-input violation and will be caught
by `canonical-watcher`. Quantities derived from the anchors are derived,
not calibrations.

### §1.3 No fitting / numerology

If your compute pattern-matches a numerical agreement, that is NOT a
derivation. Either (a) derive the structural identity from the project's
foundations; (b) document the match as a falsifiability probe with an
explicit probe/fit suffix in the script name + an audit-only witness; or
(c) demote to a `remark` (interpretation, not claim). See
`production-vs-exploratory-discipline.md` and `compute-audit.md`.

## §2. Native ↔ script boundary cost (when to cross)

Crossing the native/script boundary has a fixed per-call cost. Per-fine
-grained calls are a loss: crossing the boundary millions of times costs
more than any algorithmic savings.

### §2.1 Granularity decision rule

| Calls per work-unit | Net effect |
|--------------------:|-----------|
| 1 (whole-unit compute returns a structured result) | trivial — go for it |
| 10s–100s | acceptable — boundary amortized |
| 1000s–10K | borderline — must measure |
| 1M+ (per-coefficient arithmetic op) | **FORBIDDEN — boundary dominates** |

**The right port granularity:** port the WHOLE compute (build input,
compute, return result) as a single boundary call. The script builds the
input and reads the output; the native side does everything in between —
not per-coefficient-multiplication.

### §2.3 FFI marshalling format

For complex objects across the boundary, serialize as **flat structured
lists** (no custom script-side objects on the native side; no
binary-serialization format unless you've measured the alternative). A
decimal-string representation of big integers/rationals preserves
arbitrary precision across the boundary.

## §3. Algebraic-preflight discipline

Before optimizing via a symmetry / shortcut identity, **prove (or
numerically falsify) the identity on the smallest non-trivial case
first.** Do NOT ship the shortcut until the identity is established.

### §3.1 Preflight protocol

```
Decide which shortcut you want to exploit
  ├ Step 1: write the identity in narrative
  ├ Step 2: pick the smallest case where it's non-trivial
  ├ Step 3: compute BOTH sides at the precision floor via the existing
  │         (slow but correct) path
  └ Step 4: check rel.diff < the floor tolerance
            ├ PASSES → repeat on the next case; if all pass → implement
            └ FAILS  → STOP. Document the failure in a dated audit doc
                       with the numerical witness. Investigate the
                       convention / structure. Do NOT ship the shortcut.
```

Keep a project catalogue of **common false identities** (claimed
symmetries that turn out to fail for coupled/non-trivial cases) so they
are not re-shipped without proof.

### §3.3 Formalize-first probe discipline (STRICT)

**Too much time is lost chasing numerical rainbows that a one-line
structural argument — or a small formal lemma — would have eliminated up
front.** Before launching a numerical search over a *hypothesis class*
(a family of candidate closed forms, an integer-relation basis, an
enumeration), STOP and ask whether a **formalizable structural claim
prunes the class first**:

1. **State the hypothesis class** you would probe.
2. **Find the structural invariant the whole class must satisfy** —
   parity, a symmetry, a degree/anchor bound, search-space entropy vs
   available precision, a provable constraint.
3. **Formalize it** — a formal lemma (even conditional / a stub + a
   reference citation), or a rigorous symbolic argument.
4. **Let the result narrow the probe:** class refuted → do not run the
   scan; a property constrains it → probe only the surviving sub-class;
   brute-enumerate only what formalization cannot prune.

**When NOT to formalize-first:** if the formalization is harder than the
probe AND the probe is cheap and decisive, just run the probe. This
targets *wide / expensive* searches that a cheap structural argument
would prune.

### §3.4 Formalize-the-refutation

The mirror of formalize-first: when a numerical probe **refutes** a
candidate, do not let the refutation live only in prose + a witness —
**formalize the disproof** (a formal lemma whose conclusion is the
inequality at the witnessed point) so the dead candidate cannot be
silently re-proposed. Pin the literals to the producing witness via the
value-citation tag (`witnessed-values.md`); cite the witness in the
lemma's reference comment; file the disproof beside the conjecture it
kills so a future agent grepping the candidate finds the refutation.
This operationalises the "no Nth fit" rule from
`production-vs-exploratory-discipline.md`: a refuted candidate becomes a
machine-checked `≠`, not a prose warning.

## §4. Native-port patterns

When porting script code to a native kernel, maintain a type-mapping
cheat-sheet (script exact-rational → native big-rational; script
big-integer → native big-integer; script arbitrary-precision float →
native MPFR-style float for boundary evaluations only; structured script
collections → native maps/vecs with deterministic iteration order).
Don't enable heavy optional build features (system-dep-pulling solvers)
unless you specifically need them. Use the build tool's `build` +
install flow when no virtualenv is available (the `develop` flow may
require one).

## §5. Witness-emission discipline

Every compute script ships a `*.witness.json` via the project's witness
base. The witness must include: `name` / `description` / `computation`
(match the docstring); `engine`; auto-populated `scriptFile` /
`scriptHash` / `scriptCommitSha` / `computedAt` / `durationMs`;
`parameters` (precision settings, etc.); `data`; structured `assertions`
(each with computed / expected / tolerance / source); and an
`auditOnly` marker if the script is research-grade. Emit any
solver-specific structured outputs the project mandates.

## §6. CI / merge etiquette

CI is billing — don't churn commits; squash where possible. Combine
related PRs. Follow the project branch-naming convention. Run the
prepare-merge flow at the end; address review comments mechanically.
Never claim a cross-check passes at a tolerance looser than the floor.

## §7. Quick gotchas

Maintain a per-project gotcha table (symptom → cause → fix). Recurring
generic entries: a ~1e-7 drift between two methods ⇒ one path uses a
machine float ⇒ switch to arbitrary-precision/exact; a cross-check that
passes loose but fails tight ⇒ tolerance too loose ⇒ tighten to the
floor; per-call boundary cost dominating ⇒ granularity too fine ⇒ port
the whole compute; a silent 0-byte crash on a background run ⇒ re-launch
unbuffered with logging.

## §8. Pre-work checklist (use before every compute change)

- [ ] Read the precision-goals doc and the derivation-discipline doc
- [ ] Identified which calibration anchor (if any) this compute touches
- [ ] Coefficient types are **exact** — no machine float in production
- [ ] An equivalence cross-check at the floor vs the reference path is planned
- [ ] If exploiting a shortcut: §3 algebraic preflight on the smallest case
- [ ] If porting to native: granularity is whole-compute per boundary call (§2.1)
- [ ] Witness emission plan includes parameters, assertions, mandated solver outputs
- [ ] Long-compute scripts launch unbuffered + teed to a log
- [ ] Branch name follows the project convention; combined with related work on one PR

If any box is unchecked, **stop and resolve before writing code**.

## §9. Sibling skills

- `local/compute-audit` — post-hoc review (this skill is pre-work).
- `local/canonical-watcher` — catches hidden-input / numerology / fits.
- `local/compute-integration-watcher` — cross-layer wiring check.
- `local/prepare-merge` — merge workflow.

## Anti-patterns this skill explicitly rejects

- Writing compute without reading the references (§0).
- Optimizing without a profile — profile first to find the real
  bottleneck.
- Per-call boundary crossings — always port whole computes.
- Machine float in production — the floor demands arbitrary precision.
- Shortcut identities without algebraic preflight.
- Inline external-data literals — always route through the registry.
- A hidden extra calibration input.
