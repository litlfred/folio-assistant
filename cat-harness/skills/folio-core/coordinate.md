---
name: coordinate
description: Coordinate work across multiple in-flight Claude PRs working toward a shared goal. Post intent + asks on related PRs, identify cherry-pickable work, respond to code-review comments on your own PR, periodically triage sibling PR activity (new comments, CI status, new commits), watch main + newly created branches/PRs, escalate inconsistent findings to the author, and keep a coordination ledger up to date.
user_invocable: true
---

# /coordinate — multi-agent / multi-PR coordination

When several Claude branches are converging on the same long-term goal
(e.g. "reach the precision target", "close all violators of a rule",
"infrastructure overhaul"), each agent has only its own
context.  Without coordination they will:

- duplicate work (two agents both implementing the same helper),
- silently diverge (one renames a symbol, another keeps the old name,
  the merge conflicts),
- miss cherry-picks (one agent already wrote the template
  the others need),
- accept inconsistent findings without flagging them to the author,
- accept review-tool feedback without checking it against the actual
  artifact / sibling PR's framing (e.g. accepting an off-by-one "fix"
  that contradicts a definition another PR is also using),
- miss new sibling PRs that opened mid-session (new branches landing
  on `main` with overlapping scope).

`/coordinate` is the protocol that prevents this.  None of the agents
has all the answers; they look to the author for clarification on
inconsistencies, and they cherry-pick from each other.

## Workflow rule reminder (from AGENTS.md §Branch + PR workflow)

This skill assumes you've already created a branch + opened a PR for
the work tranche being coordinated. Per AGENTS.md (STRICT, supersedes
default "no auto-PR" guidance for this repo): **always create a
branch and open a PR at the start of every work tranche** — ASAP, and
**never ask the user "want me to open the PR?"** Branch + PR creation
is pre-authorized; the only git action needing explicit permission is
the *merge*. Commit early, commit often. Small structured commits
cherry-pick cleanly; big mixed commits do not. Exception:
integration-watcher batch audit-job sweeps may use a single bulk
commit.

## When to invoke

- Start of a session where the user mentioned **other branches/PRs**
  by name (e.g. "coordinate with `claude/foo` and `claude/bar`").
- Whenever you start a new substantive task in a multi-PR effort —
  before making code changes, post intent on the relevant PRs.
- When you finish a substantive task — post progress + concrete
  cherry-pickable artefacts (file paths, function names, templates,
  fixtures).
- **Periodic triage between substantive commits** (§7) — even with no
  external trigger, sibling PRs may have landed commits or comments
  that change your scope.  Run a quick triage every ~3–5 commits or
  when you finish a task and pick up the next one.
- **When `main` lands new commits** during your session — if any
  touch the same files, blocks, or scripts you
  are editing, treat as a sibling PR for §3 classification purposes.
- **When a code-review comment lands on your own PR** (gemini-code-
  assist, copilot-pull-request-reviewer, codex, or human reviewers)
  — see §5 *Responding to review comments*.
- When you encounter a **finding that contradicts another PR's
  framing** — write the disagreement up explicitly, post it to both
  PRs, and tag the author for resolution.
- **A COLLISION — coordinate.** A merge conflict caused by a
  sibling's landed work is not merely a thing to resolve; it is the
  signal that two sessions are editing one subject. Resolve it AND
  coordinate. Owner, 2026-09-21: *"collision=coordinate"*.
- **A POTENTIAL collision, seen in the beans — coordinate.** Before
  you start a topic, and at each triage, scan for an `in-progress`
  bean whose scope overlaps yours. That is the cheapest collision to
  find, because it is the one found BEFORE either of you has written
  anything. Owner, same day: *"potential collision by looking at
  beans = coordinate"*. How to read a sibling's state out of the
  store, and the boundary of that inference, is
  [`bean-coordination`](bean-coordination.md) §"Where a sibling
  session is visible from" — not restated here.

## Inputs

- The current PR number (your branch).
- A list of sibling branch names or PR numbers (the user gives this,
  or read `gh pr list --label "in-flight"`).
- The shared goal in 1–2 sentences.


## Where each section lives

This skill was 732 lines and the Protocol was 478 of them — an agent reads the
whole thing before acting, and at that length it skims. The Protocol now sits
beside this file. **Nothing was deleted and no step was renumbered**, because
other skills cite `coordinate §0a` and `coordinate.md §8a` and those citations
have to keep resolving.

| section | where |
|---|---|
| workflow rule, when to invoke, inputs | **here** — read before you start |
| **Protocol §1–§11** — the eleven coordination steps | [`coordinate/protocol.md`](coordinate/protocol.md) |
| output, anti-patterns, §11 STATUS.md, §12 same-goal coordination, related skills | **here** |

**Coordinating:** read this file for whether and when, then `protocol.md` for how.

## Output

After invocation, you should have:

