---
# folio-assistant-d2kp
title: 'The gen-docs-pages --check gate has never run: a folded YAML line, and pages that carry live QA verdicts'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T07:50:26Z
updated_at: 2026-09-19T09:48:24Z
---


Found while adding a gate beside it (PR #351, bean `lgwe`). Two defects, and
the second is why the first is not a one-line fix.

## 1. The step is a continuation line, so it has never run

`.github/workflows/code-quality-gates.yml`:

```yaml
      - name: agent memory is assembled
        run: bun run agent-memory:check
          bun run scripts/gen-docs-pages.ts --check
```

The second line is more-indented, so YAML folds it into the same plain scalar.
The step executes

    bun run agent-memory:check bun run scripts/gen-docs-pages.ts --check

— `scripts/agent-memory.ts` ignores the trailing arguments, exits 0, and
`gen-docs-pages --check` is never invoked. The gate the comment above it
describes does not exist.

## 2. Turning it on makes it a LIVE-VERDICT gate

Measured 2026-09-19 on `origin/main` at `ed3403322`: **12 pages stale**, and
the reason is not that anybody forgot to regenerate. `gen-docs-pages` writes
QA COUNTS into the pages:

```
-  ... fa-qa-fail ... "Knowledge-graph QA: 1 fail, 0 warn, 9 pass, 0 n/a"
+  ... fa-qa-pass ... "Knowledge-graph QA: 0 fail, 0 warn, 10 pass, 0 n/a"
```

That page went stale because the graph got BETTER — the actor-kind fixes in
#353 turned a failing criterion green. So the generated pages go stale
whenever the knowledge graph changes at all, and enabling the check reddens
every KG-touching PR that does not also regenerate.

Consequence today, which is its own finding: **the published badges lie.** The
site currently tells a reader that a knowledge-graph check fails on
`publication-workflow.md` when it passes.

## Options, with what each costs

1. **Un-fold the line and regenerate in the same PR.** Cheapest now (14-line
   diff). Cost: every later PR that touches the graph must remember to run
   `bun run scripts/gen-docs-pages.ts`, and the failure mode is a red gate on
   a change that did nothing wrong.
2. **Un-fold, and regenerate the pages in CI on merge** the way `docs-site.yml`
   already does, gating only on the non-verdict parts. Cost: the check stops
   covering the verdict badges, which is most of what goes stale.
3. **Stop embedding live verdicts in the generated page** — have the badge
   fetch its own witness at load, as the QA panel already does for its
   contents, so the page is a function of the corpus STRUCTURE only. Most
   work; the only option after which "stale" means somebody actually forgot
   something.

Recommendation: **3**, with **1** as a stopgap if the wrong badges need to
come off the site sooner. Not done in #351 because either choice is a policy
decision about every future PR, and making it inside an unrelated translation
change is how a gate gets turned back off by the next person it blocks.

## Done when
The step runs as its own step, and a red result means a real omission rather
than a graph that changed.

_2026-09-19T09:42:06Z_ — Two things, from the 1hsf session (branch claude/wonderful-bohr-6kxh7b), neither fixed here. (1) The staleness is growing fast: code-quality-gates.yml records '12 pages stale' measured 2026-09-19 on main at ed3403322; re-measured today on main at 4d76d9da from a clean tree, 113 stale. Roughly 9x in a day, so the cost of enabling this gate is rising faster than the comment assumes. (2) That same comment cites this work as bean '2u6m', which does not exist in beans/defs — this bean is d2kp. Left both alone deliberately: the comment's own warning is that smuggling the fix into an unrelated PR is how the gate gets turned back off.

_2026-09-19T09:48:24Z_ — Implemented option 3 in PR #378 (branch claude/d2kp-live-verdicts). Pages now carry corpus STRUCTURE only; the badge fetches a per-page qa-index.json at load and paints one of three states (determined / determined-empty / could-not-determine), never collapsing them. The YAML continuation line is un-folded into its own step. Second finding, from the gate's first ever run: docs/assets/todos/index.json was UNREPRODUCIBLE, not stale -- processHierarchy and beanFile iterated readdirSync in raw directory order, which Bun does not sort, so the published key order differed per checkout. Both now sort, with an order (not set) assertion in scripts/tests/todos.test.ts. Third: the index was briefly _qa-index.json, which GitHub Pages strips without .nojekyll; renamed and guarded by a test.
