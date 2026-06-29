---
layout: default
title: Session Task Manager (`beans`)
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/todo-manager.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/todo-manager.md) — do not edit here.

{% raw %}
# Session Task Manager (`beans`)

> **Disambiguation:**
> - `beans` (`todo-manager`, this file) = the agent's **session work-plan**.
>   Managed entirely via the `beans` CLI issue tracker (data stored in `.beans/`).
> - `sidecars` (`*.qa.json` and `*.witness.json` files) = **content state tracking**.
>   Beans and sidecars are NOT synonymous! Do NOT convert bulk QA queue items into
>   beans. They are completely separate workflow systems.
> - `todo-review` = triage of **content feedback** stored under
>   `feedback/<paper>/` and surfaced via the MCP `/todos`
>   dashboard. That is paper-content scope, not session scope.

Instead of an in-memory list or markdown checklists, we manage session work and cross-agent coordination using the `beans` CLI issue tracker.

## Installing beans (fresh sandbox / cloud container)

`beans` is the [`hmans/beans`](https://github.com/hmans/beans) Go binary — a
flat-file issue tracker storing issues as markdown under `.beans/`. Cloud
sandboxes do **not** ship it, so reinstall on demand (Go ships in the sandbox):

```bash
scripts/install-beans.sh          # idempotent; installs into a PATH dir
# equivalently, the one-liner it runs:
GOBIN="$HOME/.local/bin" go install github.com/hmans/beans@latest
```

Note: the npm package named `beans` is an unrelated abandoned tool — do **not**
`npm install beans`. Verify with `beans list && beans check`.

## Core Directives for Sessions

1. **Every session is a Bean:** At the start of your session, you MUST create a parent bean (`--type milestone` or `--epic`) that represents the session and its goals.
   `beans create "Session: <Branch/Goal>" --type milestone`
2. **Every todo is a Child Bean:** All tasks, probes, and action items planned for the session MUST be created as child beans (`--type task`) and linked to the session bean.
   `beans create "<Task Title>" --type task`
   `beans update <child-id> --parent <session-id>`
3. **No manual `.md` checklists:** Never use `session-beans.md` or raw Markdown `- [ ]` checklists to track global tasks. Always use the `beans` CLI to prevent namespace pollution and maintain the official project tracking.

## Working with Beans

**1. Finding Tasks**
Use `beans list` to find beans you should work on. Look for `todo` or `in-progress` beans that match your current scope/branch.

**2. Setting Dependencies**
You can map out sequence blockers using:
`beans update <id> --blocked-by <blocker-id>`
`beans update <id> --blocking <blocked-id>`

**3. Updating Status & Adding Comments**
- When starting work: `beans update <id> --status in-progress`
- When completed: `beans update <id> --status completed`
- To add notes or discussion: `beans update <id> --body-append "Your note"`

## Status Display Format

When the user asks "status" or "show beans", run `beans list` and display the hierarchy:

```
## Session Beans
- [epic-123] Session: <branch-name> (in-progress)
  - [task-124] Task A (completed)
  - [task-125] Task B (in-progress)
  - [task-126] Task C (todo)
```
{% endraw %}
