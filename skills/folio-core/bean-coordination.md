---
name: bean-coordination
roles: [reader, collaborator, owner]
description: >
  Pointer to the bean-based session work-plan system (the `beans` CLI
  flat-file issue tracker, data under `beans/`). Operational usage lives in
  todo-manager.md / session-intent.md; the generic coordinator/orchestrator
  logic is owned by the folio-assistant platform.
---

# Bean Coordination

The **bean-based work-plan system** — the [`beans`](https://github.com/hmans/beans)
CLI, a flat-file issue tracker storing issues as markdown under `beans/` — is
how every session tracks its work-plan and how agents hand off across sessions.

## A bean is never deleted

`beans delete` exists in the CLI. **Do not use it — not on a sibling's bean,
and not on your own.**

Work that turns out not to be wanted is **scrapped**: `status: scrapped`, with
a section saying why. That is also what "disable" means here; the CLI's status
vocabulary is `draft`, `todo`, `in-progress`, `completed`, `scrapped`, and
there is no disabled state.

The reason is not tidiness. A scrapped bean records that something was
considered and rejected, and on what grounds — which is what stops the next
agent re-entering the same dead end. A deleted bean leaves a sibling session
unable to tell abandonment from accident.

**Claiming and closing are separately scoped.** Claim before you work, so two
sessions do not pick the same item — with the limit in the next section, because
a claim is not a lock. Never *resolve* a bean another session or a human owns —
closing someone else's is how one of them loses work it had not finished
reporting.

Full cycle, as a diagram: [Beans and todos](https://litlfred.github.io/folio-assistant/beans-and-todos.html).

**Operational spec (read these):**

- [`todo-manager.md`](todo-manager.md) — bean lifecycle: `beans create` /
  `update` / `list`, parent/child epics, status transitions. This is the
  authoritative *local* usage spec.
- [`session-intent.md`](session-intent.md) — session-start intent + session-end
  results protocol against the master ledger and the bean queue.
- [`pending-show.md`](pending-show.md) — read-only "what is this session
  working on?" display.
- [`idle-backlog.md`](idle-backlog.md) — pull right-scoped beans while idle.

**Install the CLI:** [`scripts/install-beans.sh`](../../../scripts/install-beans.sh)
(idempotent; `go install github.com/hmans/beans@latest`).

> **Ownership note.** The *generic* coordinator/orchestrator bean-coordination
> logic is maintained in the `folio-assistant` platform and synced into
> consuming projects. Project-specific overrides should sit alongside, not
> replace, this canonical version.

## A claim is branch-local, so it announces rather than reserves

**A claim is a commit to `beans/defs/<bean>.md` on your feature branch.** A
sibling session reads `origin/main`, where the bean still says `status: todo`.
So your claim becomes visible to anyone else only once you push and open the
PR — and the platform's "open the PR at the first commit" rule is what makes it
visible then rather than at the end.

That leaves a window, from deciding to work an item to having a PR for it, in
which the bean reads as unclaimed to every other session. The mechanism is not
broken; it is **branch-local**, and reading "claim before you work" as a lock is
what produces the duplicate.

**So before you claim, look in the two places a sibling's claim can already be:**

```sh
git fetch origin main                            # their claim may be merged already
git show origin/main:beans/defs/<file>.md | head # ...status THERE, not on your branch
```

and then the open PR list, because a bean id is carried in a PR title or body by
convention:

```sh
# any open PR already naming this bean?  (or the equivalent MCP call)
gh pr list --state open --search '<bean-id>'
```

Neither check closes the window. Both are cheap, and the second catches the case
that matters most in practice — a sibling minutes ahead of you who already has a
PR up.

### The measurement

2026-09-19, bean `plj1` (`docs-site.yml`'s full-replace publish deleting every
open PR's `STAGING/` preview). Two sessions set it `in-progress` **61 seconds
apart** — 09:28:18Z and 09:29:19Z — and opened two PRs for it, #377 and #379, at
~09:36 and 09:37. Same diagnosis, same design choice, two implementations; #379
was withdrawn.

Both sessions followed "claim before you work" exactly as written and it
prevented nothing, because neither claim existed anywhere either session could
read. The PR-list check would not have fired at 09:29 either — but it would have
fired at 09:37, before the second PR was opened, which is where the duplicated
review effort actually gets spent.

**This is not the same failure as two concurrent PRs going green alone and red
together** (bean `nytj`, via a sidecar's recorded auditor hash). That is about
merging concurrent work. This is about two sessions choosing the same work.

**And collision is not always a defect.** The withdrawal above produced a
genuine comparison of two designs and found a third-state bug in the losing one.
It is a real cost, honestly bounded. Bean `35nj` records the options for
narrowing the window — a wording fix, a direct claim push to the default branch,
a PR-list check at claim time, or accepting it — none implemented.

## Disambiguation (do not conflate)

- **beans** = the agent's *session work-plan* (`beans/`, this skill).
- **sidecars** (`*.qa.json`, `*.witness.json`) = *content state tracking*.
  Beans ≠ sidecars. Do **not** convert QA / witness queue items into individual
  beans (see todo-manager.md disambiguation block).
