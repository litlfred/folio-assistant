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
a claim is not a lock.

**Closing is governed by evidence, not by authorship**, and this paragraph used
to say the opposite. It read *"Never resolve a bean another session or a human
owns"*, full stop, which contradicted §"Closing a bean whose work has already
landed" three screens down and produced the failure that section measures: six
beans verified done on `main` and left `in-progress` because the rule named who
may **not** close one and never named who **may**. Read that section before you
close anything — it carries the three obligations, and the `ready-to-close` tag
for the case where you cannot re-derive the measurement yourself. What stays
off limits is a bean a sibling is **mid-flight** on: a claim naming a branch, a
recent note, an open PR. Closing that is how a session loses work it had not
finished reporting.

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

### Re-derive from the REMOTE, never from your checkout (STRICT)

Obligation 1 says re-derive the evidence. **Where you read it from is part of
the evidence**, and getting that wrong produces a finding that is confident,
specific and false — which is worse than no finding, because it sends the next
reader off to verify an accusation.

**Two occurrences in one session, 2026-09-21, bean `pomp`.** Both were
published before being caught: one to a commit message, a PR body AND an issue
comment.

| | the claim | what was true |
|---|---|---|
| 1 | *"`gen-iris-pages.ts` has no `OWNED`, no prune, no orphan code — checked rather than assumed"* | `OWNED` is at line 104; the prune runs at 1575–1601 |
| 2 | *"`compose-docs.ts` is absent from main — a workflow step landed without its script, breaking every PR"* | the commit added the step, a 249-line script and a 209-line test together |

Two causes, and they need different guards:

**A branch older than the claim.** Grepping the working tree answers *"is this
in MY base"*, which is a different question from *"does this exist"*. Occurrence
1 grepped a checkout branched before the commit it was denying.

> Ask the remote: `git show origin/main:<path>`, `git log origin/main -- <path>`.
> Never `grep` over the checkout to prove an absence.

**A fetch in the same compound command is not a barrier.** Occurrence 2 ran
`git fetch -q origin main && git cat-file -e origin/main:<path>` — which looks
airtight and is not, because sibling sessions merge every few minutes here. The
ref was current when fetched and stale when read.

> Fetch, then read in a **separate** command, and re-read before publishing.

Neither guard catches the third case — a file that exists only on an open PR's
head. When the claim is *"nobody has built this"*, check the open branches too;
this session started building `ankg`, `s8nu` and a `viewer-prune` module that
siblings had already landed or had in flight, **five times**, and the check that
would have prevented each is one `git diff --name-only origin/main...<branch>`.

**The cost is asymmetric, which is why this is STRICT.** A missed finding is a
bean that stays open one more day. A false one about a sibling's work is a
correction, a retraction, and a reader who now trusts the next finding less.

### When you cannot re-derive it yourself — `ready-to-close`

Obligation 1 is the expensive one, and it is where the rule above stalls.

**Measured 2026-09-20, bean `bbbl`.** Four beans read as finished in their own
bodies and sat `in-progress`: `7uff` (*"Everything on this bean is now done …
Ready to resolve once the owner confirms; not resolving unilaterally"*, 0 of 7
boxes ticked), `t0i3` (its one open box done in the body at commit `8d1c8f27`),
`y8as` (both halves merged, the platform copy sha256-verified and deleted),
`d1r6` (a full `## Implemented` section, 0 of 5 ticked). Every session that met
one discharged it the same way — by leaving it open — so the cost is a session
of confusion per bean, paid again on every sweep.

Re-derivation is not always available. The measurement may need a running
deployment, a branch this container does not have, or a judgement the owner
reserved. The rule as written then has **no exit**, and *leave it open* is what
an agent picks, every time.

> **The third state: tag the bean `ready-to-close`, quote under a `## Evidence`
> heading what you DID verify, and say in one line what you could not re-derive
> and why. The owner confirms the batch.**

It is a **tag, not a status**, and the reason is mechanical rather than
stylistic. The status vocabulary belongs to the third-party CLI:

```
$ beans update <id> --status ready-to-close
Error: invalid status: ready-to-close (must be in-progress, todo, draft, completed, scrapped)
$ beans update <id> --tag ready-to-close
Updated <id>
```

