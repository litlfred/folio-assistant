---
name: integration-watch
roles: [reader, collaborator, owner]
user_invocable: true
description: >
  Dispatcher for the `/integration-watch` slash command. Routes to
  one or more of the concrete integration watchers / audits
  (proof, canonical, compute, detangler, one-voice, consolidation,
  bibliography, devils-advocate, …). With no argument, lists the
  available watchers and asks the user which to invoke. With
  arguments, dispatches the named watchers in parallel (each gets
  its own Monitor, queue, ledger, and PR-subscription set).
allowed-tools: Read Edit Write Bash Grep Glob Agent Monitor Skill
---

# /integration-watch — dispatcher for the integration watchers

A thin dispatcher in front of [`integration-watcher`](integration-watcher.md)
§0 (Invocation). When the user types `/integration-watch` (with or
without arguments), this skill resolves the argument to one or more
concrete child watchers and invokes them. The set of children is
project-defined; a project enables the watchers relevant to its
content axes.

## Argument grammar

```
/integration-watch                              → ask which (no auto-pick)
/integration-watch proof                        → just proof-integration-watcher
/integration-watch canonical                    → just canonical-watcher
/integration-watch compute                      → just compute-integration-watcher
/integration-watch compute-integration          → same as `compute`
/integration-watch detangler                    → just detangler-integration-watcher
/integration-watch detanglement                 → same as `detangler`
/integration-watch one-voice                    → just one-voice-integration-watcher
/integration-watch voice                        → same as `one-voice`
/integration-watch consolidation                → proposition-consolidation-audit (find similar statements)
/integration-watch dedupe                       → same as `consolidation`
/integration-watch bibliography                 → bibliography watcher (block-level bib QA)
/integration-watch bib                          → same as `bibliography`
/integration-watch devils-advocate              → devils-advocate-watcher (adversarial "why is this wrong" review)
/integration-watch da                           → same as `devils-advocate`
/integration-watch adversarial                  → same as `devils-advocate`
/integration-watch all                          → all enabled watchers in parallel
/integration-watch proof,canonical              → those two in parallel
/integration-watch proof canonical              → same (space-separated)
/integration-watch proof detanglement canonical → three in parallel
/integration-watch <unknown>                    → reject, re-prompt
```

## No-argument behaviour (the common case)

Per `integration-watcher §0` + `§4e` (full-context preamble):

