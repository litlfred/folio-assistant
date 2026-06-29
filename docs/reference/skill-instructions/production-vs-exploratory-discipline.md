---
layout: default
title: Production vs exploratory vs numerology
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/production-vs-exploratory-discipline.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/production-vs-exploratory-discipline.md) — do not edit here.

{% raw %}
# Production vs exploratory vs numerology — the bright-line guide

## Why this skill exists

The single most common churn-inducing antipattern in a results-driven
project: **an agent probes empirically, finds a numerical near-match,
and promotes it to production** before the near-match has any
derivation. A "5.6 ppm match" found by a search at one parameter value
is, much more often than not, a coincidence — not structure. This skill
codifies the discipline that short-circuits the propose → flag → restore
cycle: escalate *up front* rather than after review catches it.

## Three categories of output

### PRODUCTION

What it is — the project's published predictions. Lives in the canonical
compute pipeline; reported in dashboards; referenced as "the project
predicts X". (Identify the project's production locations: the canonical
`*.py`/scripts, the named published constants, the
`*-canonical`/`*-final` witnesses, the "closed"-status migration
backlog, the status dashboards, the calibration-anchor registry.)

**Discipline.** Production accepts ONLY:

1. **Proved theorems** — algebraic identities or formally-proved
   statements.
2. **Conjecture-conditional forms with explicit owner authorisation** —
   a derived-from-foundations form adopted despite an open gap to data,
   when the owner authorizes the swap because the form is principled
   (no hidden input) even if not yet proved to match data.
3. **Declared external inputs** — the project's fixed, enumerated
   calibration anchors. Quantities derived from these are *derived*, not
   calibrations.

**Disallowed in production.** Any of:

- Empirical fits against measured data (a literal solved backwards from
  the target).
- Rational-function / functional-form ansätze that hit the target by
  fitting.
- High-precision integer-relation (PSLQ-style) matches against
  transcendental constants without a derivation explaining the match.
- Higher-order correction terms fit to close the residual gap to data.

### EXPLORATORY

What it is — shape-probing, hypothesis-generation work. May contain
empirical fits, near-matches, ansatz tests, "what shape is this?"
computations. Lives in `probe_*` / `*_alt_*` / `*_refinement_*` /
`spike_*` scripts and dated audit docs.

**Discipline.** Exploratory probes:

1. **MAY contain empirical fits** as shape-hints.
2. **MUST clearly label themselves exploratory** in the docstring header.
3. **MUST NOT be referenced as production** (cross-reference is fine; a
   "project prediction" claim is not).
4. **SHOULD propose derivations** for any coefficient they find, citing
   the project's derivation menu (below).
5. **MUST classify their witness assertion** so a numerical negative
   result doesn't block CI — assert the *refutation*
   (`assert(no_match)`, not `assert(match)`) so the expected-negative
   outcome reports as passing.

### CANONICAL INFRASTRUCTURE (distinct from production and exploratory)

Structural pipeline components that are valid and part of the derivation
chain, but whose specific *numerical output* is not yet proved. **The
infrastructure is canonical; the specific coefficient is exploratory.**
A function that implements a valid pipeline step is canonical
infrastructure; a function that returns a specific not-yet-derived value
through that step is exploratory. Do not deprecate the infrastructure
because the coefficient is unproved.

### NUMEROLOGY

Post-hoc fits to known constants (π, ζ-values, named transcendentals,
catalogued geometric quantities, etc.) without any reason for that
constant to appear. Numerology is a SUB-CATEGORY of empirical-fit that
specifically anchors to a named constant.

**Discipline.** Numerology findings:

1. **MUST be labeled "coincidence" or "post-hoc fit"** in the audit doc.
2. **MUST be checked against the locality criterion** — does the form
   predict the right value across a neighbourhood of the parameter, or
   only at the single point? (See the locality gate below.)
3. **MUST be tested against the derivation menu** — does the constant
   appear in any derivation naturally?
4. **SHOULD be retired explicitly** if a falsification lands.

**Disallowed.** Numerology MUST NEVER enter production. Period.

## The derivation menu

Maintain, per project, a menu of the legitimate structural drivers from
which every production coefficient must be derivable (each entry: the
driver, where it lives in the codebase/literature, and what it yields).
**Every production coefficient must come from ≥ 1 menu entry.** When the
menu is extended (the owner identifies a new driver), update this list.

## Escalation rule — escalate off-menu coefficients to author

**If a candidate coefficient cannot be derived from any menu entry, the
agent MUST escalate to the author/owner via `AskUserQuestion` BEFORE
adopting it in production.** Exploratory shape-probing is permitted
without escalation — but the moment a coefficient is proposed for
production (a "closed" status, a dashboard refresh, a named published
constant), escalation must happen. The escalation includes: the exact
value at full precision; the candidate mechanism (if any); which menu
entries the agent tried to map it to; and what closure would unlock.
The owner may then identify a missing driver (extend the menu),
authorise the coefficient as conjecture-conditional, or direct the agent
to wait for a derivation.

## Decision tree — where does my code go?

```
Does my code change any production location?
  (canonical scripts, named published constants, "closed" status,
   status dashboards, the calibration-anchor registry)
  ↓
  YES → PRODUCTION. Every coefficient must come from the derivation
        menu. Off-menu → escalate. Use only:
        proved theorem | conjecture-conditional with owner authorisation
        | declared calibration anchor.
        If you can't satisfy this, make it a probe instead.
  ↓
  NO → EXPLORATORY. Empirical fits / near-matches OK as documented
       finds. MUST label docstring exploratory. MUST NOT be referenced
       from production or "closed" status.
```