and `BeanStatusSchema` in `schemas/tool-types.ts` is defined as *"exactly what
`beans update --status` accepts"*. A sixth status here would desync the schema
from the tool it documents on the next `beans` release.

`bun run check:ready-to-close` lists every tagged bean with its evidence, so the
confirmation is one read rather than four. **It reports and never acts** —
[`deletion-requires-confirmation.md`](deletion-requires-confirmation.md) — unless
the owner has waived the `bean-close` gate for this session or process run, in
which case the batch closes under that waiver and the turn report names it:
[`confirmation-waiver.md`](confirmation-waiver.md).

**It is not a parking space.** `ready-to-close` says *re-derivation is beyond
this session*; it never says *I would rather not*. Where you can run the check,
run it and close the bean — that is still the rule this subsection sits under.

## Where a sibling session is visible from (STRICT)

**Measured 2026-09-20, bean `ab3n`.** Eight sibling sessions committed to this
repository in one four-hour window. The session API returned **not found** for
all eight lookups by id, and its listing showed only the asking session. So
both of this skill's central instructions — claim before you work, and watch
the open PRs — assume a visibility that did not exist, and nothing said so.

### RE-MEASURED 2026-09-21: the listing works now, the messaging still does not

The paragraph above was half stale within a day, which is why it is corrected
here rather than rewritten — a measurement carries its date, and the shape of
the change is the finding.

`list_sessions` returned **eleven** running sessions on this repository, each
with its id, title, branch and a live task summary ("merging main (58 commits
behind); resolving conflicts in config, graphs schema"). That is a great deal
more than "only the asking session", and it is enough to see WHO overlaps you
and HOW before you write anything.

What still does not work is reaching them. `ListAgents` answers *"no other
Claude session is running on this machine"* — every sibling is its own cloud
container — and `SendMessage` to a session id is refused outright. So:

| | 2026-09-20 | 2026-09-21 |
|---|---|---|
| listing siblings | only self | **eleven, with branch and task** |
| looking one up by id | not found | (not retried) |
| messaging one | — | **refused, not reachable** |

**The durable conclusion below is unchanged**, and the re-measurement is why
it is worth trusting: seeing a sibling is not the same as reaching one, and
what you commit is still the only thing that arrives.

> **A session is an ephemeral container, and nothing about it survives the
> container except what it committed. The `Claude-Session:` trailer on a commit
> is therefore the ONLY durable session identity this repository has, and a
> branch tip is the only durable statement of where a session got to.**

### A sibling's state is INFERRED, and the inference has a boundary

| what the trailer and the branches DO tell you | what they do NOT |
|---|---|
| which commits a session authored | whether it is running now |
| when it started and stopped committing | whether it is blocked, thinking, or gone |
| which branches carry its work, and its latest subject | what it intends to do next |

**"Stopped committing" is not "finished", and it is not "abandoned".** Those
are three states and a checkout can distinguish only the first from the pair.
Treat a recent tip as a live claim, treat silence as a question, and ask —
never as licence.

### One command, not a procedure

```sh
bun run sessions --since 4h
```

`sibling-sessions` is a **Tool node** (`tools/sessions.ts`), which is what
`ab3n` asked for and for a reason: prose describing how to grep a trailer is a
procedure every session re-derives slightly differently, the counts then
disagree, and nobody can tell which sweep was wrong. It reads **all** branches,
because a sibling's work is on ITS branch — precisely where the asking session
cannot see it by looking at its own history. A window with no commits **exits
non-zero** rather than reporting "no siblings": a sweep over nothing has not
found anything.

### Worked example — the session that built this tool, tripping over it

**2026-09-20, an hour after `ab3n` was written.** This session created three
`milestone` beans for the owner's three goals, each carrying the `goal-review`
sweep's **paraphrase**, because the verbatim words were not written down
anywhere it could see — it searched the issue, its comments, the pull request
and the whole store.

A sibling session had created the same three milestones **with the owner's
verbatim words** and merged them to `main` at 18:50, about an hour earlier. All
three of this session's beans were scrapped as duplicates.

Two things were true at once and both matter:

- **The checkout is a snapshot.** A container fetched `main` when it started,
  and everything merged since is invisible until it fetches again. An hour is
  long enough here: 54 proposals merged in one four-hour window that same day.
