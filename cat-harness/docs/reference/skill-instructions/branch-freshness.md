---
layout: default
title: 'Branch freshness'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/branch-freshness.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/branch-freshness.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/branch-freshness.md){: .fa-edit-source }

{% raw %}
# Branch freshness — stay current with main

A feature branch that drifts from `main` accumulates three kinds of debt:

1. **Merge conflict debt** — the longer the branch lives, the harder to merge
2. **Assumption debt** — siblings may have renamed, moved, or restructured
3. **Workplan debt** — siblings may have completed overlapping beans

## When to check

| Trigger | Action |
|---|---|
| **Session start / resume** | Always. Full freshness check before anything else. |
| **Long idle** (> 30 min) | Check before resuming work. |
| **Before opening a PR** | Rebase first. |
| **After a sibling PR merges** | If `git fetch` shows new commits on main. |
| **Periodically** | Every ~10 commits or ~1 hour of active work. |
| **Before posting a round summary** | Ensure summary reflects current main. |

## The freshness check

### Step 1 — Fetch and measure drift

```bash
git fetch origin main
git log --oneline HEAD..origin/main | head -20
```

0 new commits → skip to Step 4.

### Step 2 — Scan what changed

```bash
git diff --name-only HEAD...origin/main
git log --oneline HEAD..origin/main
```

**Look for:**
- Files you are also editing → **merge conflict risk**
- Schema changes (`schemas/*.ts`) → **types may be stale**
- Pipeline changes (`content/pipeline/*.ts`) → **behaviour may differ**
- Skill changes (`cat-harness/skills/**`) → **guidance may be out of date**
- BPMN changes (`cat-harness/processes/*.bpmn`) → **diagrams may conflict**
- Bean changes (`.beans/`) → **beans may have been created/resolved by sibling**
- `AGENTS.md` changes → **rules may have changed**
- **Directory restructuring** → paths you're writing to may have moved

### Step 3 — Rebase

```bash
git rebase origin/main
```

If conflicts arise:
- Resolve one commit at a time
- Check whether your change or upstream is correct — don't blindly keep yours
- Non-trivial conflicts → **flag to the BA**

After successful rebase:
```bash
git push --force-with-lease
```

### Step 4 — Re-analyse the workplan

```bash
beans list
```

Ask:
- Are any open beans **redundant** (sibling completed equivalent work)?
- Did upstream introduce **new defects or requirements**?
- Did a schema/pipeline change **invalidate** implementation assumptions?
- Do I need to re-run tests?

If yes: update beans, re-run tests, note in turn summary.

### Step 5 — Report

```
> **Rebased** on origin/main (12 new commits). Notable: schema type Foo
> renamed to Bar (adjusted). Bean xyz1 resolved by sibling (removed from
> workplan). Tests pass.
```

Or:
```
> **Checked** origin/main — 0 new commits. Current.
```

## Rules

- **Never rebase over review comments** — merge instead (`git merge origin/main`)
- **Never rebase someone else's branch**
- **Re-run BPMN render after rebasing BPMN files**
- **Re-check beans before creating** — a rebase may pull in sibling beans

## Cross-references

- [`../../skills/folio-core/coordinate.md`](coordinate.md) — multi-agent coordination
- [`../../skills/folio-core/todo-manager.md`](todo-manager.md) — bean management
- [`../../skills/folio-core/bean-coordination.md`](bean-coordination.md) — cross-session beans
{% endraw %}