1. **Chat preamble** (always before the AskUserQuestion). Each watcher
   covers one QA axis. Run them independently (one focused PR per
   watcher's domain) or all in parallel (more events but full
   coverage). Summarise each enabled watcher in one line — for example:

   > - **proof** — proof-integration-watcher: no bare gaps, no axiom
   >   growth, formal-layer compile check, naked-conjecture handling.
   > - **canonical** — canonical-watcher: derivation discipline — no
   >   undisclosed free parameters, no numerology, no fits (per the
   >   project's derivation-discipline statement).
   > - **compute** — compute-integration-watcher: every provable/derived
   >   block has a probe + production consumer.
   > - **detangler** — detangler-integration-watcher: no new forward
   >   refs, sections within the block-count band, no new cross-chapter
   >   forward edges.
   > - **one-voice** — one-voice-integration-watcher: scholarly voice
   >   (narrative + proof bodies), no AI slop, block fit to
   >   section/chapter, canonical-vs-deprecated notation. Persists
   >   per-block `<block>.qa.json` audit reports (multi-reviewer,
   >   hash-keyed staleness).
   > - **consolidation** — proposition-consolidation-audit: find similar
   >   statements that should be merged or demoted to corollaries
   >   (explicit "specialisation of" wording; same boxed result under
   >   different parametrisations; uses-overlap > 70%). Keeps exposition
   >   tight.
   > - **bibliography** — block-level citation QA (cite resolution,
   >   attribution, freshness).
   > - **devils-advocate** — devils-advocate-watcher: for every block +
   >   formal sibling, construct the strongest case it is WRONG (the
   >   objection a hostile-but-competent referee raises), fanning out
   >   adversarial-lens agents + an adjudicator that scores each
   >   objection surviving/rebutted/partial. Emits per-block `da-*`
   >   sidecars. Gated by the refutation-scope rule + corpus-grep
   >   checklist.

2. **Role-gate the chip set.** Before composing the `AskUserQuestion`,
   detect the user's role (`reader` / `collaborator` / `owner`).
   Write-side watchers (e.g. `compute`, `one-voice`) require
   `collaborator`+; the `all` chip transitively requires
   `collaborator`+ when it includes any of them. Read-only audit
   watchers are `reader`-accessible.

   AskUserQuestion has a 4-option cap. With more than four candidates,
   compose the chip set as:

   - **reader**: the read-only watchers + an "all readable" chip;
     write-side watchers hidden.
   - **collaborator / owner**: prefer the `all` umbrella + the two
     read-only watchers most relevant to the current session. The
     dispatcher MAY rotate which two individual watchers are surfaced
     based on session context (e.g. when a formal-layer change just
     landed, surface `proof` + `one-voice`; when a provable block was
     added, surface `compute` + `canonical`). Watchers not surfaced as
     a chip remain reachable via direct slash invocation or via `all`.

3. **AskUserQuestion** with up to 4 chips (role-gated), `multiSelect:
   true` so the user can pick any subset.

## Per-watcher dispatch sequence

For each resolved child watcher:

1. **Run §5l Resume protocol** (from the parent skill) — load the
   persisted queue/ledger, compute the unreviewed-commits list per
   criterion, surface a structured "resume" summary + AskUserQuestion.
2. **Arm Monitor** + **subscribe to PRs** per `integration-watcher §2`.
3. The watcher runs continuously per §3-§5.

When multiple watchers are dispatched in parallel:
- Each gets its OWN Monitor task (so timeouts/restarts are independent).
- Each maintains its OWN `.beans/<name>-queue.json` and
  `.beans/<name>-ledger.md`.
- PR subscriptions are deduped across watchers (a sibling PR active in
  the last 7 days is subscribed only once per session).
- Resume suggestions are surfaced one watcher at a time (not bundled),
  so the user can answer each separately.

## Integration

- **Built on**: `integration-watcher` (the abstract parent)
- **Dispatches to**: the project's enabled concrete watchers (proof /
  canonical / compute / detangler / one-voice / consolidation /
  bibliography / devils-advocate / …)
- **Inherits everything**: §0-§9 of the parent
- **Write-side counterpart**: [`integration-backlog`](integration-backlog.md)
  — same argument grammar, but DRAINS the open findings into
  review-sized PRs instead of monitoring for new events.

## Examples

```
User: /integration-watch
→ Preamble + 4-chip AskUserQuestion; user picks one or more.

User: /integration-watch proof
→ Direct dispatch to proof-integration-watcher; resume protocol runs
  and surfaces "Triage unreviewed commits / Continue backlog / Dispatch
  chapter / Just watch" 4-chip AskUserQuestion.

User: /integration-watch detangler
→ Direct dispatch to detangler-integration-watcher; resume protocol
  runs (graph baseline cached, structural QA dispatch).

User: /integration-watch proof detanglement canonical
→ Parallel dispatch to three (detanglement charitably maps to
  detangler); each surfaces its own resume prompt sequentially.

User: /integration-watch all
→ Parallel dispatch to every enabled watcher; each surfaces its own
  resume prompt sequentially.
```

## Anti-patterns

- ❌ Auto-pick on `/integration-watch` (no arg). The user must choose;
  defaulting silently hides which watcher started.
- ❌ Share state across watchers. Each domain is independent;
  cross-watcher state would create false-positive duplicate findings.
- ❌ Bundle the per-watcher resume prompts into a single mega-question.
  Each watcher's resume answers are independent and the AskUserQuestion
  4-option cap means combining them loses resolution.