- **`beans create` is not idempotent and dedupes on nothing**, so the cost of
  not looking is paid in duplicates somebody scraps one at a time. The
  existence check in [`todo-manager`](todo-manager.md) §"Check before you
  create" reads the LOCAL store, so it cannot catch this case: the duplicate is
  not there yet.

**So before creating a bean for a decision, or claiming one, do both:**

```sh
git fetch origin main
bun run sessions --since 4h
```

The second is the one that gets skipped, and it is the one that answers *who
else is on this right now*. It cost nothing and would have saved all three.

## A quiet claim — what `in-progress` does NOT tell you

**Measured 2026-09-20, bean `fgnw`.** 60 beans were `in-progress`; **43 had no
change in a four-hour window**, and 38 of those were last touched by a single
bulk move at 09:37. Eight sessions were active in that window. So at most 17 of
the 60 claims corresponded to a session actually working the item — and the
`status` field cannot tell a reviewer which 17.

That is the cost of §"A claim is branch-local" landing without its complement.
`blocked` has an expiry ([`bean-blocking.md`](bean-blocking.md)); `in-progress`
has nothing, so it carries **no information about activity** and a reader cannot
tell a stalled agent from a claim nobody has thought about since a bulk edit.

### The signal is liveness, not elapsed time

> **A claim is LIVE when something outside the bean says so: an open PR naming
> it, an unmerged branch touching it, or a note since. A claim with none of
> those has announced nothing to anybody — and a claim that announces nothing
> does not reserve anything.**

That falls straight out of the rule above it. A claim becomes visible to a
sibling when the PR opens, and this repository opens the PR at the first commit
([`continual-progress`](continual-progress.md) invariant 1). So "claimed, with
no PR and no branch" is not a claim a sibling could have seen even in
principle.

**Elapsed time is the fallback, not the rule**, because it is what a tool can
compute offline. `bun run health` reports `bean-quiet-claims` at **72 hours**
since `updated_at`, alongside `bean-claimed` as the denominator — *12 of 60* and
*12* are different findings. Its count is an **upper bound**: a bean it lists
may have an open PR the sweep cannot see. Read it as "check these", never as
"take these".

### Who may act

- **Any session may TAKE a quiet claim** — check for a liveness signal first;
  if there is none, work it, and say in the bean that you took it and what you
  found. This is the unclaimed case, reached by a different route.
- **Nothing re-statuses it automatically.** The check reports; a person or the
  session taking the work acts. A tool that flipped `in-progress` back to
  `todo` would be destroying the one record of who was where, which is the same
  argument that makes a bean `scrapped` rather than deleted.
- **Quiet is not evidence of completion.** Closing is governed by §"Closing a
  bean whose work has already landed", and staleness is not evidence. A quiet
  claim on unfinished work goes back to the pool; it does not get closed.

## The store on `main` is the one every sibling reads (STRICT)

§"A claim is branch-local" states the fact. This says what to do about it.

**Measured 2026-09-20, bean `cvab`.** Branch `claude/sleepy-rubin-mr6kdu`
(PR #477, 65 commits ahead, 1,937 files) carried the `kupb` epic and **12 of its
13 children**. None existed on `main`. A review of the store on `main` therefore
saw **0 %** of the IRIS work plan, and a whole goal's workstream was invisible
until somebody swept the branch by hand.

The owner chose both remedies, 2026-09-20:

1. **Land beans ahead of code.** A bean-only change — the epic, its children,
   their Done-whens — opens its own PR and merges **as soon as the plan
   exists**. The code branch that follows carries only status updates. A
   bean-only diff has nothing to review but the plan, so it does not wait on
   the code's review, and the store on `main` is never blind to a goal that has
   been decided.
2. **A sweep reads the open branches' stores too.** [`goal-review`](goal-review.md)
   already does; the todo-manager fallback does not, and the fallback is what a
   container without the CLI falls back to. Until it does, a sweep run from the
   fallback is reporting over `main` only, and must say so rather than present
   its count as the work plan.

The two are not alternatives. (1) prevents the blindness; (2) catches the
branches that were already open when (1) landed — including #477, whose 12
beans are still branch-only today.

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
