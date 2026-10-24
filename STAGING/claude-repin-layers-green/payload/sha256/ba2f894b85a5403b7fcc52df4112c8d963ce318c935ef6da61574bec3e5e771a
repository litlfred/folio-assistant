---
# folio-assistant-c4rz
$schema: bean/1.0.0
title: Migrate the feedback store into the declared todos/ graph
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T23:02:16Z
updated_at: 2026-10-24T10:10:15Z
parent: folio-assistant-8jt6
---


## What landed already (2026-09-18, `claude/festive-galileo-s7ibx0`)

The author's correction: *"TodoItem = Todo is a human actor state management.
it is content. should be moved into KG with declared dir like todos/"*, then
*"should be tagged by Roles, processes, tasks, user identification (e.g. as
tool github user)"*.

Done: three graph kinds (`todos`, `todo-items`, `todo-feedback`),
`schemas/todo-graph.ts` (directory declaration, same shape as `bean-graph.ts`),
`schemas/todo.ts` (the node plus `TodoTags` — roles, processes, tasks,
identities — and `resolveTodoTags` with its three states). 26 tests.
Documented in `skills/kg/kg-core/directory-conventions.md`.

## What remains, and why it was not done in the same change

**1. The existing feedback store is not yet a node of the graph.**
`FeedbackStore` (`src/core/feedback.ts`) reads `feedbackDir` from
`harness.config.json` and writes `<feedbackDir>/<itemId>/<rootName>.json`;
`types.ts` documents the convention as `feedback/<paper-dir>/<rootName>.ts`.
Neither is declared in a `todos/todos.json`. Moving it is a **folio-affecting
change** — a real folio has committed feedback at the old path, and the
platform carries no folio to test the migration against, so it cannot be
verified from this repo. Needs doing in a folio, with the old path readable
during the transition.

**2. Nothing writes the tags yet.** `TodoTags` exists and resolves; no
producer populates it. The obvious first producers are the feedback API
(`src/routes/feedback.ts` knows the submitter) and the CRDM workflow (which
knows the process and task). Until one does, every todo has empty tags — which
is a *determined* empty and must not be reported as "untagged content found".

**3. `folio_init` does not scaffold `todos/`.** It writes `content/`,
`uploads/`, `library/`, `harness.config.json`, the beans store and the rest.
Adding `todos/todos.json` with the `DEFAULT_TODO_GRAPH` layout is a small edit
there, but it should land WITH (1) so a new folio and a migrated one have the
same layout rather than two.

**4. The KG index has no builder.** `resolveTodoTags` takes a `KgIndex`
(roles, processes, tasks-by-process, actors) and nothing constructs one from
`skills/`. `scripts/kg-audit.ts` and `src/workflow/process-model.ts` already
read every part of it, so this is assembly, not new parsing. Note the contract:
a set that could not be read is `undefined`, **not** an empty set — the
distinction is what keeps a shallow checkout from reporting every tag as
dangling.

**5. The partition consequence is unresolved.** Todos being content means the
four `src/core/feedback.ts` / `src/routes/feedback.ts` / `src/types.ts` →
`schemas/types.ts` edges are genuine harness→core edges. The likely answer is
that the feedback ROUTES are a content feature and belong to core, but that is
a classification change worth making deliberately rather than as a side effect
of this bean. Tracked with the repo-partition work.

## Done when

- [x] A folio's feedback store is a declared node of its `todos/` graph, with the
  old path still readable through the transition (`litlfred/cat-harness-tools#692` @ `538d5800`).
- [x] At least one producer writes real tags (`litlfred/cat-harness-tools#692` @ `538d5800`, `litlfred/folio-assistant-core#204` @ `2fba8963`).
- [x] `folio_init` scaffolds the same layout (`litlfred/cat-harness-tools#692` @ `538d5800`).
- [x] A `KgIndex` builder exists and preserves the `undefined` ≠ empty contract (`litlfred/cat-harness-tools#692` @ `538d5800`).

## Not in scope

Reviving `todos/*.json` as a machine-queue directory. Bean `bfyw` retired that
and `scripts/tests/audit-output-paths.test.ts` pins it; bulk machine-generated
queues stay under `build/`.


_2026-09-29_ — **Re-parented `zzmr` → `8jt6`** by subject, per todo-manager §"WHICH parent" (owner choice '1 2 3' on the LSI epic-filing proposal, bean ansc). Migrating the feedback store into todos/ is the MEMORY & TODOS subject.

## 2026-10-20 — belongs with core (drain coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

Lane B2 measured it: FeedbackStore is `cat-harness-tools/src/core/feedback.ts`, but the feedback ROUTES are core's (declared `layer: core`) and the migration has to be verified in a real folio. Natural home: the folio-assistant-core lane (lane C) or the core store. Left `todo`, unclaimed.

## Progress 2026-10-24: cat-harness-tools#692 + folio-assistant-core#204
- `litlfred/cat-harness-tools#692` (`538d5800`):
  - `resolveDeclaredFeedbackDir` and `resolveFeedbackStoreDirs` resolve the `todo-feedback` node declared in `todos/todos.json` (`todos/feedback`) as the primary store directory while keeping `.folio-feedback` in `fallbackDirs` so existing items remain readable via `FeedbackStore.read` and `FeedbackStore.listAll` during transition.
  - `buildFeedbackTags`, `createFeedbackItem`, and `FeedbackStore.create` populate `TodoTags` (`roles`, `processes`, `tasks`, provider-qualified `identities`, `actor`, `references`, and `artefacts`).
  - `scripts/init-folio.ts` sets `feedbackDir: "todos/feedback"` matching the `todo-feedback` node in `todos/todos.json`.
  - `buildKgIndex(instanceRoot)` reads declared `roles`, `actors`, and `processes`/`tasks`, returning `undefined` (`not-checked`) when an axis's directory/file is absent and an empty `Set`/`Map` (`dangling`) when present and empty.
- `litlfred/folio-assistant-core#204` (`2fba8963`):
  - Wired `POST /api/feedback` (`src/routes/feedback.ts`) to populate `TodoTags` from the submitting context.
