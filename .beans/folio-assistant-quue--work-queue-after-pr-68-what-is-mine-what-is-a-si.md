---
# folio-assistant-quue
title: 'Work queue after PR #68 — mine, a sibling''s, or already done'
status: todo
type: task
priority: normal
created_at: 2026-08-08T00:05:00Z
updated_at: 2026-08-08T00:05:00Z
---

Index bean, written by session `3bada08b` after folio-assistant #68 merged
(`2cfde74`). Orders the remaining open work and records who owns what, so the
next session does not pick up a sibling's cluster or redo something `main`
already carries. **No sibling bean was edited to write this.**

## Ready to work — unclaimed

**1. `folio-assistant-tsca` — 26 typecheck errors in `content/**`.**
The highest-value one, because it closes a ratchet rather than paying down
debt: `schemas/**` is in `tsconfig.json`'s `include` now, `content/**` is not,
and until it is, most of the pipeline is still uncompiled. That gap has already
shipped two `ReferenceError`s (`_ctx` in `constraints.ts`, unbound `dir` in
`validate.ts`), both under commit messages claiming a clean `tsc`.

Measured on `2cfde74`, in descending size:

    8  content/pipeline/validate-bib.ts
    4  content/pipeline/audit-wiring.ts
    3  content/pipeline/bib-qa.ts
    2  content/pipeline/validate-references-human-review.ts
    2  content/pipeline/export-json.ts
    2  content/pipeline/export-bibtex.ts
    5  across validate-references, validate, qa-sweep, qa-checkers-voice,
       proof-axis-dashboard, codemod-refterm (1 each)

Reproduce with a throwaway config extending `tsconfig.json` and
`"include": ["content/**/*.ts"]`. Drain to zero, then move `content/**` into
the real `include` in the same change — the drain is only worth doing if it
cannot silently come back.

`scripts/**` is untried beyond a rough count (~15 more, several in tests).
Widen it after `content/**`, not with it.

**2. `folio-assistant-lnt1` — 171 `no-explicit-any`.**
Bigger and genuinely wants the per-bucket plan already written in that bean;
108 of the original 201 annotate something this repo already has a type for.
Not a sweep — each `any` is a separate typing decision. `render-latex.ts` is
done (30 -> 0, and its 21 structural errors too, verified byte-identical over
3483 rendered qou blocks).

**3. `folio-assistant-tnbf` — Lean workflow sprawl.**
Cheaper than it looks now: this session mapped all 33 workflows and their
triggers while fixing two that did not parse. Useful facts to start from —
only `atomic-mass-gen-check.yml` and `docs-site.yml` auto-trigger at all;
everything else is `workflow_dispatch`. So "which of these actually runs" has
a short answer, and folding the redundant ones is mostly a question of what
`lake-cache.sh` now subsumes. `scripts/tests/workflow-yaml.test.ts` will catch
a YAML mistake made while folding them.

## Do NOT claim — a sibling's active cluster

`folio-assistant-02kc`, `folio-assistant-5d7z`, `folio-assistant-ga7e` are one
lake-cache cluster with two recent sibling branches on it
(`claude/lake-cache-gutted-detection-2026-08-07`,
`claude/llm-authoring-pipeline-review-jrplaj`), and `main` has since landed
their tooling side. On `2cfde74`, `scripts/lake-cache.sh` carries 27 `trace`
references, 9 `gutted`, and 5 static-library checks, and
`scripts/reseed-lean-cache.sh` exists at ~15 KB.

**That is the detection and the automation, not the data.** Whether the
production cache branches have actually been reseeded is a question about
orphan-branch contents, not about this repo, and cannot be answered by reading
it. Do not mark these resolved on the strength of the tooling existing — and do
not resolve them at all; they are not ours.

`folio-assistant-nimj` (Nazrin as triviality oracle) is likewise in-progress
elsewhere.

## Deferred by its own text

`folio-assistant-15gn` — LeanDojo premise index, CI-only artifact. Left as it
stands.

## Not a bean, but outstanding

qou #4673 is unblocked and needs a **manual** `build.yml` dispatch from the
Actions tab. Not automatable from here: the GitHub App has `actions: read` on
qou but not `actions: write`, so the dispatch endpoint returns 403. Note that
dispatching it also publishes — `publish.yml`'s deploy job is gated on
`github.event_name == 'workflow_dispatch'`, and under `workflow_call` that
resolves to the caller's event, so a manual qou build pushes to `gh-pages`
(`keep_files: true`, so a merge rather than a wipe).
