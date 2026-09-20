---
# folio-assistant-zkgs
title: findContentRepoRoot() stops at cat-harness/, so this repo's harness.config.json is never read
status: todo
type: task
priority: normal
parent: folio-assistant-1swy
created_at: 2026-09-20T13:54:01Z
updated_at: 2026-09-20T13:54:01Z
---


## What was measured

Found while fencing `detangler-archimedean-wall` behind `folioOptionalAxes()`.
The fence verified OFF immediately and could not be verified ON from anywhere
in this checkout, whatever the cwd. Every number below was observed.

`findContentRepoRoot()` walks up from `process.cwd()` and stops at the nearest
ancestor holding the declared folio directory. `cat-harness/harness.json`
declares one — `folio/`, the instance's own landing content — so the walk stops
at `cat-harness/`. This repository's `harness.config.json` sits one level up, at
the repository root. The two never meet:

```
cwd anywhere in the repo
  findContentRepoRoot()                -> /home/user/folio-assistant/cat-harness
  resolveHarnessConfigPath(that)       -> undefined
  readDeclaredFolioProfile(that)       -> { declaredBy: "undetermined (no harness.config.json)" }
  readDeclaredFolioProfile(repo root)  -> { profile: "document", declaredBy: 'harness.config.json contentType: "document"' }
```

Neither half is individually wrong. The declaration is correct — `cat-harness/folio/`
really is this instance's authored content. The config is correct where it is —
`src/index.ts` reads it to pick the MCP adapter for the whole checkout. The
split put them at two different roots and nothing noticed, because the resolver
answers with a plausible path rather than a fault.

## Why it matters, in this repository's own words

`harness.config.json`'s leading comment states the consequence exactly:

> "Declaring it is what makes QA criterion scoping work on this repo's own
> content; without it `readDeclaredFolioProfile()` returns undefined, the third
> state runs every criterion, and the paper adapter's LaTeX-shaped axes fire
> `critical` on prose that never reaches pdflatex."

That is the state the repository is in. The evidence is committed: sidecars
under `test/results/block-qa/content/docs/publication-workflow/` carry
`detangler-archimedean-wall` verdicts — a `profiles: ["paper"]` criterion —
scored against workflow documentation. Every other paper-profile criterion is
in the same position.

Second consequence: `folioOptionalAxes()` reads the same config, so **no
optional axis can be opted into from this repository at all.** `q-usage` has
been fenced this way for some time and its fence has never been openable here
either. A mechanism that can only ever answer one way is bean `xom7`'s shape:
the OFF state and the BROKEN state are indistinguishable from the outside.

## Done when

The config and the resolver agree, and something fails if they stop agreeing.
Three candidate fixes, NOT yet chosen — each changes what every pipeline
consumer sees, which is why this is a bean rather than a patch:

- **A.** Move `harness.config.json` into `cat-harness/`. Smallest diff.
  Wrong-looking: `src/index.ts` reads it to configure a checkout, and the
  platform's document corpus is `content/` at the repository root, not under
  `cat-harness/`.
- **B.** Keep walking up past a matched folio directory when no
  `harness.config.json` is found there. Fixes the symptom; makes the resolver
  answer two different questions ("where is the content" and "where is the
  config") with one walk, which is how it acquired the defect.
- **C.** Resolve the config root separately from the content root, and make the
  config root declaration-driven like everything else. Largest, and the only one
  that ends with a fact written down once.

Whichever: the gate is that `readDeclaredFolioProfile()` on this repository
returns `document` rather than the third state, and that a test fails if it
regresses. Re-sweeping the affected sidecars afterwards is part of the change —
the paper-profile verdicts on document prose are stale results, not findings.

## Not in scope here

Fixing it inside the fencing change. The fence was verified against a synthetic
folio root instead (`scripts/tests/folio-optional-axes.test.ts`, subprocess,
OFF 8 detangler criteria / ON 9), and the finding was recorded rather than
acted on — which is `graph-detanglement`'s own residue rule applied to the
session that found it.
