---
name: merge-conflict-patterns
description: >
  Merge the base branch in and resolve, without a person, only the conflicts a
  DECLARED pattern covers — generated files, generated README regions, QA
  sidecars — then prove the result with the gate set. Refuses the whole merge
  when any conflict is authored or undeclared. Use for "merge main", "resolve
  the conflicts", "the PR is conflicted again", "auto-resolve", and when adding
  a pattern for a new kind of churn. Also governs what a merge steward does
  with a merge-train member it had to refuse: one deduplicated bean under the
  PR's own epic, a hand-back to the owning session with a fail condition, one
  dispatched agent when nobody owns it, one PR comment, and the close.
user_invocable: false
---

# Merge-conflict patterns — what a merge may resolve on its own

`bun run merge:main` is the command; `processes/sdlc/merge-base.bpmn` is the
process it executes, called from `Task_PrepareMerge` in
`code-change-review.bpmn`. The patterns themselves are data in
`cat-harness/scripts/merge-conflict-patterns.ts`. This page says what each one
is FOR, so a reader can tell a deliberate refusal from a gap.

## Why this exists

Measured 2026-09-30 over 300 `main`-into-branch merges on `origin/claude/*`
(bean `y7b3`, issue #1707): **235 conflicted, and 147 (63 %) conflicted only on
generated files.** Every one of those resolves the same way — take the base's
copy, regenerate — and each cost an agent a round and the PR another CI run.
Owner, 2026-10-01: *"1 + new skills/tools for each common churn/conflict
pattern"*, and *"put in merge process bpmn"*.

## The two rules that make it safe

1. **All or nothing.** Every conflicted path is classified before anything is
   touched. One refusal ABORTS the merge and restores the tree. Resolving nine
   generated files and leaving one authored conflict half-done reads as
   progress, and is not.
2. **Proved, not assumed.** After resolving, `bun run regen` asks every check
   the CI workflow runs and runs each stale one's writer until the tree
   settles. Anything `unrepaired` aborts the merge. No pattern names its own
   check: the gate set is derived from the workflow and cannot drift, a
   hand-kept list of check names can.

A path that **no** pattern names is refused. Adding automation is adding a
pattern, deliberately, with its reason — never widening a glob on a hunch.

## When one side deleted the file

A modify/delete conflict has no stage for the side that deleted it, so
`checkout --theirs` (or `--ours`) has nothing to take. Every resolving
strategy takes the **base's side of the deletion** instead: its copy when the
base kept the file, `git rm` when the base removed it — `takeBase` in
`merge-base.ts`, and `provisionalSide` in `qa-resolve-conflicts.ts` for the
delegated sidecars (#1854). Regeneration recreates the file if it is still
produced. Classification is by path, so an authored path in a modify/delete
conflict is refused exactly like any other conflict on it.

## The patterns

Counts are conflicted files in the 2026-09-30 measurement.

### `kg-qa-sidecar` — delegated (53)

`**/test/results/kg-qa/**`. A kg-audit sidecar can carry an attestation that
an earlier run or a person recorded, which no generator reproduces.
`qa:resolve-conflicts` reads git's stages and refuses such a file, so this
pattern hands over rather than taking either side. Listed FIRST: these paths
are also under `test/results/`, and falling through to `take-base` would drop
a recorded adjudication silently.

### `kg-qa-manifest` — take the base, regenerate

`**/test/results/**/kg-qa.manifest.json`. One per instance (hosted ones one level deeper), holding only the
auditor's script hash, so any change to `kg-audit.ts` restamps every one at
once. Not in the first measurement's top list; found when a replay of 40 real
merges refused one merge on these files alone. It holds no attestation, unlike
the sidecars it indexes.

### `qa-results` — take the base, regenerate (292)

`**/*.qa-results.json`. Whole-artefact QA results, rewritten whole by their
producer. They carried `updated_at` until #1714; they still change whenever
any finding does.

### `derived-results` — take the base, regenerate (142)

LSI indexes, detangle sidecars and tool-run records under `test/results/`.
Recomputed from the whole corpus, so any concurrent skill or schema change
touches them.

### `docs-auto` — take the base, regenerate (352)

The generated docs index pages, already `-merge` in `.gitattributes`. One page
per directory, so a new file anywhere changes one.

### `uml` — take the base, regenerate (201)

Generated overview diagrams and their SVGs.

### `glossary` — take the base, regenerate (207)

The generated glossary and LSI pages: whole-corpus aggregates where concurrent
term additions always collide.

### `translated-glossary` — take the base, regenerate

`cat-harness/docs/{ar,es,fr,ru,zh}/glossary/index.md`. The per-locale glossary
pages `glossary-page.ts` writes whole beside the English one (`check:glossary`),
so they collide exactly when it does. Not in the first measurement; found
2026-10-01 when a `merge:main` on #1754 refused on all five. Only the glossary
page is named: the rest of each locale directory is authored translation, and
a locale no generator writes (`de/`) is refused.

### `viewer-pages` — take the base, regenerate

`docs/external-schemas/index.md`, `docs/methodologies/index.md`,
`docs/processes/*.md`, `docs/qa/index.html` and
`docs/translation-status/index.html`: whole-file viewer pages, each with its
writer's `--check` in the CI workflow (`external-schemas:viz`,
`methodologies:viz`, `processes:viz`, `state:visualizer`,
`translation:status`). A new schema, diagram or translation anywhere rewrites
them. Found the same way, on the same merge.

It also holds `state:visualizer`'s other pages, `docs/{beans,todos,health,
issue-marks,swimlane-glossary,uploads}/index.html`, each headed "Generated by
scripts/state-visualizer.ts". **`docs/uploads/index.html` is the viewer OF
`uploads/`, not an upload** — before 2026-10-01 the `uploads` refusal's
`**/uploads/**` caught it, and #1764 refused on it. First match wins, so the
viewer entries sit above the refusal.

### `viewer-namespace` — take the base, regenerate

`docs/cat-harness/{catalogue,folio,library,schemas,uploads,voices}/**`: the
pages `gen-library-viz`, `gen-folio-viz` and `gen-schema-viz` place through
`viewerPlacement`, each rewritten whole from the corpus and checked by its
`:viz --check`. Same false positive as above: its `uploads/` pages render
uploads rather than being them (#1775). `docs-auto/` under the same prefix
keeps its own `docs-auto` entry.

### `navbar-include` — take the base, regenerate

`docs/_includes/generated/**`: the navbar/footer include written whole by
`gen-navbar-include.ts` (`navbar:include --check`). Any new page, graph or tile
rewrites it. Its authored neighbours in `docs/_includes/` stay refused.

### `viewer-nav-qa` — take the base, regenerate

`test/results/viewer-nav/viewer-nav.qa.json`: `check-viewer-nav`'s mechanical
layout verdict over every viewer page. Recomputed from the pages, and it
carries no reviewer's attestation — unlike a kg-qa sidecar, which is why it is
not delegated to `qa:resolve-conflicts`.

### `handler-index` — take the base, regenerate

`docs/cat-harness/published-graphs.md`, the handler's index of every published
graph and declared viewer, written whole by `gen-handler-index.ts`
(`handler:index:check`). Any new graph or viewer rewrites it. Found on #1754's
third merge, 2026-10-01.

### `health-report` — take the base's measurement

`test/health/results/*.health-report.json`. Not a derivation of the tree but a
**measurement** of external state (publish branch, clone size, the work plan),
written by `bun run health` and refreshed daily on the base by the
health-check workflow, so the base's copy is simply the newer measurement and
a branch's older one carries nothing worth keeping. `check:harness-state`
judges its producer hash; if the merge changed the producer, `bun run health`
rewrites it. Found on the same merge.

### `qa-witnesses` — take the base, regenerate

`test/results/witnesses/**`: witness projections (`qa-witness/v1`) and page
verdict indexes, written by `gen-docs-pages.ts` from the kg-qa sidecars and the
live subject. A projection, never an attestation — the sidecars it reads are
the delegated `kg-qa-sidecar` family — and the docs-site build regenerates them
at publish. Found on #1754's eighth merge, 2026-10-01.

### `pot-templates` — take the base, regenerate

`translations/**/*.pot`: gettext templates extracted from the English pages by
`pot-for-pages.ts` (`translation:pot:check`), so every edit to a source page
rewrites its template in every locale. The `.po` files beside them are
**authored translations** and stay refused. Found on the same merge.

### `site-data` — take the base, regenerate (36)

Generated site data indexes under `docs/assets/**/*.json` and `docs/_data/`.

### `readme-generated-regions` — hunk by hunk (209)

Directory READMEs mix authored prose with generated regions
(`<!-- kg:subgraph:begin -->` … `:end -->`) whose file counts and listings
change on every concurrent addition. A hunk **inside** a region takes the
base's side and the generator rewrites the region; a hunk in authored prose,
or one that moves a region boundary, **refuses**. The file-count churn
(`beans/README.md`, 76 alone) is resolved here rather than by changing what
the README shows — the owner kept the exact counts (#1707).

### `beans` — refused, by declaration (44)

Bean definitions are authored work-plan state. Two sessions editing one bean
is a coordination question (`bean-coordination`), and a duplicated
`updated_at` from a careless resolution is `check-bean-front-matter`'s
recorded defect.

### `uploads` — refused, by declaration (30)

Uploaded source material: provenance-bearing input, never regenerated.

## Adding a pattern

1. Measure first: replay recent merges with `git merge-tree --write-tree` and
   look at what the conflicting **lines** are, not just which files.
2. Add an entry with its `why` and the narrowest glob that covers it. Order
   matters: the first match decides.
3. Add a test that the unsafe neighbour is refused, not only that the case
   resolves.
4. Add a section here.

## In CI — opt in with the `merge-main` label

`.github/workflows/merge-main.yml` is a second CALLER of the same command,
never a second resolver (bean `d33q` part B). When `main` moves, it runs
`bun run merge:main` on every open, same-repository PR labelled `merge-main`
that is behind `main`, one live run per PR (a newer run cancels an older one).

- **It pushes only a proved merge**, as a fast-forward of the branch it checked
  out; if the author pushed meanwhile the push is rejected and nothing is
  overwritten.
- **A refusal pushes nothing**, labels the PR `needs-merge-human`, and lists
  the ✗ paths. Adding a pattern stays a person's change, made here.
- **One comment per PR, edited in place** on every run — except a run that
  was **cancelled** (a newer push to `main` superseded it) or whose merge step
  reported no status, which leaves the comment untouched. Before #1854 such a
  run rewrote it to "**Error** (exit )". The text is composed by
  `cat-harness/scripts/merge-main-comment.ts`, which is unit-tested.
- **The merge commit is still judged by CI**: pushed with `MERGE_MAIN_TOKEN`
  when that secret exists, otherwise followed by a dispatch of
  `code-quality-gates.yml` on the branch, because a GITHUB_TOKEN push triggers
  no workflow.

Why it is worth a runner: on #1754 (2026-10-01) one round took 19–46 min in a
shared agent container while `main` moved every few minutes, and GitHub runs no
`pull_request` CI on a conflicted PR — a 28-conflict resolution went 'dirty'
again within a minute of its push. Use the label on a PR that is waiting on
review rather than on its author; leave it off a branch somebody is pushing to.

## When a merge-train member is refused: bean, hand back, or dispatch

A merge steward builds a **train**: `merge-base.ts --no-regen` for each
member, then one `bun run regen`, then one CI run. A member is **refused**
when its merge hits an authored or undeclared conflict, or when the train's
combined result fails a gate that the member alone did not fail. The steward
drops it and the train goes on without it. `processes/merge-refusal.bpmn`
executes what happens to the dropped member. The author's side, the queue
and the bounce-back are the merge-manager SOP in
[#1802](https://github.com/litlfred/folio-assistant/pull/1802) (steps 10 and
12). The hand-back format is the `agent-handoff` skill in
[#1884](https://github.com/litlfred/folio-assistant/pull/1884).

**Why this exists.** Owner, 2026-10-02: *"if a merge in queue cannot be merged
for some reason, create a new bean (under appropriate epic/story…), hand it
back to the sibling (use the agent-to-agent handoff process with a fail
condition) for resolution, or dispatch an agent as appropriate."* Before this,
each refusal got an ad-hoc PR comment or chat message, and nothing in the work
plan said it had happened. The refusals on 2026-10-02 alone show the three
causes this section has to cover:

| PR | refused on | cause |
|---|---|---|
| #1808, #1819 | bean `ob3m` | two sibling navbar PRs edited the same bean (`beans`, refused by declaration) |
| #1804 | `artefact-verification.json` | authored file, no declared pattern |
| #1822 | `gen-library-jsonld.ts` | authored conflict with #1881, which overlaps it |
| #1852 | `proposals/index.md` | authored index, no declared pattern |
| #1764 | glossary page budget | each PR passed alone; the combination exceeded the budget |

### 1. Open one bean per refused PR, and check before you create

`beans create` dedupes on nothing (see `todo-manager` §"Check before you
create"). The title carries the PR number, so the check is exact:

```bash
beans list --json --search 'title:"Merge refused: #1822"' \
  | jq -r '.[] | select(.title | startswith("Merge refused: #1822 "))
                | select(.status != "completed" and .status != "scrapped") | .id'