- Read every sibling PR's body and changed-files list.
- Posted at most one coordination comment per sibling PR (intent +
  asks), unless you've made progress that warrants a separate
  progress comment.
- Triaged every open review-tool thread on your own PR (§5) and
  posted a single consolidated status comment.
- Run a §7 periodic triage every 3–5 of your own commits, capturing
  new sibling-PR comments + commits + CI status in one table.
- Run §8a (`git fetch origin main`) at each triage cycle and react
  to any main-landed changes that touch your scope.
- Run §8b (newly-opened PRs / branches) at each triage cycle and
  prompt the author when a new sibling overlaps your scope keywords.
- Identified the next concrete, non-overlapping task on your own
  workplan and started on it.
- (Optional) Created or updated `docs/coordination/<goal-slug>.md`
  with the current state.
- Escalated any inconsistencies via §6 with `@<author>` tagging.

## Anti-patterns

- ❌ Post a coordination comment that just summarises your own PR.
  Sibling agents already read your PR body.
- ❌ Pick the same task as a sibling without posting first.  Even
  if their PR has been quiet, the human author may have given them
  a verbal lead.
- ❌ "Resolve" an inconsistency by rewriting your finding.  Escalate
  to the author.
- ❌ Accept a review-tool fix without verifying it against the
  artifact and sibling-PR conventions.  Bot suggestions can flip
  conventions silently.
- ❌ Reply per-thread on a 6-comment review pass.  Use one
  consolidated status comment + per-thread `accept` /
  `reject-with-reason` flags.
- ❌ Skip §7 triage between commits because "I would have heard if
  something landed" — you wouldn't.  Sibling agents work in parallel
  and rarely interrupt each other.  Run the triage anyway.
- ❌ Silently merge / cherry-pick from `main` without §8a
  classification.  Main commits can also be inconsistent findings.
- ❌ Add a newly-opened PR to your scope without prompting the
  author (§8b).  The author may want it independent.
- ❌ Long prose.  Coordination comments are tables, file pointers,
  and one-line asks.

## §11 STATUS.md + master ledger pattern

A repeated flip-flop episode (a claim asserted and retracted across
several sessions) motivates a more structured coordination layer that
overlays this skill:

- **Root `STATUS.md`** — single dashboard
  listing every goal + pointer to its master ledger + active PRs.
- **Master ledger per goal** — `docs/coordination/<goal>.md` holds
  the durable narrative: current canonical status, open tasks,
  flip-flop history, sessions log.
- **Per-goal queue** — the `beans` queue (`beans/`); each
  open task is one entry.

When `/coordinate` runs, it now ALSO:

1. **Reads STATUS.md** to find which goal(s) the current PR
   touches.
2. **Reads the goal's master ledger** to identify the current
   canonical status — overrides recent commit claims if the
   ledger records a retraction.
3. **Reads the queue** to find sibling tasks in flight.
4. **References the ledger session log** when posting intent
   comments on sibling PRs, so the comment is grounded in the
   durable record, not just session memory.

See `session-intent` for the session-start / session-end
ledger + queue update protocol — `/coordinate` is the sibling-PR
arm; `/session-intent` is the durable-state arm. They are run
together at session start.

## §12 Multi-agent same-goal coordination

**Multiple agents MAY work the same goal in parallel.** Per author
directive: agents coordinate with the user on goals, not with each
other on task-level locks.

Model:

