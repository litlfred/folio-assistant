---
# folio-assistant-quue
title: 'Work queue after PR #68 — mine, a sibling''s, or already done'
status: completed
type: task
priority: normal
created_at: 2026-08-08T00:05:00Z
updated_at: 2026-08-08T08:24:47Z
---

Index bean, written by session `3bada08b` after folio-assistant #68 merged
(`2cfde74`). Orders the remaining open work and records who owns what, so the
next session does not pick up a sibling's cluster or redo something `main`
already carries. **No sibling bean was edited to write this.**

## Ready to work — unclaimed

**~~1. `folio-assistant-tsca`~~ — DONE.** 26 typecheck errors in `content/**`
-> 0, and `content/**` is now in `tsconfig.json`'s `include`, so the ratchet is
closed. Ten of the 26 were `Cannot find module`: the whole bibliography
subsystem (six entry points) threw at import and could not run. Spun off
`folio-assistant-zdrf` — TS/Zod schema drift that was silently stripping
`lean` from every provable — which is also done.

**1. `folio-assistant-lnt1` — 171 `no-explicit-any`.** Now first in the queue.
Wants the per-bucket plan already written in that bean; 108 of the original 201
annotate something this repo already has a type for. Not a sweep — each `any`
is a separate typing decision. `render-latex.ts` is done (30 -> 0, plus its 21
structural errors, verified byte-identical over 3483 rendered qou blocks).

**2. `folio-assistant-tnbf` — Lean workflow sprawl.**
Cheaper than it looks: this session mapped all 33 workflows and their triggers
while fixing two that did not parse. Only `atomic-mass-gen-check.yml` and
`docs-site.yml` auto-trigger at all, so "which of these actually runs" has a
short answer, and folding the redundant ones is mostly a question of what
`lake-cache.sh` now subsumes. `scripts/tests/workflow-yaml.test.ts` catches a
YAML mistake made while folding them.

**3. `scripts/**` into `tsconfig.json`'s `include`.** The next rung of the same
ratchet, ~15 errors, several in test files. Drain to zero, then widen — never
widen first.

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


---

## Update after `ec2b2aa` — the unclaimed queue is EMPTY

All three "ready to work" items are done, and `main` has since moved 10 commits
(through #70, the sibling lake-cache cluster, merged into this branch at
`0092e8d` with `tsc`/lint/428 tests green).

1. **`folio-assistant-lnt1`** — DONE. `no-explicit-any` 201 → 0 and the rule is
   promoted to `error`, which empties the `warn` tier entirely: every eslint
   rule is now an error. See that bean for what the drain surfaced — most
   consequentially that the generated skill registry had never validated
   against its own schema (15 issues), and three schemas had drifted from the
   data they describe.
2. **`folio-assistant-tnbf`** — DONE. The framing turned out to be wrong (they
   are all FOLIO workflows, not overlapping platform ones); see the bean.
3. **`scripts/**` into `tsconfig.json`'s `include`** — DONE, and `adapters/**`
   with it (`folio-assistant-adpt`). All five trees are compiled; a green
   `bun run typecheck` finally means what it says.

Everything still open is either a sibling's or deferred by its own text:
`02kc` / `5d7z` / `ga7e` (lake-cache cluster — `main` has since landed more of
it), `nimj` (Nazrin, in progress elsewhere), `15gn` (LeanDojo, deferred).

**Still outstanding and still not automatable from here:** qou #4673 needs a
manual `build.yml` dispatch from the Actions tab — the GitHub App has
`actions: read` on qou but not `actions: write`, so the dispatch endpoint
returns 403. Dispatching also publishes (`publish.yml`'s deploy job is gated on
`github.event_name == 'workflow_dispatch'`, which under `workflow_call`
resolves to the caller's event), so a manual qou build pushes to `gh-pages` —
`keep_files: true`, so a merge rather than a wipe.

This bean has served its purpose as an index; closing it. A future session
should start from `beans list` rather than from here.
