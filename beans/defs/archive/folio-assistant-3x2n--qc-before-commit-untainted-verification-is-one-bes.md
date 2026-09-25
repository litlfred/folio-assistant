---
# folio-assistant-3x2n
title: 'UNTAINTED VERIFICATION: one dispatch mechanism for code QC and for evidence review, and qa-reporting is declared with zero consumers'
status: completed
type: epic
priority: high
created_at: 2026-09-21T21:53:39Z
updated_at: 2026-09-22T10:45:31Z
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

- [x] Every child is opened, each carrying its area's measured baseline —
      all eight `completed`, verified from the bean files rather than from a
      count in prose
- [x] The generic skill exists and both domains — code QC and evidence review —
      are expressed as instances of it rather than as parallel texts.
      `skills/folio-core/untainted-verification.md` is the spine;
      `evidence-review.md` opens *"that is `untainted-verification`'s sentence
      with the nouns changed"*, and `translation-manager.md` §"The agentic
      round trip" is headed **an INSTANCE of untainted verification**. Both
      bound to `qc-reviewer` in `scenarios/roles.json`
- [x] `qa-reporting` has its first consumer —
      `scripts/check-qa-reviewer-permission.ts`, which resolves the actor and
      requires the permission. Before it, the permission was declared with
      **zero** consumers while reading as a control
- [x] The three states are kept apart everywhere: verified, **could not
      dispatch**, not attempted. `isVerified` is the predicate a gate asks;
      `couldNotDispatchEntry` throws on an empty reason, so a bare "could not
      dispatch" cannot be recorded; `isCheckerWitness` distinguishes the
      checker's `n/a` witness from a pass

## Settled with the owner

**Whether "could not dispatch" may be recorded by the coder as an `n/a` witness
with a reason, or must block the commit.** Answered: **recorded, with a stated
reason** — option (a). It keeps the third state honest and recordable without
making the rule unenforceable, and it is the only option under which "could not
dispatch" is distinguishable from "nobody tried". `couldNotDispatchEntry`
enforces the "with a reason" half by throwing on an empty one.

**Whether `zakj`'s finding needs a dispatched adjudication.** Answered
2026-09-22: **not applicable, reason recorded.** `check:secret-leaks` is
prefix-anchored and deterministic, and `0grh` is for judgements, not for greps.
It becomes live the day an entropy or heuristic detector is added — an entropy
threshold IS a judgement. See `zakj` §"The ruling".

**Whether a dependency-audit step earns its place (`j41m`).** Answered
2026-09-22: **an advisory step AND Dependabot, both** — they answer different
questions, and neither gates a merge. See `j41m` §"The ruling".

## Summary of Changes

**Eight of eight children complete**, each carrying its area's measured
baseline — which was the ask: *"evidence based best practices"*, with the
constraint that a best practice with no measurement behind it is the thing this
epic exists to stop being written.

| bean | what it established |
|---|---|
| `0grh` | the spine — the producer never writes the verdict; checker and adjudicator each see a controlled context and not the other's |
| `a58y` | `qa-reporting` gains its first consumer; before it, a declared permission read as a control with **zero** readers |
| `zakj` | secrets — no leaked-token scanning existed at all; `could-not-scan` exits **2** and outranks clean |
| `j41m` | supply chain — 14 install sites defeating or skipping their pin, and nothing asking whether a dependency was known-vulnerable |
| `1wef` | injection — three surfaces, three real defects |
| `jfr6` | schema + compilation — 42 generated-artefact checks all asking currency, none asking validity |
| `3vc6` | translation re-expressed as an INSTANCE of the spine rather than a parallel text |
| `8rwa` | evidence review — the same separation carried into guideline development |

### Four real defects, each demonstrated before being fixed

| | |
|---|---|
| workflow shell injection (`lake-cache-refresh.yml`) | attacker-controlled input reaching a shell |
| DOM XSS from an ingested corpus (`library-graph.ts`) | a string `n_words` reaching `innerHTML` through `+` |
| prompt injection into a system prompt (`adapters/document/index.ts`) | a `"""` fence closing the region it was meant to sit inside |
| an unpinned install in the **release** workflow | hidden by a wrong denominator, found by re-deriving it |

**The finding worth more than any single fix: all three injection surfaces are
ONE bug** — content closing a delimiter it was meant to sit inside. Different
delimiters, different sinks, same shape.

### What this epic kept getting wrong, and kept recording

Three times a number in this epic took its **denominator from the numerator's
shape**, and each time that excluded — and therefore hid — the rows it did not
match: *"11 of 18 install steps"* hid three that never pinned at all; *"1 of 28
at an exact version"* was one manifest of five; *"every generated viewer"* was
12 of 31 pages.

Every one is recorded in place rather than silently corrected, because the
second and third occurrences are what make it a pattern rather than a slip.
That is `w4tq`'s lesson — counting what matches a SHAPE rather than what
satisfies the CONTRACT — and this epic is its longest worked example.

### What is NOT claimed

The gates report that a check ran and what it said. None of them claims the
repository is safe. An advisory not yet published is not one `bun audit` can
see; a clean secret scan is evidence about the patterns it knows. Saying so is
the point of the three-state discipline every child implements.
