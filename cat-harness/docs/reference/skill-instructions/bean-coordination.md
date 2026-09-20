---
layout: default
title: 'Bean Coordination'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/bean-coordination.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/bean-coordination.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/bean-coordination.md){: .fa-edit-source }

{% raw %}
> **This is the skill `skill_fetch` serves.** A stub of the same name
> lives at `.claude/skills/local` and is published as
> [bean-coordination (local stub)](local-bean-coordination.html); it only points here.
> Edit this page's source, never the stub.

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

**Install the CLI:** [`scripts/install-beans.sh`](../../scripts/install-beans.sh)
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

### `bun run beans:claim <id>` closes it — when the remote lets it

**The window is closable and there is now a tool for it.** `scripts/claim-bean.ts`
builds the status change as a commit of its OWN and pushes it to the default
branch, so a sibling sees the claim immediately instead of when your PR opens.
Chosen by the owner over the PR-list check above, on the stated cost: a session
writes to the default branch for claims, which this repository otherwise routes
through pull requests.

```sh
bun run beans:claim <bean-id>              # store defaults to the CURRENT directory
bun run beans:claim <bean-id> --dry-run    # say what would happen
```

It is a **claim only** — never your work, which is the point: a claim bundled
with work cannot be pushed until the work is ready. It does write the same
status into **your** copy of the bean, and that is correctness rather than
convenience: the claim lands on the default branch, so a branch still carrying
`todo` would **revert it at merge time** as an ordinary content change. It does
not commit that — what to commit and when is yours. It builds the commit in a
detached `git worktree`, so a session mid-edit is not asked to accept a checkout,
and removes it on every path including failure.

**Read the outcome, because three of the five are refusals:**

| outcome | exit | what it means |
|---|---|---|
| `pushed` | 0 | on the default branch; every session sees it |
| `already-claimed` | 0 | a sibling holds it, and is **named**. Nothing written — pick another item |
| `already-closed` | 0 | it is `completed` or `scrapped` there. **Not claimed, deliberately** — reviving finished work, and especially a `scrapped` bean whose whole purpose is recording a rejected approach, is a decision rather than a side effect of asking to claim |
| `new-on-branch` | 0 | the bean is not on the default branch yet, so nobody can see it and there is nothing to race over. Claim locally and open the PR early |
| `fell-back` | **3** | the push was REJECTED. The bean is **not** claimed anywhere a sibling can see — claim on your branch and open the PR at your first commit |
| `unknown` | **2** | the default branch could not be read. **Never** "the bean is free" |

**`fell-back` is the case to expect, not an edge case.** Whether the default
branch accepts a direct push cannot be determined from inside an agent session:
`GET /branches/main/protection` answers 403 *"Resource not accessible by
integration"*, and `git push --dry-run` does not run the receive hooks that
enforce protection. So the tool attempts and handles the rejection rather than
assuming, and a rejected claim is loud with the fallback spelled out. A
non-fast-forward is different and is **retried** — another claim landed first,
and the retry may discover the bean is now theirs, which is the correct answer
rather than a conflict to force past.

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

## Lifecycle of a coordinated work item

The problem this solves: several agent sessions run in parallel against the same
repo, each in its own `claude/*` branch and ephemeral container. Without
discipline they duplicate work, clobber each other's queues, or resolve items a
sibling is mid-flight on. Beans are durable because they are committed, which is
what makes them the shared substrate.

1. **Prime** — at session start read the current work-plan (`beans prime` +
   `beans list`, or the CLI-independent fallback that parses `beans/` directly).
   Know what is open and what siblings are touching.
2. **Declare intent + claim** — before starting, set the bean `in-progress` and
   add a short note naming your branch. Read §"A claim is branch-local" above
   first: the claim announces, it does not reserve.
3. **Work** — keep the bean current; append status notes as you go. Do not fork
   it into a parallel `todos/*.json` queue — link to any bulk queue from the
   bean instead.
4. **Hand off or finish** — on landing, close the bean and update any cross-repo
   ownership note. **If you stop mid-flight, leave the bean `in-progress` with a
   note saying where you got to**, so the next session resumes instead of
   re-deriving. A bean abandoned silently is indistinguishable from one nobody
   started.

