---
name: goal-review
description: >
  Cold start, then review a time window of activity — sibling sessions, the
  work plan, issues, change proposals, branches, CI — and prioritise what it
  finds against goals stated in the owner's words. Inputs are the window, the
  goals, the scope and the axes; the output is a synopsis (closed, open,
  needs doing, with effort), a priority queue per goal with selectable next
  actions, and the instruction gaps met on the way, each recorded as a work
  item. Use when asked "what happened", "what is stalled", "what should we do
  next for X", or at the start of a session that inherits parallel work.
user_invocable: true
allowed-tools: Read Grep Glob Bash Agent AskUserQuestion
---

# Goal review — cold start, sweep a window, prioritise against stated goals

Authored 2026-09-20 from a live session (bean `mgta`, issue #578): the owner
asked for "a synopsis of all that was active in the last 4 hrs — what is
closed, what is open, what needs to be done (work effort)", classified
against three goals, then asked that the interaction become this skill. The
numbers in this file are that session's measurements, kept as provenance for
the rules; they are not a description of the repository today.

**And a number is not the only thing that goes stale.** A sentence like *"the
API may not be able to see them: on DATE eight lookups returned not found"*
welds a **present-tense capability claim** to its dated evidence, and a
disclaimer about numbers does not reach the claim — a reader takes the first
clause as guidance and never re-tests it. So in this file every dated
observation is **labelled as one**, and every instruction is written in the
present tense as something to DO. Where the two have since disagreed, both are
kept: the observation with its date, and what re-measurement found. Bean
`8nzu`, opened after this skill's own axis 1 sent its first reader the wrong
way.

**This is a review, not a plan.** It reads everything and writes only work
items for the gaps it finds. Picking up the queue it produces is
[`pickup`](pickup.md); declaring intent is [`session-intent`](session-intent.md);
this skill sits before both and feeds them.

## Inputs — four, all stated before the first read

| input | what it is | default if the owner gives none |
|---|---|---|
| **window** | the time period to sweep, as a duration or two instants | the last 4 hours |
| **goals** | the outcomes to prioritise against, **in the owner's words** | none — ask, or review without a queue and say so |
| **scope** | which repositories and stores are in the sweep | the checkout you are in and its forge repository |
| **axes** | which kinds of activity to read | all six below |

Keep the owner's wording for a goal verbatim through the whole report. A goal
paraphrased by the agent is a different goal, and the reader cannot tell
which one the queue was built for.

## Cold start — before any durable read

Run the instance's cold-start line (the top of `AGENTS.md`), so the work-plan
Tool is in hand and primed. Two things learned the hard way:

- **The line can be wrong.** On 2026-09-20 it named a path that had moved in
  the repository split, in both `AGENTS.md` and the README. If it fails, the
  fallback Tool for the work plan still exists — find it through the tools
  graph, do not stop — and the failure is the first instruction gap to record.
- **Fetch every branch, not just the default.** Most of a window's activity
  is on sibling branches that have not merged.

Then fix the window's two edges as commits on the default branch: the last
commit before the window opened and the head now. Every "before → after"
measurement below is a diff between those two.

## The six axes, and what each one can and cannot tell you

**1. Sibling sessions. ASK THE SESSION API FIRST.** List the sessions; where
it answers, it gives what no inference can — each session's `session_status`,
and a `task_summary` that carries a held question in plain text. **Fall back to
commit trailers when it does not answer, and report "could not determine" when
neither does.** Never present the fallback as the method.

*Dated observation, 2026-09-20, kept as provenance and NOT as a capability
claim:* eight lookups by id returned *not found* and the listing showed only
the asking session. **Contradicted 2026-09-21**, when the same listing returned
seven siblings with their statuses — and with four sessions' pending questions,
which the trailer route cannot reach at all. The earlier sentence here asserted
that the API "may not be able to see them", welding a present-tense claim to
its dated evidence, and a reader who followed it skipped the query and missed
the sweep's headline. Bean `8nzu`.

The trailer route, for when it is needed: the durable identity of a session is
the trailer it leaves on its commits. Sweep the window's commits across all
branches for those trailers, group by session, and record for each: commit
count, first and last commit, and the branches whose **tip** it wrote. A
session's state is then read from its branch: an open proposal that is
green, red, conflicted, or one that merged. Say plainly that this is inferred.

**2. Branches.** Refs with commits in the window, each with its count ahead
of the default branch and its tip session. A branch that is ahead by zero
has merged; one ahead by sixty-five is a workstream the default branch
cannot see (axis 4 says why that matters).

**3. Change proposals (pull requests).** Two lists: closed in the window,
with merged distinguished from abandoned; and open, sorted by last update.
For each open one, read the merge state, the CI outcome on the current head,
the last comment, the reviews, and whether the body or last comment carries
a question to the owner — quote the question. "Green" means every check on
the head passed; a head with no checks is not green (bean `3pqn`).

**4. The work plan.** Diff the store between the window's two edges: items
added, and every status transition (`todo → completed`, `in-progress →
completed`, `todo → in-progress`, anything → `scrapped`). Then two
measurements the store's own status field cannot give you:

- **Claims without activity** — items `in-progress` with no change in the
  window. On 2026-09-20 that was 43 of 60, and 38 of the 43 had last been
  touched by one bulk move hours earlier. `in-progress` records a claim; it
  does not record that anyone is working ([`bean-coordination`](bean-coordination.md)
  §"A claim is branch-local").
- **Items that exist only on a branch.** The store is committed per branch,
  so a long-running proposal can carry an entire epic the default branch has
  never seen (13 of 14 items for one goal, that day). Sweep the open
  branches' stores too, or the review is blind to the largest workstream.

**5. Issues.** Updated in the window, and the full open set for
classification. **Measure it; do not expect a size.** *Dated observation,
2026-09-20:* 54 proposals merged and 2 issues changed — which this file
previously turned into "expect this axis to be thin where work is bean-driven",
an instruction to under-read it. **Measured 2026-09-21: 30 issues touched, 23
newly opened.** The inversion was not an accident — the repository adopted a
round summary per bean and an issue per piece of work, so the skill's own
subject changed underneath the number. Bean `8nzu`.

**6. CI on the default branch.** Runs in the window by workflow and outcome.
A red default branch reclassifies every "stalled" proposal, so read this
before judging any of them.

**Where a check fails, sidecars and generated files are the first suspect**:
one proposal that day was red only because a QA sidecar had not been
regenerated after its skill was edited.

## Classify against the goals — judgement, marked as judgement

For each goal, in this order:

1. **Assign** the items from every axis that advance it. Assignment is a
   judgement; say so once, and quote the item's own title so the reader can
   disagree. An item can serve two goals; a goal can have none.
2. **Critical path** — the items in dependency order, from what the goal
   waits on first. Read dependencies from item bodies, not from the
   `blocked_by` field alone: on 2026-09-20 no item on one goal's path carried
   the field, and every dependency was prose.
3. **Blocked on the owner** — items whose next step is a decision. Quote the
   question verbatim from the item; a paraphrase is a second question.
4. **Done in all but name** — items whose body says everything is finished
   but whose status is not `completed`. Report them; **never resolve a
   sibling's item** ([`bean-coordination`](bean-coordination.md)). Where
   the body says "not resolving unilaterally, awaiting the owner", that is
   the owner's line to close, and it is the same rule seen from the other
   side.
5. **Effort** — S (under an hour of agent work), M (a session), L (several
   sessions or an epic), with "blocked" as a separate mark, because a
   blocked S is not small.
6. **Contradictions** — two items or rulings that cannot both be followed.
   Name both and stop there; the owner reconciles them.

**Goals that are not in the store are a gap.** If the owner's goals exist
nowhere as objects — no milestone, no epic carrying the goal's words — every
future review re-does this classification from scratch. Record that as a
work item and offer the fix as an option; do not create the objects
unasked.

## Output — three parts, in this order

**1. Synopsis of the window.** Counts first, each with how it was measured:
proposals merged and abandoned, still open by state (green, red, conflicted,
stale); work-plan transitions by kind; items added; claims without activity;
issues touched; CI outcome on the default branch; sessions seen and how. A
count in prose without its measurement is a claim
([`turn-reporting`](turn-reporting.md)); a table is the right shape.

**2. A priority queue per goal**, ordered by the critical path. One line per
item: id, what it is in six words, effort, what it waits on. Split into
*do now* (nothing waits on the owner), *owner decides* (with the question),
and *close or scrap* (done in all but name, superseded, expired notices).

**3. The instruction gaps**, each as a work item. A gap is anything the
instructions said that the sweep could not do as written, said two ways, or
did not say at all. Create the item with the measurement in its body and
the rule it concerns named; parent it to the process epic; that is the
"bean up" the owner asked for. Do not create one per stale item — that is a
queue entry, not a gap.

**Then one question, selectable.** The queue will surface several owner
decisions. Ask **one** in full — context, options, recommendation first and
marked, a stated default — and give a **count** of the rest
([`interaction-modality`](interaction-modality.md) §4.1). A reader on a
low-dexterity profile (`interaction/`) answers by choosing a number.

## Rules

1. **Could not determine is never rendered as clean.** Sessions the API
   cannot see, a store on a branch you did not fetch, a check that did not
   run — each is reported as unknown, and unknown outranks "nothing found".
2. **Measure at the window's edges, not from prose.** A body that says
   "nothing remains" is evidence; the status field is a claim; a count you
   remember from an earlier turn is neither.
3. **Read the owner's rulings out of the items and carry them forward.**
   Several items that day were blocked only in name — the ruling was already
   in a sibling's body. Quote it and move the item to *do now*.
4. **A window boundary is an artefact.** A bulk edit just before the window
   makes everything look untouched; a bulk edit inside it makes everything
   look active. Say when a count is dominated by one commit.
5. **Generated files inflate every count.** Diff stats, files changed and
   commits touched all double where sidecars, exports or rendered diagrams
   regenerate; count the authored change and say the rest is generated.
6. **The report is not durable; the gaps are.** The synopsis lives in the
   turn and, if it must outlive the session, on the issue that asked for it.
   The work items are what the next agent inherits.
7. **Do not pivot into the queue.** The owner asked what to do next, not for
   it to be done; the first queue item is the next question, and picking it
   up is a separate, declared intent.

## What falsifies a review

- A proposal the review called green that a reviewer finds red on the same
  head: the CI read was of the wrong commit.
- An item the review placed on a goal's critical path that the owner says
  serves a different goal: the assignment was a paraphrase.
- A "stalled" session that was in fact mid-turn: the inference from its
  branch was stated as fact. Re-read §Sibling sessions; the word is *inferred*.

## Tools this skill reaches for

Reached through the tools graph the instance declares, never by a remembered
path: the work-plan CLI and its manual fallback; the forge API for proposals,
issues and CI runs; version-control history for trailers, branch tips and the
window's edges; and the session API where it can see siblings. Where one is
absent, the axis it serves is reported as *could not determine*.