```

- **An open bean already exists** for this PR: do not create a second one.
  Add the new refusal to it under `## Attempts` with `--body-append` (never
  `--body-file`, which replaces the body).
- **Otherwise create one**: `type: bug`, titled
  `Merge refused: #<n> <first refused path or gate>`. `--parent` and the
  create are one action (`todo-manager` §"After you create").

**The parent is the epic or story the PR's own work belongs to,** not the
steward's epic. Find it in this order: the bean the PR's branch adds or claims
(`git diff --name-only origin/main...<head> -- beans/defs/`), then a bean id in
the PR body or commit messages. Parent the refusal under **that bean's parent**
when the PR's bean is a task, or under the PR's bean itself when it is an epic
or story. Then mark it `--blocking <the PR's bean>`. Only when the PR names no
bean at all does it go under the steward's own merge-gate epic (`nok9` here),
and the bean body says so.

The body records what the owning session needs in order to act without asking:

```markdown
PR #1822, head <sha> (the sha the train used), dropped from train
`<train name>` (its other members, and the base sha it merged onto).

## Refused
- `cat-harness/scripts/gen-library-jsonld.ts`: authored conflict, no declared
  pattern. Overlaps #1881, which is already in main.

## Done when
- [ ] the PR's head merges main with `bun run merge:main` and no refusal, and
      CI is green on that head
- [ ] the PR re-enters a train with a new `ready: <sha>`, and lands
```