An **unclaimed** bean is fair game for any session; a claimed one is not.
Respect sibling claims. Agents create and set `in-progress`; they do not take
over the work another session is mid-flight on.

## Closing a bean whose work has already landed (STRICT)

The sentence above used to end *"they do not resolve another session's
items"*, full stop, and it produced the opposite of the care it intended.

**Measured 2026-09-20, bean `0pes`.** Six beans carried the same sentence,
verbatim in shape:

> *"Verified resolved, `<date>` on main at `<sha>`. … This bean's defect is
> closed. **NOT closing it — not my bean to resolve.**"*

`1dfh`, `ckpe`, `dzl3`, `g4dv`, `lx2s`, `xd1s`. Every one `in-progress`. And
the number that made it a defect rather than a habit: **zero** beans carrying
that phrase had ever reached `completed`. The rule named who may **not** close
a bean and never named who **may**, so nothing ever discharged it. It also
contradicted §"A claim is branch-local" one screen up, which says an unclaimed
bean is fair game — none of the six carried a claim.

The cost is the failure this section already warns about, reached from the
other side. *"A bean abandoned silently is indistinguishable from one nobody
started"* — and so is a bean **verified done** and left open. Worse, in fact:
an agent that picks one up re-derives work already on `main`. Paid twice in one
session, on `r1lz` and again while sweeping for others.

**So: a bean closes on EVIDENCE, not on authorship.**

> **You may close any bean — whoever opened it — when you have re-run the
> measurement yourself and it passes.** You may not close one because a note in
> it says somebody else measured it.

Three obligations come with that, and they are what stop it becoming a licence:

1. **Re-derive, never quote.** The note claiming resolution is the thing under
   suspicion; reading it is not verification. Run the check, then record the
   command and its result in the bean. Where a note gives a line number, verify
   the *fact* — line numbers rot. `xd1s`'s note said "seven workflows" and named
   six; four files actually carry the group, and the invariant holds by
   *group **or** retry*, which is what its gate asserts. Discharged on the gate,
   not on the count.
2. **A Done-when only a person can satisfy is not yours to discharge.**
   `lx2s`'s is *"Issue #215 can be closed by its author"*, and an agent never
   closes an issue on its own say-so. It stayed open, and its own note had
   already walked its resolution back. **Two of seven candidates in that sweep
   failed re-verification**, which is the whole reason the obligation is
   re-measurement rather than trust.
3. **Mid-flight is still off limits.** This governs work that has *landed*. A
   bean a sibling is actively working — a claim naming a branch, a recent note,
   an open PR — is theirs, finished or not.

**Verified-done and still not closable? Say why, with an expiry.** Same shape
[`bean-blocking.md`](bean-blocking.md) requires of a block, and for the same
reason: an exception that carries no way to re-derive it is indistinguishable
from an oversight, which is precisely how six of these accumulated.

Stopping because you are *blocked* is a different state with its own
requirements — what it waits on, since when, an expiry and a handoff:
[`bean-blocking.md`](bean-blocking.md).

## Which copy is canonical — `skills/folio-core/`

**This file.** A `.claude/skills/local/bean-coordination.md` existed until
2026-09-19 and described *itself* as "the generic source of truth" from which
downstream repos sync. That was measurably wrong: `LOCAL_PACKAGES` in
`src/tools/skill-fetch.ts` is the table `skill_fetch` serves from, it holds
`skills/folio-core` and no `.claude/skills/local` entry, and the local copy
carried no front matter at all. An agent asking for this skill by name has
always received *this* file. Bean `tdmg`.

So when this skill or the installer changes, **`skills/folio-core/` is what a
downstream repo syncs from**, and the generated mirror under the docs site
follows it automatically. On landing a coordination change that affects a
downstream repo, update that repo's ownership note and close the tracking beans.

## Disambiguation (do not conflate)

- **beans** = the agent's *session work-plan* (`beans/`, this skill).
- **sidecars** (`*.qa.json`, `*.witness.json`) = *content state tracking*.
  Beans ≠ sidecars. Do **not** convert QA / witness queue items into individual
  beans (see todo-manager.md disambiguation block).
{% endraw %}
