---
# folio-assistant-sklb
title: Folio vocabulary hardcoded in platform code — 4 sites, needs a registry not a rename
status: completed
type: task
priority: normal
created_at: 2026-08-08T09:54:51Z
updated_at: 2026-08-08T12:00:50Z
---

Spun out of `folio-assistant-dh4f`, which resolved the *path*-rooting instances
of "folio content in platform code". Four sites remain that are the same
AGENTS.md violation but a different shape: not a path, a **vocabulary**.

> folio-assistant is the platform, not the content. … If you are about to write
> subject matter here (a chapter, a constant, a vocabulary), you are either in
> the wrong repo or writing something that belongs in the folio as data.

| site | what it is |
|---|---|
| `content/pipeline/qa-checkers-q-usage.ts:105` | `"quantum-observable-universes": new Set<QRegime>([…])` — a map from a folio CHAPTER NAME to the Q-regimes allowed in it, alongside `"quantum-universes"`, `"braids-and-knots"` etc. |
| `content/pipeline/qa-criteria-registry.ts:384,1252` | criterion description prose naming those same chapters |
| `content/pipeline/find-dangling-remarks.ts:41` | `"observable": "def:quantum-observable-universe"` — a bare-word to block-label map |
| `scripts/lean-audit.ts:336` | `rel.includes("QOU/QuantumObservableUniverse")` → `"ch1-quantum-observable-universe"` — a Lean namespace to chapter-slug map |

## Why this is not a find-and-replace

Each is a *judgement about a specific folio* — which regimes belong in which
chapter, which Lean namespace is which chapter. There is no platform-side
default that is right; the data has to move to the folio and be read from
there, which means designing where it lives (a `folio.config.json` key? a
per-paper sidecar? the paper manifest?) and a loader with the same
"refuse to run on nothing" discipline the audits now have.

`value-registry-di.ts` and `references-registry-di.ts` are the established
pattern for exactly this: the platform declares the shape and a
`configure*()` entry point, the folio supplies the data. A third registry in
that family is probably the answer.

## Not urgent

Nothing here is wrong for the current folio, and none of it silently reports
success — unlike the path defects, which pointed at directories that did not
exist. The cost is that a second folio would inherit qou's chapter vocabulary,
and that the platform cannot be read as content-neutral.


---

## Summary of Changes

All four sites moved behind a new third DI registry,
`content/pipeline/chapter-profile-registry-di.ts`, matching
`value-registry-di` and `references-registry-di`.

| site | what moved |
|---|---|
| `qa-checkers-q-usage.ts` | 31-entry `CHAPTER_EXPECTED_REGIMES`, `CATEGORICAL_CHAPTERS` (5), `ARCHIMEDEAN_CHAPTERS` (12) |
| `find-dangling-remarks.ts` | 13 prose terms → the definition expected to back them |
| `scripts/lean-audit.ts` | 19 Lean path fragments → chapter slugs |
| `qa-criteria-registry.ts` | left: prose inside criterion descriptions, not a lookup |

**One deliberate departure from the other two registries: this one does not
throw when unconfigured.** A values or bibliography lookup returning nothing is
a bug; a folio declaring no chapter policy is a legitimate folio. That puts all
the weight on one distinction — unconfigured must read as `n/a`, never as
"expectation met" — which is the exact failure this whole session has been
about. The empty default is verified empty rather than permissive: no
membership test returns true, no lookup returns a set.

The data is not deleted, because the other half is in a repo this change cannot
touch. It sits in `_folio-chapter-profiles.qou.ts`, quarantined, named for what
it is, registering itself as the default so qou's criteria do not silently go
`n/a` first. That file carries the three-step finish and notes step 3 is safe
the moment step 2 lands, since a later `configure` wins.

**Behaviour-neutral, proven twice:**

- chapter profiles: all 31 chapters and both sets dumped through the checker's
  public exports before and after — byte-identical.
- module map: the original function reproduced verbatim beside the new one and
  both run over **525 paths** — every fragment in four shapes plus all 441
  overlapping pairs, where an ordering difference would surface. 0 mismatches.

Two mistakes en route, both caught by measuring: the first extraction dropped 6
of 19 fragments (three rules are multi-line ORs, and a same-line regex missed
them), and the rewrite defaulted to `"unmapped"` where the original defaults to
`"core"`. Also a test-pollution bug of my own — `afterEach(resetChapterProfiles)`
left the registry empty for later files, since the default registers as a
module-load side effect that fires once per process.

`scripts/tests/chapter-profile-registry-di.test.ts` — 9 tests, weighted on the
unconfigured case and the Proxy plumbing.

## Remaining (qou side, cannot be done from here)

Copy the literals into the folio, call `configureChapterProfiles` from
`scripts/run-validate.ts`, delete the quarantine file.
