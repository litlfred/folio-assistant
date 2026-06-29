---
layout: default
title: /prepare-merge-auto
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/prepare-merge-auto.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/prepare-merge-auto.md) — do not edit here.

{% raw %}
# /prepare-merge-auto — Autonomous merge pipeline

Runs the full `/prepare-merge` workflow PLUS:

1. **Sibling coordination** (before starting)
2. **Review-comment resolution** (after reviews land)
3. **Structured user questions** (only when genuinely blocked)
4. **Merge** (after all comments resolved)

## Workflow

### Phase 0: Sibling coordination

Before starting the merge pipeline, identify sibling PRs whose scope
overlaps this branch's files:

```
mcp__github__list_pull_requests(owner, repo, state="open")
```

For each sibling PR that touches the same files or content domain:
- Post a brief coordination comment: "Starting prepare-merge on
  #<this-PR>; touches <files>. Review welcome if you'd like to
  check for conflicts before merge."
- Do NOT wait for responses — this is a courtesy notification, not
  a blocking request.

### Phase 1: /prepare-merge (steps 1–6)

Execute the full `/prepare-merge` skill (rebase, integrate, one-voice,
build, final rebase, request reviews). All steps must succeed
before proceeding.

### Phase 1b: Wait for reviews + status briefing

**Wait for Copilot and Gemini reviews to land** before proceeding.
Do NOT skip ahead — the reviews are the input to Phase 2.

**Wait protocol (15-minute window):**

1. After requesting reviews in Phase 1, poll for Copilot's
   check-run status every 30 seconds (up to 15 minutes):
   ```
   mcp__github__pull_request_read(method="get_check_runs", ...)
   ```
   Look for the `copilot-pull-request-reviewer` check run:
   - `"status": "queued"` or `"status": "in_progress"` → reviewer
     has noticed the PR; keep polling every 30s
   - `"status": "completed"` → reviews are in, proceed immediately
   - No check run after 2 minutes → reviewer did not trigger for
     this file type (e.g. skill-only PRs with no code); proceed
     with 0 comments

2. For Gemini: check PR issue comments via
   `mcp__github__pull_request_read(method="get_comments", ...)`.
   If a `gemini-code-assist[bot]` comment contains "daily quota
   limit", note "Gemini: quota exhausted" and proceed without
   waiting further.

3. **15-minute hard cap**: if neither reviewer has completed after
   15 minutes, proceed with whatever comments have landed. Note
   "Copilot: timed out (15 min)" in the briefing.

Once reviews arrive (or the 15-minute cap is reached), give the
user a concise **status briefing**:

1. **PR identity**: "#N — title" with clickable URL
2. **Branch**: `branch-name` → `main`
3. **Scope**: files changed, additions/deletions, commits
4. **Review comments received**: total count, by reviewer, with
   1-line summary of each thread:
   ```
   Review comments (5 total — Copilot: 3, Gemini: 2):
     1. [Copilot] line 42 engine.py — threshold mismatch
     2. [Copilot] line 98 engine.py — unused variable
     3. [Copilot] line 173 engine.py — spelling fix
     4. [Gemini] line 15 table.md — missing citation
     5. [Gemini] line 88 table.md — ambiguous wording
   ```
5. **Disposition plan**: for each comment, state the planned
   action (accept / modify / reject / escalate) BEFORE making
   changes — so the user can redirect:
   ```
   Plan: accept 1,2,3; accept-with-modification 4; reject 5
   (reason: standard term per §7a)
   ```
6. **CI status**: green / failing / pending

The user can reply with overrides (e.g. "reject 4", "skip 2,3").
If no override within ~30 seconds, proceed with the stated plan.

### Phase 2: Resolve review comments

After the briefing (and any user overrides), triage each thread:

| Classification | Action |
|---|---|
| **accept** | Apply the suggested fix, commit, push. |
| **accept-with-modification** | Apply a modified version, commit with explanation. |
| **reject-with-reason** | Reply on the thread with the reason (e.g. "intentional — see §X"). |
| **escalate** | Cannot resolve autonomously — proceed to Phase 3. |

For each resolved thread, commit the fix with message:
`fix(PR #N): address <reviewer> thread r<id> — <1-line summary>`

Push after each batch of resolutions.

### Phase 3: Structured user questions (only when blocked)

If any review comment requires a judgment call (ambiguous intent,
architectural decision, multiple valid approaches), use
`AskUserQuestion` with:

- **Rich context** per AGENTS.md user-accessibility rules:
  - Quote the exact comment + file path + line number
  - Show the current code vs proposed change (preview)
  - State trade-offs for each option
  - Default to `multiSelect: true` unless choices are mutually exclusive
  - Prefix with 🟡

- **Batch questions** — collect ALL blocked items into a single
  `AskUserQuestion` call (up to 4 questions) rather than asking
  one at a time.

### Phase 4: Merge

After all review comments are resolved (or the user has answered
all escalated questions):

1. Run `bun run scripts/run-validate.ts content/<paper>` one final time.
2. Check CI status via `mcp__github__pull_request_read get_check_runs`.
3. If all green: merge via `mcp__github__merge_pull_request` with
   `merge_method: "merge"` (default per AGENTS.md — preserves
   structured commits).
4. **CRITICAL:** DO NOT DELETE THE BRANCH EVER! If using the GitHub CLI, DO NOT pass `--delete-branch`. If using the GitHub API, ensure the branch is preserved.
5. Report the merge SHA + URL.

### Phase 5: Post-merge coordination

After merge:
- Post a brief update on any sibling PRs that were notified in
  Phase 0: "PR #<N> merged; <files> updated on main. Please rebase
  if needed."
- Unsubscribe from the merged PR's activity.

## Error handling

- If `/prepare-merge` fails at any step, STOP and report the
  blocker. Do not request reviews on a broken branch.
- If CI fails after pushing review fixes, investigate and fix
  before merging.
- If the user doesn't respond to Phase 3 questions within the
  session, leave the PR open with a summary comment listing the
  unresolved items.

## Anti-patterns

- Do NOT merge without resolving review comments (even if CI is green).
- Do NOT squash unless the user explicitly says "squash".
- Do NOT skip sibling coordination — it prevents post-merge conflicts.
- Do NOT ask trivial questions in Phase 3 — only genuinely ambiguous
  decisions warrant user input.
- **Do NOT delete the branch after merging.**
{% endraw %}
