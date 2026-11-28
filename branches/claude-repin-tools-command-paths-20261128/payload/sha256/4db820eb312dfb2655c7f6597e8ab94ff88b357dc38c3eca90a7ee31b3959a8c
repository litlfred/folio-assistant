---
name: stalled-agent-triage
description: >
  Triage incoming work from stalled agents AND govern returning-agent re-entry
  after another session advanced the repository. Enforces Bidirectional Relay
  Continuity: write-ahead epic checkpointing at dispatch time paired with the
  five-step non-destructive takeover and re-entry reconciliation (remote commit
  and beans delta, epic Live Relay Snapshot, four-way open/draft PR
  classification, non-destructive worktree/overlay/donor-cache inspection with
  `claude/salvage-*` rescue instead of `git reset --hard`, and lease-table plus
  Merge Steward queue resumption). Use when a session or swarm has stalled,
  timed out, hit a quota cap, or lost its container, when the owner says "pick
  up what X was doing", or whenever an agent returns on its next turn after
  another agent advanced `main`, PRs, or `beans`.
satisfies:
  - "req:agent-workflow#bidirectional-relay-continuity"
---

# Stalled-agent triage and bidirectional relay re-entry

A stall is not an event anyone records. An agent hits a quota window, context
limit, or network drop and simply stops while what it was holding sits spread
across PRs, branches, worktrees, `/tmp` overlays, and work items. Equally, when
that agent returns on a later turn after a sibling or successor advanced the
repository, its in-memory mental model is stale. This skill governs **both**
halves of **Bidirectional Relay Continuity** so transitions in either direction
lose zero research, zero uncommitted work, and zero compute.

Triage itself **reads, preserves, and recommends**. It never runs `git reset
--hard`, never overwrites dirty/unpushed stalled work, and never closes PRs or
deletes branches. Picking up a theme is a claimed piece of work
(`bean-coordination` (opt-in `cat-harness.work-plan`)).

## 0. Bidirectional Relay Continuity (Write-Ahead Readiness ↔ Returning Re-Entry)

Smooth multi-agent transitions require symmetry between the **outgoing**
coordinator (which may stall at any moment) and the **incoming** takeover or
returning agent:

### 0a. Outgoing readiness — Write-Ahead Epic Checkpointing (`STRICT`)

Coordinators and research managers MUST write-ahead checkpoint on the shared
`beans` branch **at dispatch time** (never waiting until post-merge or
end-of-turn), while strictly respecting the **post-claim single-writer lock**
([`agent-handoff`](agent-handoff.md) §1 — **never** mutate a claimed child
executor bean's `.md` file after claim; write to parent Epic notes under
`beans/notes/*` titled `checkpoint: <epic/wave> <UTC>`, `handover:`, `triage:`,
or `reentry:`, and to the parent epic body):

1. **New child beans & canonical 3-slot dispatch lines** registered immediately
   when spawned (`Do bean <bean-id> on branch <branch-to-create> of repo <owner>/<repo>.`);
2. **Active research & compute hypotheses** currently under test (including
   pinned input SHAs, target theorems, and running probe commands);
3. **Negative / excluded routes** already falsified so a takeover agent never
   spends compute re-testing a dead end;
4. **Worktree / Branch / Scratch / Donor-Cache Lease Table** mapping each local
   worktree path, branch name, PR number, `/tmp` build overlay, and protected
   `Cargo` or `Lean` `.lake` donor cache to its active holder and status.

### 0b. Incoming re-entry — 5-Step Non-Destructive Reconciliation (`STRICT`)

Whenever an agent **takes over from a stalled session** OR **returns on its
next turn after another agent advanced the repository**, it MUST execute all
five steps in order before dispatching any worker or mutating any branch:

1. **Fetch & audit remote delta:** Fetch `origin/<default-branch>` and
   `origin/cat/cat-harness/beans` (explicit refspecs), then inspect
   `git log --oneline <last-known-sha>..origin/<default-branch>` to see every
   PR and skill/schema/proof change that landed while paused.
2. **Read the epic's Live Relay Snapshot & bean deltas:** Read the parent epic
   bean and its `checkpoint:` / `handover:` / `triage:` / `reentry:` notes;
   inspect newly created, updated, or closed child beans, active hypotheses,
   excluded routes, and standing owner fences.
3. **Classify all open & draft PRs into four disjoint buckets:**
   - `ready-to-merge` — verified green, non-draft, carrying `ready: <40-hex-sha>`
     (route to Merge Steward);
   - `active external sibling draft` — actively driven by another live session
     (hands off; coordinate via PR comments only);
   - `stalled with uncommitted/unpushed work` — silent past liveness window or
     matching a dirty/ahead local worktree (needs salvage or re-drive);
   - `owner-fenced` — awaiting an owner decision card or explicitly held.
