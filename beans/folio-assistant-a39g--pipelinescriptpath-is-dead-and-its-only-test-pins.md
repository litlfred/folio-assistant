---
# folio-assistant-a39g
title: pipelineScriptPath is dead, and its only test pins the behaviour that made it dead
status: completed
type: task
priority: low
created_at: 2026-08-30T10:41:21Z
updated_at: 2026-08-30T14:24:38Z
---

## The finding

`pipelineScriptPath(script)` — `adapters/document/tools/_pipeline.ts:79` — has
**zero production callers**. Measured corpus-wide (`grep -rn pipelineScriptPath
--include=*.ts . | grep -v node_modules`), all four references are:

- `adapters/document/tools/_pipeline.ts:79` — its own definition
- `scripts/tests/qa-tools.test.ts:11,36,37,39` — one test, importing and
  asserting it

It was superseded by `resolvePipelineScript`, which checks the folio's
`content/pipeline/<name>.ts` **and then the platform checkout's**, returning
`undefined` when neither exists. Every real caller (3 of them, all in
`_pipeline.ts` / `runPipeline`) uses the new one. The old function is already
carrying an honest `@deprecated` docstring that says exactly this: *"it must not
be used to decide whether a script exists."*

## Why this is a hazard rather than a defect

Nothing is currently wrong. `pipelineScriptPath` returns a true statement —
where the script *would* live in this folio — and no code acts on it. The
hazard is the test:

```ts
test("pipelineScriptPath resolves under content/pipeline with .ts", () => {
  const p = pipelineScriptPath("qa-sweep");
  expect(p.endsWith("/content/pipeline/qa-sweep.ts")).toBe(true);
  expect(pipelineScriptPath("x.ts").endsWith("/content/pipeline/x.ts")).toBe(true);
});
```

This pins the **folio-only** resolution — precisely the behaviour that caused
the bug `resolvePipelineScript` was written to fix (a scaffolded folio with no
`content/pipeline/` got `pipeline script not found` on every tool). So the
suite now has a green test whose subject no production path reaches, asserting
a semantics the codebase has deliberately moved away from. It cannot fail in a
way anyone should care about, and it cannot catch a regression, because there
is no live behaviour behind it.

That is the class catalogued in `folio-assistant-6fnb` ("tests that cannot
fail"), reached from the opposite direction: 6fnb's entries are tautological or
skipped assertions; this one is a real assertion about a dead subject.

## Options

1. **Delete both** — the function and its test. Cheapest, and the deprecation
   note already argues for it. Risk: it is `export`ed, so an out-of-tree
   consumer would break; there is no published package here (folio-assistant is
   consumed by sibling checkouts via `setup-folio-assistant.sh`, i.e. source),
   so the blast radius is greppable and currently empty.
2. **Keep the function, delete the test.** Retains the export for anyone who
   genuinely wants "where would this live in the folio" without implying the
   file exists. Removes the misleading green.
3. **Keep both, and change the test to assert the deprecation contract** —
   e.g. that `pipelineScriptPath` and `resolvePipelineScript` *disagree* on a
   script that exists only in the platform. That turns a dead test into a live
   one documenting why the second function exists.

**Recommendation (my judgement, not a finding): option 3.** It costs about six
lines, keeps the export, and converts the one artifact that currently misleads
into the one that explains the fix. Option 1 is fine if the owner would rather
the surface shrink.

**Default if nothing is done:** nothing breaks. The function stays inert and
correctly deprecated; the suite keeps one test that can never matter.

History: split out of `folio-assistant-e1f6` at its closure (2026-08-30), where
it was found while verifying that the shell-out resolver fix had actually
landed.


## CLOSED 2026-08-30 — option 3 taken

Converted the dead test into one that asserts the **deprecation contract**, per
the recommendation above. `pipelineScriptPath` keeps its export and its
`@deprecated` note; what changed is what the suite asserts about it.

**The discriminator is a script name that exists nowhere**, which needs no
fixture and holds under both folio layouts:

- `pipelineScriptPath(nowhere)` → a folio-rooted path, always, **without
  touching the filesystem**.
- `resolvePipelineScript(nowhere)` → `undefined`.
- `runPipeline(nowhere)` → `ok: false`, error contains
  `"pipeline script not found"` — which is *why* the routing matters: a caller
  trusting the first would spawn a missing file.

That turns the one artifact that misled into the one that explains the fix, and
it now fails in both directions that matter — if someone "fixes"
`pipelineScriptPath` to do an existence check (silently making it a second
resolver), or if `resolvePipelineScript` regresses to returning a path blindly.

### Proved live by mutation, not assumed

A test that passes is not evidence it can fail — that is the whole `6fnb`
class. So the regression was actually introduced:

    mutant: resolvePipelineScript returns `inPlatform` unconditionally
      -> 6 pass, 2 fail
    restored
      -> 8 pass, 0 fail   (was 7 before this change)

The mutant is also caught by the pre-existing `runPipeline returns a structured
error for a missing script` test, so there is redundancy here rather than sole
coverage — worth stating plainly rather than claiming this test is the only
guard.

**Not done, and deliberately:** `pipelineScriptPath` still has zero production
callers. Option 1 (delete both) stays available and is a one-line follow-up if
the export is ever confirmed unused out of tree. The function is honest and
inert; the misleading part was the test, and that is what was fixed.
