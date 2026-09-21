---
# folio-assistant-3x2n
title: 'UNTAINTED VERIFICATION: one dispatch mechanism for code QC and for evidence review, and qa-reporting is declared with zero consumers'
status: in-progress
type: epic
priority: high
parent: folio-assistant-ahvw
created_at: 2026-09-21T21:53:39Z
updated_at: 2026-09-21T21:53:39Z
---

Opened 2026-09-21 on the owner's instruction, given over four messages that
widened it each time:

1. *"new/genericize skill (see translator roundtrip) if need untainted,
   dispatch agent(s) with controlled context (e.g. as extracted from the KG
   with a set prompt and parameterized input). that should be a part on
   internal QC before merging (do not write the QC reports yourself as a Coder
   role, instead, if available you do dispatch agent as a check before commit),
   only the QA Review processes/team can write the QA reports."*
2. *"same should happen with translations."*
3. *"this should span all QC code checks areas (security, scans for leaked
   tokens/secrets, variable/supplychain/etc injection, schema validation,
   compilation check, etc.). lots can be run, bean up to document evidenced
   based best practices."*
4. *"need lit review, put this also as part of workflow for evidenced based
   literature review as part of guideline development process (see who living
   guidelines)."*

**The four are one mechanism.** A secret scan, a schema validation, a
back-translation and a systematic literature search differ in what they read
and what counts as a finding. They do not differ in the thing the owner is
asking for: **the party that produced the artefact does not get to write the
verdict on it**, and the checking party is given a controlled context rather
than the run of the repository.

## What is already here, measured rather than assumed

**The pattern exists exactly once, and it is translation-shaped.**
`translation-manager.md` §"The agentic round trip" carries a two-agent
separation that is the whole idea: a back-translator given the target text and
nothing else, an adjudicator given the original and the back-translation and
never the target. Three rules make it a measurement rather than a ritual —
neither agent sees what would let it shortcut; the checking agent uses no tools
and says so (`TOOLS_USED`); one agent doing both halves is not this check.

Every word of that generalises. None of it is written down anywhere an agent
doing something other than translation would find it.

**The permission it needs is already declared, and nothing reads it.**
`skills/permissions/permissions.json` carries `qa-reporting` — *"Emit QA
reports"*. Measured over `.claude/skills/actors/*.json`:

| | |
|---|---|
| actors holding `qa-reporting` | 5 — `ci-health-watcher`, `ci-pipeline`, `ig-publisher-service`, `platform-boundary-guard`, `qc-reviewer` |
| actors holding **both** `qa-reporting` and `content-authoring` | **0** |
| non-test code that reads `qa-reporting` | **0** — one comment in `role-graph.ts`, one test asserting more than one role holds it |

So the separation the owner is asking for **is already true in the
declaration** and is enforced by nothing at the point it matters. That is the
`dh4f` shape one level up: a declared permission with no consumer, and a clean
run over it.

**Who actually writes the verdicts.** Tallied over every `reviewer` object
under `cat-harness/test/results/`:

| reviewer | entries |
|---|---|
| `script` (six `qa-checkers-*.ts` + `translation-block-qa.ts`) | 5,883 |
| `agent` `voice-editorial-review` | 11 |
| `agent` `roundtrip-adjudicator (subagent)` | 1 |
| `agent` `roundtrip-back-translator (subagent)` | 1 |

**Two entries in the whole corpus** are the dispatched-untainted pattern the
owner wants generalised.

## What the code-QC half does NOT have, measured

| area | state |
|---|---|
| secret / token leak scanning | **none** — no gitleaks, trufflehog or detect-secrets; every `secret` hit in the workflows is `secrets.GITHUB_TOKEN` |
| dependency audit | **none** — no `npm audit`, `bun audit` or OSV step |
| `dependabot.yml` | **absent** |
| lockfile pinning | **11 of 18** install steps are `bun install --frozen-lockfile \|\| bun install` — a pin that silently falls back to an unpinned resolve, so the failure it exists to catch is the one it swallows |
| schema validation | two gates — `check:kind-validators`, `check:schema-nodes` |
| compilation | `typecheck` (`tsc --noEmit`) |

The lockfile line is the finding worth naming on its own: **a check that
degrades to a pass when it fails is not a check.** It is the same shape this
session has fixed four times today in other clothes.

## What this is not

Not a second work item for `vo9d`, which asked where `translation-roundtrip.ts`
is *dispatched from* and was settled by the owner's *"1 2 3 are all triggers"*.
That gave the translation mechanism its dispatch points. This asks a different
question: what the mechanism **is**, once it is not about translation.

## Children

One per area, each required to carry its own evidence rather than a
recommendation — the owner asked for *"evidence based best practices"*, and a
best practice with no measurement behind it is the thing this epic exists to
stop being written.

## Done when

- [ ] Every child is opened, each carrying its area's measured baseline
- [ ] The generic skill exists and both domains — code QC and evidence review —
      are expressed as instances of it rather than as parallel texts
- [ ] `qa-reporting` has its first consumer
- [ ] The three states are kept apart everywhere: verified, **could not
      dispatch**, not attempted. "Could not dispatch" is recordable and is
      never a pass

## Open with the owner

Whether "could not dispatch" may be **recorded by the coder** as an `n/a`
witness with a reason (which satisfies the gate), or must **block the commit**.
It decides whether this can gate at all in an environment with no subagents.
