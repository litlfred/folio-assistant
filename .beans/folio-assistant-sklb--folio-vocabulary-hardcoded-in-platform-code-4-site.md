---
# folio-assistant-sklb
title: Folio vocabulary hardcoded in platform code — 4 sites, needs a registry not a rename
status: todo
type: task
created_at: 2026-08-08T09:54:51Z
updated_at: 2026-08-08T09:54:51Z
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
