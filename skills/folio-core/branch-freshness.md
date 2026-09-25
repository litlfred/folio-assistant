---
name: branch-freshness
description: >
  Periodically rebase or merge main into the feature branch, detect what
  changed upstream, and re-analyse the session workplan. Prevents stale
  assumptions, merge conflicts, and duplicated work — especially after
  session restarts, long idle periods, or heavy sibling activity on main.
roles: [reader, collaborator, owner]
---

# Branch freshness — stay current with main

A feature branch that drifts from `main` accumulates three kinds of debt:

1. **Merge conflict debt** — the longer the branch lives, the harder it is
   to merge. Rebasing periodically keeps conflicts small and local.
2. **Assumption debt** — a sibling session may have changed the schema,
   renamed a function, or moved a file that your branch still assumes is
   in the old location.
3. **Workplan debt** — a sibling may have completed work that overlaps
   with your open beans, or introduced new work that your branch should
   account for.

## When to check

| Trigger | Action |
|---|---|
| **Session start / resume** | Always. Run the full freshness check before doing anything else. |
| **Long idle** (> 30 min between tool calls) | Check before resuming work. |
| **Before opening a PR** | Rebase first. A PR that cannot merge cleanly wastes reviewer time. |
| **After a sibling PR is merged** | If you see a merge notification or `git fetch` shows new commits on main. |
| **Periodically during long sessions** | Every ~10 commits or ~1 hour of active work, whichever comes first. |
| **Before posting a round summary to the issue** | Ensure your summary reflects the current state of main, not a stale view. |

## The freshness check

### Step 1 — Fetch and measure drift

```bash
git fetch origin main
git log --oneline HEAD..origin/main | head -20
```

If there are **0 new commits**, you are current. Skip to Step 4.

If there are **new commits**, continue.

### Step 2 — Scan what changed

```bash
# Files changed on main since your branch diverged
git diff --name-only HEAD...origin/main

# Commits by other agents/sessions
git log --oneline HEAD..origin/main
```

**Look for:**
- Files you are also editing → **merge conflict risk**
- Schema changes (`schemas/*.ts`) → **your types may be stale**
- Pipeline changes (`content/pipeline/*.ts`) → **your validators/renderers may behave differently**
- Skill changes (`skills/**/*.md`) → **your behaviour may be out of date**
- BPMN changes (`docs/workflows/*.bpmn`) → **your diagrams may conflict**
- Bean changes (`.beans/`) → **beans you planned to create may already exist; beans you claimed may have been resolved by a sibling**
- `AGENTS.md` changes → **the rules you are following may have changed**

### Step 3 — Rebase

```bash
git rebase origin/main
```

If conflicts arise:
- Resolve them one commit at a time
- For each conflict, check whether your change or the upstream change is
  correct — do not blindly keep yours
- If a conflict is non-trivial (both sides made intentional changes to the
  same logic), **flag it to the BA** rather than guessing

After a successful rebase:
```bash
git push --force-with-lease
```

### Step 4 — Re-analyse the workplan

After rebasing (or confirming you are current), check your beans:

```bash
beans list
```

**Ask yourself:**
- Are any of my open beans now **redundant** because a sibling completed
  equivalent work on main?
- Did a sibling introduce **new defects or requirements** that I should
  add to my workplan?
- Did a schema or pipeline change **invalidate** any of my implementation
  assumptions?
- Do I need to re-run tests to verify my branch still works against the
  new main?

If the answer to any of these is yes:
1. Update or close affected beans
2. Re-run relevant tests (`bun test`, `bun run scripts/render-bpmn.ts`, etc.)
3. Note the rebase and any workplan changes in your next turn summary

### Step 5 — Report

In your turn summary, note the freshness check:

> **Rebased** on `origin/main` (12 new commits). Notable upstream changes:
> schema type `Foo` renamed to `Bar` (adjusted my branch), bean `xyz1`
> resolved by sibling (removed from my workplan). Tests pass.

Or if current:

> **Checked** `origin/main` — 0 new commits since last rebase. Current.

## Rules

- **Never rebase a branch that has an open PR with review comments.**
  Force-pushing loses the review context. Instead, merge main into the
  branch (`git merge origin/main`) to preserve the comment thread.
- **Never rebase someone else's branch.** If a sibling's branch is stale,
  note it in the coordination ledger (see `coordinate.md`), do not fix it.
- **A rebase is not a merge.** Do not create merge commits on feature
  branches — rebase to keep the history linear, unless there is an open
  PR with comments (see above).
- **Re-run the render after rebasing BPMN files.** A rebase that touches
  `.bpmn` files may produce a clean merge but a broken diagram. Always
  `bun run scripts/render-bpmn.ts` after.
- **Check beans before creating.** A rebase that pulls in sibling bean
  changes means `beans create` may now duplicate an existing bean. The
  check-before-create protocol in `todo-manager.md` applies after every
  rebase, not just at session start.

## Cross-references

- [`coordinate.md`](coordinate.md) — multi-agent coordination protocol
- [`todo-manager.md`](todo-manager.md) — bean creation and management
- [`bean-coordination.md`](bean-coordination.md) — cross-session bean rules
- [`crdm-requirements-workflow.md`](crdm-requirements-workflow.md) — Phase 6
  iterative development (the inner/outer loop context where freshness matters)