## Common antipatterns (recognize + avoid)

1. **"The literal is the project prediction."** A constant solved
   backwards from the target, labeled as if derived. Fix: rename
   truth-in-naming (`*_FITTED_FROM_DATA`), banner the discipline
   violation, then replace with a derived form.

2. **"A near-match → it's structural."** A search at a single parameter
   value finds coincidences. Apply the **locality gate**: sweep the
   parameter across a neighbourhood and plot the residual. A genuine
   structural identity gives a smooth residual (≈ flat); a coincidence
   gives a sharp zero-crossing that diverges rapidly away from the
   point. A candidate that fails the locality gate is coincidence-basin
   regardless of how close it is at the point. Run the gate; report the
   slope.

3. **"We need this correction term to close the residual."** A
   correction fit to close a gap, with no derivation. Label exploratory,
   escalate, find a derivation OR get authorisation OR retire.

4. **"The theorem is proved, so the project is done."** A proved
   identity adopted as the production form does not mean it *matches
   data* — frame the resulting accuracy honestly (the gap is the
   project's honest accuracy under that adoption, not a match).

5. **"Reading A vs Reading B agnosticism."** Two competing readings give
   different production predictions; punting forces the next agent to
   decide. Escalate to the author to pick one.

6. **"Rebasing with witness drift — just push."** Re-run the
   self-emitting validators after a rebase so witness/script commit SHAs
   match; CI will fail otherwise.

## Pre-promotion checklist (before adopting any candidate in production)

If you are about to modify a production script, add/change a published
named constant, mark a backlog item "closed", or update a status
dashboard, run this BEFORE the commit:

1. **Categorize** the candidate (production / exploratory / numerology).
   If the change touches no production location, it is exploratory —
   label the docstring and commit without further gate.
2. **Locality gate** — sweep the parameter neighbourhood; classify by
   residual slope (smooth → proceed; marginal → escalate; sharp →
   retire). Report the slope in the commit message.
3. **Derivation-menu check** — cite which menu entry the coefficient
   comes from. If none, escalate.
4. **Locality on the FULL candidate** — gate every correction term, not
   just the leading term (a common slip: the leading term passes, the
   subleading correction fails).
5. **Naming discipline** — production constants are named so the status
   is visible (`*_CANONICAL`/unsuffixed = proved; `*_FITTED_FROM_DATA` =
   empirical fit, never imported as a derived value; `*_VALIDATION` =
   external anchor; `*_EXPLORATORY` = shape-probe). Mislabeling is the
   most common review-thread cause.
6. **Witness assertion** — falsification probes assert the *refutation*
   so the witness reports passing on the expected-negative outcome.
7. **Banner** — every exploratory probe carries a header banner stating
   it is exploratory hypothesis-generation and NOT for production
   without (locality gate + derivation-menu trace + owner authorisation
   if off-menu). The banner is the bright line a post-hoc audit looks
   for.

```
production change? → 1 yes → 2 locality smooth → 3 menu cite → 4 every term → 5 naming → 6 witness → 7 banner
                                              (any "no" → escalate)
```

## Tunable-knob fences

A syntactic complement to the categories above: a **fence that labels
the few legitimately tunable knobs** — everything outside a fence is
FIXED (derived, never tuned). Fence syntax in compute scripts:

```python
# EVOLVE-VALUE-START kind=production knob=N rationale="truncation order; ..."
N_TRUNCATION = 5
# EVOLVE-VALUE-END

# EVOLVE-VALUE-START kind=exploratory knob=c rationale="near-match, NOT derived"
C_NEAR_MATCH = -2.0
# EVOLVE-VALUE-END
```

Rules: varying a `kind=exploratory` knob in an exploratory script is
fine; varying a `kind=production` knob is allowed **only** if the stated
rationale still holds; tuning a value **outside** any fence is forbidden
(it is derived); a new `kind=production` fenced knob off the derivation
menu requires escalation; a witnessed (derived) value inside an
exploratory fence is a contradiction (derived *or* tunable, never both).
The fence makes "what may be searched" auditable: a post-hoc audit can
grep `kind=production` and check each rationale against the menu, and
grep `kind=exploratory` to confirm those values never leak into a
production script.

## How to recognize what category an EXISTING script is in

Use the project's naming conventions and docstring banners as the
first-line signal: production scripts (canonical/`*_final` names, no
fits), exploratory scripts (`probe_*` / `*_alt_*` / `*_refinement_*` /
`*_spike_*`, fits OK), numerology (documented in audits as
"coincidence"/"post-hoc fit"/`FITTED_FROM_DATA`). A file's name and its
docstring banner should agree; a mismatch is a review red flag.

## Where this skill connects

- **`compute-author`** — sibling pre-work skill (precision and authoring
  patterns). This skill covers the discipline AFTER authoring (where
  does the result go?).
- **`compute-audit`** — post-hoc audit; uses the 3-category
  classification here to flag empirical fits that ended up in production.
- **`canonical-watcher`** — the integration watcher that catches
  hidden-input promotions; this skill is the rule it enforces.
- **`prepare-merge`** — the standardized rebase / witness-drift pattern.
{% endraw %}