For a combined-gate refusal (#1764), list the gate, its first failing line, and
**which other members** the train held, because the fix may belong to either
side.

### 2. Hand it back to the owning session, with a fail condition

The owning session is the one in the PR's `Claude-Session:` trailer, or in its
body. Hand the bean back to it in `agent-handoff` form: the steward is the
**coordinator and verifier**, the owning session is the **executor**, and the
owner rules on anything authored. The bean carries:

- `## Roles`: steward (coordinator, verifier, closes), owning session
  (executor), owner (authored conflicts, any exception).
- `## Report to`: the PR. One line per event:
  `<id>: started`, `<id>: done <sha>`, `<id>: blocked <why>`.
- `## Done when`: as above. The verifier is the next train, not the executor's
  own log.
- `## Fails if`, the **fail condition**, which is when the steward takes the
  bean back:
  - no `started` line on the PR **within 4 hours**;
  - or no push to the PR branch **within 24 hours**;
  - or the owning session is **gone**: archived, failed, or unknown to
    `get_session`;
  - or the executor reports `blocked` on something it cannot settle.

Send the hand-back to the session itself (`send_message`), as **one line**
that names the bean and the branch, never the instructions. The instructions
are in the bean, on the branch. After that, the steward does not edit the
bean: anything it learns goes to the PR (`agent-handoff` §1).

**The fail condition is a takeover, not a reminder, and that differs from
`agent-handoff` §7 on purpose.** There, the executor is in another environment
and the coordinator *cannot* do the step, so an expiry only means asking
again. Here, the work is in this repository and an agent can do it, so a
missed deadline moves to §3. The one thing that is never done is putting a
second writer on a branch whose first writer may still be live: before taking
over, read the bean's holder note and the PR's last push (`bean-coordination`
§"A quiet claim").

### 3. When no live owner can be reached, dispatch one agent

If the owning session is gone, or the fail condition has fired, dispatch **one**
agent on the PR's branch (`dispatch-agent`). One agent is not a swarm; a
second one is, and needs the owner's per-swarm permission (`swarm-management`).
Its budget is modest: one fix, one push, one report.

- **It may do** what the patterns would have done had they been declared: bring
  main in with `merge:main`, regenerate, and fix a gate failure that has one
  mechanical answer. It pushes merge commits only, and never force-pushes.
- **It may not decide an authored conflict.** Two sibling PRs editing one bean
  (`ob3m`), one script changed differently on both sides (#1822 against
  #1881), or a page over its budget only in combination (#1764): each of these
  is a choice between authors. The agent writes the question to the owner on
  the PR, with both sides quoted, the options and a default, and stops
  (`interaction-modality` §4.1).
- **The dispatch is recorded on the bean** by the steward, before the agent
  starts: `## Attempts`, with the date, the reason the fail condition fired,
  the agent's session or task id, and the budget.

Two failed attempts with the same cause go to the owner instead of a third
dispatch (`agent-handoff` §7).

### 4. Comment on the PR once, and edit that comment

One comment per refused PR, **edited in place** as the bean moves on, as
`merge-main.yml` does with its own comment. It names the bean, the head sha,
the train, the refused paths, and who holds the fix (the owning session, a
dispatched agent, or the owner). A second refusal of the same PR updates the
same comment. Remove `ready-to-merge` when #1802's SOP is in force (step 10).

### 5. Close the bean when the PR's fate is settled

The steward is the verifier, so the steward closes:

- **the PR lands**: `completed`, with the merge commit as evidence;
- **the PR is closed unmerged**: `scrapped`, with the reason and a link. The
  bean is never deleted (`bean-coordination`).

A fix that is pushed but has not landed does not close the bean. The member
must survive a train first. A refusal bean left open after its PR has gone is
the stale state that the `needs-merge-human` label already shows (bean `u7be`
item 4).
