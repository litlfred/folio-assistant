---
# folio-assistant-y1w9
title: 'MEMORY REACH: 113 skills are bound to no role or process, so nothing hands them to an agent'
status: todo
type: task
created_at: 2026-09-19T18:34:19Z
updated_at: 2026-09-19T18:34:19Z
parent: folio-assistant-8jt6
---


**Found by paying the cost, 2026-09-19.** Not a survey finding — a measured
loss in one session, twice.

## What happened

While working `folio-assistant-n60j` I "discovered" that the gate list must
be derived from the CI workflow rather than from `package.json`, wrote a
runner and a skill around it, and reported it as a finding. It was already
recorded, that same day, in
`skills/memory/derive-the-gate-list-from-the-workflow.md`.

Separately I hit the same CI-reading confusion **three times** — that
`actions_list` filtered by branch returns runs for other commits, and that
`get_status` reports `pending / total_count: 0` on a PR whose checks are
green. Both are recorded, in `skills/memory/read-the-ref-not-the-url.md`,
which even names the remedy (`get_check_runs`, and compare `head_sha`
against the PR head).

Both entries are tagged `agents: [ci-health-watcher]`. I am the main
session. I never invoked that subagent, so its memory was never injected.

## The mechanism, and why it is not a memory problem

The knowledge is not only in memory — there is a **skill**,
`skills/folio-core/github-state-inspection.md`, 6 KB, covering exactly
these traps. Measured today:

    grep -rl 'github-state-inspection' skills/workflows/ skills/roles/
    → nothing

**Bound by no diagram and no role.** So no process step hands it to
anybody, and an agent finds it only by already knowing it exists.

That is one instance of a number `kg:audit` already reports and nobody has
acted on: **`skill-in-role-or-process` — 113 findings.** 113 skills that
exist, are written, are published, and are attached to no lane and no
role. The audit grades them `major`, which is why `kg:audit:check` (which
fails only on `critical`) is green with 113 of them outstanding.

## Why this is worth its own bean rather than a sweep

The obvious fix — bind all 113 — is wrong. A skill bound to a role it does
not belong to is worse than an unbound one: it widens that role's closure
until an audit cannot fail, which is the same failure `role-model.md`
records for merging `inherits` with the subprocess stack.

So this is triage, not a sweep. Each unbound skill is one of:

- **belongs to a role** — bind it (done today for
  `github-state-inspection` → `authoring-agent`)
- **belongs to a process step** — bind it there, which usually means a
  diagram is missing rather than a ref
- **is reference material nobody performs** — then it is not a skill in
  the role model's sense, and saying so is the fix

## The sharpest question this raises

Should a fact an agent needs live in a SUBAGENT's memory at all? Memory is
`memory: project` per agent, so a fact filed to `ci-health-watcher` is
invisible to the session doing the work. Two documented traps cost time
today for exactly that reason. The skill is the source of truth and memory
only summarises — but the summary reached nobody, and neither did the
skill.

## Done when

- [ ] the 113 are triaged into the three buckets above, with counts
- [ ] no skill is bound to a role merely to clear the finding, and the
      audit records the "not performed by anyone" verdict as a real state
      rather than an omission
- [ ] whether agent-scoped memory can reach the main session is answered
      either way, and written down
