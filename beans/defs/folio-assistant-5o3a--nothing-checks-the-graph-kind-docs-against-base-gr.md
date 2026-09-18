---
# folio-assistant-5o3a
title: Nothing checks the graph-kind docs against BASE_GRAPH_KINDS — prose drifted through three clean merges
status: todo
type: bug
created_at: 2026-09-18T18:30:40Z
updated_at: 2026-09-18T18:30:40Z
---


Found 2026-09-18 while verifying `main` after merging #267 and #268, not by any
check. That is the finding.

#266 collapsed the graph kinds `workplan` (at `beans/`) and `process-state` (at
`beans/workflow/`) into a single `beans` kind, with `beans/beans.json` naming
the `defs` and `workflows` nodes inside it. It changed `BASE_GRAPH_KINDS` in
`schemas/agent-harness.ts` and left every description of that map untouched:

- `skills/folio-core/directory-conventions.md` — the table still listed both
  retired kinds at a path that no longer exists. `AGENTS.md` designates this
  file the source of truth, so an agent following it would write
  `graph: "workplan"` and be refused by the registry.
- `schemas/agent-harness.ts` — its own doc comment opened "Five, and
  deliberately none of them renderable" over a map of four, and still argued
  for the split #266 had removed.
- `AGENTS.md` — described an intermediate state of #266's branch, before that
  PR's own reconcile commit `93511cdf`, asserting the declaration had no
  work-plan directory when it declares `beans/`.

#269 fixed all three. **This bean is the guard, not the fix.**

Why it survived: three PRs merged across the change (#266, #267, #268), every
one textually clean, every check green at every point. `gen-skill-docs --check`
verifies the generated mirror matches its hand-authored source — it cannot
notice that both are describing a registry they no longer match. No check
crosses from prose to code.

**Proposed guard.** A test asserting every kind named in the skill's graph-kind
table exists in `BASE_GRAPH_KINDS` plus the kinds registered by layers above
(today just `folio`, via `schemas/folio-graph-kind.ts`). Parse the table's first
column from the Markdown; the table is machine-readable already. Same shape as
`scripts/tests/skill-manifest-coverage.test.ts` (#268), which guards the
manifest-vs-disk direction.

Two things to decide before writing it, neither obvious:

1. **Which direction, or both.** A kind in the docs that the registry lacks is
   the defect above and should be hard. A kind in the registry the docs omit is
   also a gap but a milder one, and making it hard means every new kind must
   land with its prose in the same PR — which may be the right answer, but it is
   a policy choice, not a bug fix.
2. **Whether the historical references are exempt.** #269's rewrites
   deliberately name `workplan` and `process-state` in prose, to preserve the
   superseded design and stop someone re-proposing it. A naive parse must not
   read those as live claims. Scoping to the table's first column handles it,
   but only because the table is the machine-readable part — which is the
   argument for scoping there rather than grepping the file.

Not urgent. The instance is fixed; this closes the class.