- **Goal** = product (author's directive). User-level concern.
- **Queue** = per-goal item list (the `beans` queue).
- **Tasks** are NOT exclusively claimed. Two agents may attack the
  same task with different methods — both threads have value.
- **Coordination is with the USER** on goal-level decisions, not
  agent-to-agent on task-level locks.

### When you detect a sibling agent on your task

Signals:

- The queue entry has `co_assignees` populated, OR
- A sibling PR (from `mcp__github__list_pull_requests`) has commits
  touching your task's scope files within the last 24h, OR
- The ledger session log shows another agent declared intent on
  the same task ID.

Workflow:

1. **Do not silently abandon.** Your independent attack is valuable.
2. **Post intent** on the sibling PR (this skill §3) so the sibling
   sees you're also working it.
3. **Ask the user** with `AskUserQuestion` whether to keep both
   threads or have one stand down. Include rich context per AGENTS.md
   §User accessibility — quote what each agent is doing, what method,
   what's been found, cost of running both.
4. **If user says one stands down**, the standing-down agent appends
   partial results to the ledger and updates queue
   `status: "open"` (releasing the task). The continuing agent
   may pick up the partial results.

### Watching for sibling-PR contradictions

Per §8 of this skill: at each triage cycle, look for sibling-PR
commits or comments that **contradict** your branch's framing. Per
§6: escalate inconsistent findings to the user. Do not silently
adopt the sibling's framing without an §6 conversation.

## What actually reaches a sibling — measured, 2026-09-21

**Do not assume you can message a sibling session.** Measured from a
cloud session with eleven siblings live on one repository:

| channel | reaches a cloud sibling? |
|---|---|
| `list_sessions` | **sees** them — id, title, branch, task summary |
| `ListAgents` | **no** — "no other Claude session is running on this machine" |
| `SendMessage` | **no** — the send is refused, target not reachable |
| a committed **bean** | yes — every session reads the store at session start |
| a **PR or issue** comment | yes — to whoever looks, and it is durable |

So `list_sessions` tells you WHO is working and on WHAT, and then the
message has to travel through something committed. That asymmetry is
worth knowing before you spend a turn on it: this list exists because
a session read the sibling list, drafted a careful message, and
discovered on the send that there was no channel.

The practical order:

1. `list_sessions` (or the beans) to find WHO overlaps and how.
2. Write the coordination INTO the artefacts they will read — the
   bean, the PR body, the issue. A bean is the strongest, because
   `bean-coordination` §"The store on `main` is the one every sibling
   reads" makes it the one surface every session opens.
3. Only then consider a direct message, and only for a sibling
   `ListAgents` actually lists.

### Eleven sessions is the normal case, not the exception

The same measurement: eleven sessions on `litlfred/folio-assistant`,
each on its own branch, each merging `main` on a loop. One branch took
**four** base merges in three hours, three of them conflicted. Main
moved 109, 38, 20, 24 and 28 commits between them.

A session that treats a conflict as an accident will treat all four as
accidents. The rate IS the environment, and the thing to do about it
is coordinate earlier, not merge harder.

### The worked example: a voice landing in a directory being deleted

A branch migrated every voice from `<instance>/voices/` to
`<instance>/skills/voices/`. Mid-flight, `main` landed a NEW voice in
`cat-harness/voices/` — the directory the branch removes. Git's rename
detection then placed the new file inside another voice's folder.

Nothing was wrong with either piece of work. What was missing was that
neither session knew about the other, and the beans said so the whole
time: the migration's bean was `in-progress` and names the directory.
**A bean scan by either session would have caught it before a line was
written**, which is exactly why the trigger above is worth having.

## Related skills

- `bean-coordination` — the committed store siblings read, how to
  claim, and how far a sibling's state can be inferred from it. The
  DETECTION half of this skill's bean trigger lives there.
- `delivery-summary` — what to post **after** a feature lands
  (one PR scope).
- `watch` — passive monitoring of upstream branches.
- `diff` — per-block change report (one PR scope).
- `session-intent` — session-start / session-end ledger +
  queue update protocol (the durable-state arm of coordination).
- `pending-show` — read-only display of current session's
  pending work (todos, intent, queue assignments).
- `prepare-merge-auto` — autonomous merge pipeline (uses
  this skill's sibling-coord pattern).

`/coordinate` complements them: it is the **active** cross-PR
protocol — including handling of code-review comments on your own
PR — not a passive watcher and not a single-PR summary.

## Flag-bearer reflections

Lessons from acting as flag-bearer across many sibling PRs on a shared
goal. Apply when you hold the flag.

1. **Build the ledger hub FIRST, then post.** Create
   `docs/coordination/<goal>.md` with: the direction (one boxed
   statement of the target), the *common infra everyone rows toward*
   (cheat-sheet step table, watcher queues, dashboards, a falsification
   anchor), and a per-PR "which way to row" roster with **report-back
   slots**. Post intent only after the hub exists, so every comment can
   link one canonical place. This is what makes "make sure all use common
   infra" actionable rather than a slogan.

2. **Tailor per-PR; then LISTEN.** A flag-bearer that only broadcasts is
   half-doing the job. Pull each sibling's current state (a background
   `Explore` agent reading PR bodies + last comments is ideal), and
   **fold their findings back as sharpenings** to your own plan. Record
   sharpenings in the ledger and amend the workplan — do not silently
   keep the stale plan.

3. **Anchor the cluster to one falsifiable target.** Give every sibling a
   shared regression target. It turns "which way to row"
   into a checkable claim and prevents divergent re-derivations.

4. **Push-race coordination with background agents.** When a background
   sub-agent and you both push to the same branch, wrap every push in a
   `fetch → rebase → retry` loop:
   `for i in 1 2 3 4; do git push && break || { git fetch origin <br> -q;
   git rebase origin/<br>; sleep $((2**i)); }; done`. The agent's commits
   may already be in your local history (shared working dir) — check
   `git log` before assuming a divergence.

5. **Billing-CI is noise — do not let it derail coordination.** If CI
   fails setup-phase (≤5 s, simultaneous, no logs) on every push while
   local validation stays green, recognise the billing signature
   (`litlfred/qou` `AGENTS.md` "CI billing failures"), note `[skip-ci: billing]`, and keep
   working; never re-diagnose it as a code problem or pause the cluster
   for it.

