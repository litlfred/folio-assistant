---
# folio-assistant-y1w9
title: 'MEMORY REACH: 113 skills are bound to no role or process, so nothing hands them to an agent'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T18:34:19Z
updated_at: 2026-09-19T19:14:06Z
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

## Triage attempt 2026-09-19 — the mechanical route is BLOCKED, and why

Count re-derived rather than quoted: **112**, not 113 — two bindings
earlier the same day had already moved it. Now **110**, see below.

### The hypothesis, and its failure

I expected the triage to be mostly evidence-backed rather than judgement:
skills declare `roles:` in their own front matter, so a skill saying who
performs it would justify the binding without my inventing anything.

**89 of the 112 do declare `roles:`. Only 2 name an actual swimlane role.**

The field is overloaded. Across all 178 skill files it carries 254 uses of
an undeclared vocabulary (`collaborator` 101, `owner` 95, `reader` 55,
plus `admin` and `auditor`) against 52 uses of the real registry — and
nothing validates either. Mixed within single files:
`library-ingestion.md` declares
`roles: [ingestion-agent, authoring-agent, collaborator, owner]`.

Filed as **`folio-assistant-qif9`**, which this bean now waits on for its
mechanical half.

### What was done anyway — the two the evidence DID support

Both bound on the skill's OWN declaration, so a reviewer argues with the
declaration rather than with me:

- `library-ingestion` → `ingestion-agent`, `authoring-agent`
- `milnor-exposition-standard` → `author`, `editor`, `reviewer`,
  `narrative-reviewer`

112 → **110**. Plus `platform-gates` and `github-state-inspection` earlier
the same day, from 113.

### The revised route

1. **`qif9` first.** Once every `roles:` value resolves against a declared
   vocabulary, recount the evidence-backed bucket — it may be a large
   fraction of the 110, since 52 uses across the corpus already name real
   roles and some of those skills are unbound.
2. **Then the remainder**, which is genuine judgement, per skill, in
   batches small enough to argue with.
3. **Never a sweep.** Unchanged and load-bearing: a skill bound to a role
   it does not belong to widens that role's closure until an audit cannot
   fail.

### Still unanswered — the third criterion

Whether a fact in a SUBAGENT's memory can reach the main session. Not
touched here, deliberately: the triage had to say first whether "bind the
skill" is even the right remedy, and it now says the binding route is
blocked on `qif9`. Worth noting that binding is not obviously sufficient
anyway — a role carrying a skill makes it reachable, not injected.
