---
# folio-assistant-oait
title: 'TOOL 6/13: Task_Validate — content graph & dependency analysis (19 files, 1 entry point)'
status: completed
type: task
priority: normal
created_at: 2026-09-20T04:34:35Z
updated_at: 2026-09-20T10:45:40Z
parent: folio-assistant-d308
---

Group 6 of 13 in `d308`. **19 files, 1 entry point.**

`content-graph`, `uses-field`, `uses-graph-hash`, `graph-index`, `graph-search`,
`semantic-cone`, `prune-transitive-deps`, `verify-block-walk`, `integration-audit`,
`audit-wiring`, `orphan-verdict-sweep`, `conjectural-propagation-audit`,
`conjectural-propagation-sweep`, `q-usage-audit`, `qa-checkers-q-usage`,
`wall-violations-sweep`, `proof-axis-dashboard`,
`proof-narrative-lean-equiv-sweep`.

**BPMN:** `authoring-a-paper · Task_Validate`, `serviceTask`, refs
`content-validate`. Shares that task with group 7 — the first place where
"one Tool per task" is already not one-to-one, and that is fine: a task may be
served by more than one Tool, which is what `alternativeTo` and `selection` are
for.

**Target repo (#223):** `folio-assist-core`.

**The rule this group must not break:** `uses[]` and `interprets` are the
EDITORIAL relation — what a READER must have read. They are never populated from
Lean. A Tool over this group that offered to "sync uses from the formal graph"
would destroy the signal every ordering metric is computed from. See
`uses-editorial-review`.

## Done when
- [ ] a Tool node over the graph queries
- [ ] `satisfies` includes `content-validate`
- [ ] nothing in its IO offers to write `uses[]` from `lean.ref`
- [ ] `tool-coverage` reflects it

---

## 2026-09-20: `content-graph-build`, and the `alternativeTo` box REFUSED

Node authored: `bun run cat-harness/content/pipeline/content-graph.ts`,
`satisfies: ["content-validate"]`, inputs `targetPath` (optional positional) and
`--json`.

### The last "Done when" box is wrong, and the schema says so

> - [ ] `alternativeTo` / `selection` set against group 6, since they share a task

**Not done, deliberately.** `ToolDefinitionSchema` in `schemas/tool.ts` refutes
that exact inference in its own doc comment:

> Deriving it was the first design, and measurement refuted it. Sharing a skill
> does NOT make two Tools substitutable: measured 2026-09-20, 12 of this
> instance's 25 skills carry more than one Tool, and nearly all are
> COMPLEMENTARY … Exactly one pair, `beans-cli` / `beans-manual`, is genuinely
> substitutable.

This group and group 10 are the ordinary complementary case. One asks whether the
content GRAPH is well-formed and well-ordered; the other whether a block is valid
against its schema. A folio runs both, in that order, and neither answer
substitutes for the other. An `alternativeTo` edge would oblige `selection` prose
comparing two things that do not compete — and the schema notes an author made to
write that writes noise.

So the box is struck rather than ticked. Both beans said it; both were reasoning
from "shares a task", which is the refuted premise.

### The `uses[]` rule, honoured structurally rather than promised

The node has **no input and no output** offering to populate `uses[]` from the
formal graph. That absence is the deliverable, not an omission. Its single
`report` output states the two edge counts separately and says they are never
summed, because a combined count is what would invite the sync that destroys the
editorial signal.

Better than I expected: **the script itself already keeps the third state.** Run
here it reports `formal edges: 0 (cache ABSENT — formal graph unavailable)` — so
an unavailable formal graph cannot be read as a graph with no formal edges. The
port description now says so.

### Verified by running it, not by declaring it

Exit 0, and **123 blocks found** — the platform's own `content/docs/` pages are
content objects, so this node has real subjects here rather than being authored
blind against a folio. 0 editorial edges, which is correct: the platform's docs
carry no `uses[]`.

### One output could not be typed honestly

`tool-types.ts` publishes **no numeric type at all**, so `editorialEdges: Count`
would have invented a type to fit this node — and a shell arm returns a printed
report, not two numbers, so it would also have overstated the invoke arm. One
`Text` port instead, with the split in its description. The vocabulary gap is
real and deliberately left open: adding a published type to suit one output is
how the vocabulary stops meaning anything.

## Done when

- [x] a Tool node over the graph queries
- [x] `satisfies` includes `content-validate`
- [x] nothing in its IO offers to write `uses[]` from `lean.ref`
- [x] `tool-coverage` reflects it — `content-validate` was served by NOTHING before this; now by two Tools that each actually validate
- [x] ~~`alternativeTo` / `selection` against group 10~~ — **refused**, see above