4. **Non-destructively inspect all local worktrees, `/tmp` overlays, donor caches & unfreeze safety:**
   Run read-only `git status --short --branch` and `git rev-list --left-right --count`
   across every worktree, check `/tmp` overlays, and identify `Cargo` / `Lean`
   (`.lake`) donor caches that must stay on `origin/<default-branch>`.
   - **Cold triage of a stalled worktree:** **NEVER run `git reset --hard`,
     `git checkout -- .`, or `git clean -fd`.** Rescue dirty or unpushed stalled
     work onto a `claude/salvage-<topic>-<yyyymmdd>` branch (and push it) or
     resume it in place under its existing branch.
   - **Returning-agent unfreeze safety (`agent-handoff` §2/§7, `coordinate` §8c/§8d):**
     If an unfrozen/returning agent finds `holder != self`, OR a `triage:` note
     superseded its claim, OR remote `<branch>` advanced while it was stalled,
     it **MUST NOT push to `<branch>` or `--force`**. If it holds unpushed local
     commits (`@{u}..HEAD` non-empty) or dirty edits, it quarantine-saves onto
     `wip/reentry-<bean-id>-<short-session>`, records a `reentry:` pointer note,
     and yields cleanly.
5. **Reconcile the epic lease table & resume queues:** Update the epic bean's
   Worktree/Branch/Scratch Lease Table (or `checkpoint:` / `triage:` note) on
   `beans`, post brief sibling coordination notes where landed commits shifted
   scope, and resume the Merge Steward and worker queues.

## Inputs

One of:

- **Named:** session URLs, agent ids, branch names, PR numbers or work item ids.
- **A time window:** for example "everything touched in the last 6 hours", or
  "since the 14:00 safety check".

## Procedure

### 1. Find the footprint

Gather in one batched pass, using REST (`gh api …`; GraphQL `gh pr list`
returns 403 in agent sessions):

| source | how | what it gives |
|---|---|---|
| handover reports | `beans/notes/*` whose title starts `handover:`, on `main` and on every open PR branch | the agent's own account; **read these first** |
| open PRs | `repos/…/pulls?state=open`, filtered by author session (`Claude-Session:` in bodies and commits) or by `updated_at` in the window | PR, branch, head, CI, mergeability |
| branches | `git ls-remote --heads origin` and commit dates | work with no PR yet |
| work items | `beans list` with `in-progress`, plus holder notes (`bean-coordination`) | claims, blocks, `## Done when` |
| workflow instances | `beans/workflows/*.json` updated in the window | where in which process each one stopped |
| discussions | the last comments on each PR and issue | owner rulings and open questions |

### 2. Collect or reconstruct a report per agent

- **If a handover report exists, use it.** Check its claims against the live
  state: a "CI running" in a report is a guess by now. Note every place the
  report and reality disagree.
- **If none exists, reconstruct one** with the
  [`handover-report`](handover-report.md) template. Fill it from the
  footprint, and mark it *reconstructed* with the source for each fact.
  Leave "Unpushed or at-risk state" as **unknown**, never as empty: what a
  stalled agent had not pushed cannot be seen from here.
- **If the agent is still reachable, ask it** (`SendMessage` or
  `send_message`) for its report. That is cheaper and truer than
  reconstructing.

### 3. Consolidate into 2–4 themes

Group the workstreams by **what they deliver**, not by which agent held them.
For each theme:

- **Goal and epic:** the work item it serves; a theme with no epic is a finding.
- **Members:** PRs, branches and work items, each with its state, using the
  `merge:overlap` columns once that tool exists.
- **Dependencies:** what waits on what, and which member unblocks the most.
- **Risk:** a red head, a conflict, unpushed work, or a decision only the
  owner can make.

More than 4 themes means the grouping is too fine. One theme means the
stalls were one piece of work, which is fine; say so.

### 4. Recommend

For each theme, say one of:

- **Continue as is:** re-dispatch to one agent from its handover, under its
  existing work item.
- **Fold into the current work plan:** name the epic and the position.
- **New epic or work item:** with a title, a `## Done when`, and the members it
  takes over.
- **Park:** status `todo` with a block that has an expiry
  (`bean-blocking`).
- **Scrap:** only with the owner's say. Never delete a work item, a branch or a PR
  ([`deletion-requires-confirmation`](../../../skills/conduct/conduct-core/deletion-requires-confirmation.md)).

Present this to the owner as **one decision in full**, with a count of the
rest ([`interaction-modality`](../../../skills/conduct/conduct-core/interaction-modality.md)
§4.1). Recommend first and state the default.

### 5. Coordinate

- **Open PRs go to the merge steward.** Tell it which PRs have lost their
  driver, which are green and ready, and which are mid-merge. A mid-merge
  branch is one with local conflict resolution that was never pushed; it is
  lost, and it is better re-done from the PR head than guessed at.
- **Notify the owning sessions** that are still alive before anyone touches
  their branches ([`coordinate`](coordinate.md)).
- **Record the triage** as a work item note on each theme's epic, titled
  `triage: <date>`, so the next triage starts from this one.

## Anti-patterns

- **Re-doing a stalled agent's work from memory** of what it was doing. Read
  the branch: the commit is the truth.
- **Treating "no report" as "nothing in flight".** It means the opposite.
- **Restarting every stalled agent at once.** That is a swarm, and it needs
  the owner's yes ([`swarm-management`](swarm-management.md)), plus disk and
  CPU headroom: several agents regenerating at once can fill a container's
  disk allowance.
