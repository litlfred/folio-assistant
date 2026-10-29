---
name: lean-content-test
description: >-
  The paper-folio half of the harness's content-test: run Lean proof
  verification and LaTeX compilation, dispatch the repo's Lean CI, and check
  how much of the corpus a Lake build reaches before reading its numbers.
---

# Lean content test

The harness skill `content-test` (`skill_fetch content-test`) tests any
content type's artifacts and says why a local build is not CI green and why a
green build only covers what its target reaches. This skill is what those
rules mean for a paper folio with a Lean formal layer.

## Responsibilities

- Run Lean proof verification (`lake build`) on the formal layer.
- Dispatch the repo's Lean CI workflow on your branch
  (`gh workflow run lean_ci.yml --ref <branch>`) and record its run URL and
  conclusion in the PR body, as `content-test` requires.
- Validate LaTeX compilation and output.

## A local `lake build` is not CI

A local `lake build` runs on a warm `.lake`, your toolchain and whatever
build flags you set. CI runs cold. Check when the Lean workflow last ran, too:
qou's `lean_ci.yml` last ran 2026-04-25 and failed on `main`. Nothing
dispatched it for four months, and 37 modules stopped compiling unnoticed,
several with plain parse errors, which means files that had never compiled
at all.

## What a Lake build reaches

Lake's `lean_lib` uses `globs := roots.map Glob.one`, so `lake build`
compiles the root module plus its transitive `import`s, not the source
directory. `srcDir` widens where sources are *found*, never what is *built*.

Measured in qou on 2026-08-08: `lake build` reached **853 of the 1618**
modules under `lean/QOU/`. The other 766 (47%) had no olean at all. Among
them was the module holding the single `sorry` gating the Specht chain, which
is why the package build's sorry-warning list omitted it.

Count oleans against sources:

```sh
find .lake/build/lib/lean/QOU -name '*.olean' | wc -l   # 860
find QOU -name '*.lean' | wc -l                         # 1618
```

A ratio far from 1 means every corpus-wide number read off that build, such
as sorry counts, axiom counts or warning totals, is an undercount. Report what
the build covered.
