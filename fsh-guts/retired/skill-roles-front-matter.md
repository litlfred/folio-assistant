---
$schema: folio-fsh-guts/v1
title: "The `roles:` field in SKILL front matter — 288 annotations, no reader, born dangling"
kind: retired-field
movedOn: 2026-09-20
movedFrom: "front matter of 114 `*.md` files under `cat-harness/skills/folio-core/`, `cat-harness/skills/folio-paper-adapter/`, `cat-harness/src/skills/` and `.claude/skills/local/`"
bean: folio-assistant-qif9
issue: 363
summary: >-
  Every value the field carried, per file, at the commit it was removed. Migrated from qou on 2026-06-15 as "actor IDs that may invoke this skill" — a target that never existed: no reader.json, collaborator.json or owner.json has ever been added to the actor registry, in any commit. It grew 6 → 114 skill files by copy-paste, acquired a second vocabulary when `Role` was given to the BPMN swimlane, and 260 of its 288 annotations resolved against nothing. The identically-named field in `folio-memory/v1` entries is a DIFFERENT field with a real reader and was kept.
---

# `roles:` in skill front matter — the whole record

**Removed 2026-09-20** under bean `folio-assistant-qif9`, on the owner's
instruction (*"three zero-reader fields — cleanup/excise"*, *"retire → put in
fsh-guts w/ as much metadata as known, do some git commit archaeology"*).

This page exists so the removal is recoverable. Everything the field said is
below, per file. Nothing was summarised away.

## Scope — 114 skill files, NOT the 26 memory entries

140 markdown files carried a key spelled `roles:`. **Only 114 were this
field.** The other 26 are `folio-memory/v1` entries — under
`cat-harness/skills/memory/` when this was measured, moved to `memory/` at
the repository root the same day (bean `07xs`) — where `roles:` is a
**live axis**:
`memoryForRoles` in `schemas/memory.ts` filters on `tags.roles`, so an entry's
roles decide which lane is handed it.

That distinction was not obvious and was not reasoned out — **it was caught by
a test after the first pass got it wrong.** The excision initially took all
140, and `agent-memory.test.ts` failed on
*"a CI lane sees the CI entries; another lane does not"*: with every entry
untagged, `memoryForRoles` returned all of them to every lane and the axis
stopped discriminating. Restored, and `check:retired-front-matter` now carries
the exemption keyed on `$schema` rather than on directory.

**The lesson, which is the general one:** sharing a key name across graph
kinds is not sharing a field. A "nothing reads this" measurement has to be
taken per kind, and a probe against the exported KG will not see a reader that
consumes the front matter directly.

## Why it went

Three facts, each measured rather than argued.

### 1. Nothing read it

Probed 2026-09-20 against the exported graph — `bun run kg:export`, 1506 nodes:

| probe | result |
|---|---|
| Skill nodes in the graph | 180 |
| …carrying `roleName` or `roles` | **0** |
| nodes carrying either, of any type | 27, **all `Actor`** |

The 27 come from `.claude/skills/actors/*.json` through `registryFields()` in
`scripts/kg-export.ts`, which handles `roles` under `group === "actors"` and
nowhere else. `gen-skill-docs` emits `layout`, `title`, `parent` and drops it.

One consumer did read it and is named below, because it is not an exception to
this heading so much as an illustration of it.

`SkillDefinitionSchema` in `schemas/skill-package.ts` does require `roles`, but
that schema describes a skill **definition object**; nothing parses markdown
front matter against it.

### 2. It was dangling from its first commit, not from a later rename

At migration the contract was explicit. `schemas/assistant-types.ts` at
`2734a70f`:

```text
/** Actor IDs (roles) that may invoke this skill. */
roles: string[];
```

and the class diagram above it drew `roles──▶ ActorDefinition.id`. So the field
was an **access** declaration — who may invoke this skill — pointing at the
actor registry, which is why its vocabulary is `reader` / `collaborator` /
`owner` and reads like forge permission tiers.

**Those actors have never existed.** Checked across every commit in the
repository's history:

| candidate | commits that ever added it |
|---|---|
| `.claude/skills/actors/reader.json` | **0** |
| `.claude/skills/actors/collaborator.json` | **0** |
| `.claude/skills/actors/owner.json` | **0** |

It was born dangling. The handful of values that do resolve today
(`author`, `reviewer`, `admin`, `authoring-agent`, …) resolve by coincidence —
those actor files exist for other reasons.

### 3. The second vocabulary is a later collision

`Role` was subsequently given to the **BPMN swimlane**
(`scenarios/roles.json`). Authors reading the field by its new name began
writing swimlane roles into it — `code-reviewer`, `validation-pipeline`. So one
field came to hold two vocabularies with no way to tell which a value belonged
to except by looking each up.

`skills/folio-core/library-ingestion.md` is the clearest specimen:
`roles: [ingestion-agent, authoring-agent, collaborator, owner]` — two real
roles and two tier words in one list.

## The one consumer, and what replaced it

`src/impact/stakeholder-map.ts` read the field through a local `rolesOf()` and
reported it as **"Roles reached"** in the CRDM phase-1 stakeholder map. Two
things were wrong with that, beyond the field itself:

- It printed `collaborator, owner` beside `build-pipeline` with nothing
  distinguishing them, so a confident wrong answer was indistinguishable from
  a real one.
- `rolesOf` matched only the inline `roles: [a, b]` form. The 28 files using a
  YAML block list were read as declaring **nothing at all** — the local reader
  was worse than the corpus it read.

It now derives roles from the **lanes** it already computes, resolved through
`roleForLane` against `scenarios/roles.json`. Every value in
`Roles reached:` resolves, and a lane binding no declared role is reported
under `notDetermined` — *"unknown impact rather than absent impact"* — where
before it contributed nothing and read as nobody being affected. That change
immediately surfaced one real unbound lane.

## How it spread

Never by decision. Six files arrived in the qou migration and the rest is
copy-paste, most of it in the skill-migration batches of 2026-06-29:

| date | commit | files carrying `roles:` |
|---|---|---|
| 2026-06-15 | `2734a70f` — *migrate MCP core and adapters from qou* | 6 |
| 2026-06-29 | `dd6697e1` — *checkpoint migrated skill batches* | 69 |
| 2026-07-12 | `3fb27aec` | 83 |
| 2026-08-11 | `1690d08d` | 93 |
| 2026-09-20 | at removal (140 total, 114 of them this field) | **140** |

## The census at removal

The 114 skill files, **288 annotations**, none empty-valued.

| uses | value | resolves against |
|---|---|---|
| 104 | `collaborator` | **nothing** |
| 99 | `owner` | **nothing** |
| 56 | `reader` | **nothing** |
| 6 | `authoring-agent` | role + actor |
| 4 | `editor` | role |
| 3 | `ingestion-agent` | role + actor |
| 3 | `reviewer` | role + actor |
| 3 | `narrative-reviewer` | role |
| 2 | `code-reviewer` | role |
| 2 | `author` | role + actor |
| 1 | `admin` | actor |
| 1 | `validation-pipeline` | role |
| 1 | `attestation-service` | role + actor |
| 1 | `publication-manager` | role + actor |
| 1 | `qc-reviewer` | role + actor |
| 1 | `auditor` | **nothing** |

**260 of 288 resolved to nothing** — 90 %.

## What this does NOT decide

Two questions stay open, and neither is answered by the removal:

- **What `reader` / `collaborator` / `owner` mean.** They read like forge
  permission tiers, which would make them a **deployment topology** fact
  rather than a skill fact — see issue #363. If that vocabulary is wanted, it
  gets declared first and a field named for it second, in that order.
- **Which skills belong to which swimlane.** That is bean `y1w9`, and the 28
  resolving annotations below are *evidence for* it, not a substitute. They
  were written without a validator and 90 % of their neighbours are wrong, so
  each needs checking rather than lifting.

## The full inventory

Every file removed from, with every value it carried, at the commit before
removal.

Legend: `` `role` `` resolves in `scenarios/roles.json` · _actor_ resolves
in `.claude/skills/actors/` · **permission** resolves in
`skills/permissions/permissions.json` · ~~struck~~ resolves nowhere.

| file | `roles:` |
|---|---|
| `.claude/skills/local/language-trap-agent-audit.md` | ~~collaborator~~ |
| `cat-harness/skills/folio-core/bean-coordination.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/bib-human-review.md` | ~~collaborator~~ |
| `cat-harness/skills/folio-core/bib-photo-ingestion-watcher.md` | ~~collaborator~~ |
| `cat-harness/skills/folio-core/bib-qa.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/block-density.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/canonical-watcher.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/chapter-complexity-review.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/code-node-review.md` | `code-reviewer`, _admin_ |
| `cat-harness/skills/folio-core/compute-integration-watcher.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/content-acquisition.md` | `ingestion-agent`, `authoring-agent`, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/content-graph.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/continual-progress.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/coordinate.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/deletion-requires-confirmation.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/delivery-summary.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/deployment-auth.md` | ~~owner~~ |
| `cat-harness/skills/folio-core/detangler-integration-watcher.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/devils-advocate-watcher.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/diff.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/dispatch-agent.md` | ~~collaborator~~ |
| `cat-harness/skills/folio-core/docs-generation.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/editor.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/exposition-swarm-drain.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/flushable-containers.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/getting-started.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/glossary-build.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/html-rendering-qc.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/idle-backlog.md` | ~~reader~~ |
| `cat-harness/skills/folio-core/integration-audit.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/integration-backlog.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/integration-watch.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/integration-watcher.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/interaction-modality.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/library-ingestion.md` | `ingestion-agent`, `authoring-agent`, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/markdown-render-check.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/md-authoring.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/milnor-exposition-standard.md` | `author`, `editor`, `reviewer`, `narrative-reviewer` |
| `cat-harness/skills/folio-core/one-voice-audit.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/one-voice-integration-watcher.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/one-voice-style-guide.md` | ~~reader~~, ~~collaborator~~ |
| `cat-harness/skills/folio-core/ontologist.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/opening-brief.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/pending-show.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/pickup.md` | ~~collaborator~~ |
| `cat-harness/skills/folio-core/placement.md` | `authoring-agent`, `code-reviewer` |
| `cat-harness/skills/folio-core/prepare-merge-auto.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/production-vs-exploratory-discipline.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/qa-report-signing.md` | `validation-pipeline`, `attestation-service`, `publication-manager` |
| `cat-harness/skills/folio-core/qa-witness.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/readability-editing.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/repo-conversion.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/role-model.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/scientific-accuracy.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/session-intent.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/symbiotic-interaction.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/test-engineer.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/theme-ui-review.md` | `reviewer`, `authoring-agent`, `narrative-reviewer`, ~~owner~~ |
| `cat-harness/skills/folio-core/todo-manager.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/todo-review.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/turn-reporting.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/uploads-watch.md` | `ingestion-agent`, `authoring-agent`, ~~owner~~ |
| `cat-harness/skills/folio-core/uses-editorial-review.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-core/voice-authoring-guidance.md` | `author`, `authoring-agent`, `editor` |
| `cat-harness/skills/folio-core/voice-editorial-review.md` | ~~collaborator~~, ~~owner~~, `editor` |
| `cat-harness/skills/folio-core/voice-overlay-review.md` | `reviewer`, `narrative-reviewer`, `editor`, `qc-reviewer` |
| `cat-harness/skills/folio-core/watch.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/build-docs.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/build-pdf.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/category-theory.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/chapter-analysis.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/compute-audit.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/compute-author.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/content-block-review.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/content-validation.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/definition-clarity-audit.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/document-intake.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/ffi-roundtrip-audit.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/formalizer.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/groebner-basis.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/latex-build-cache.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/latex-validation.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-build-fix.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-cache-restore.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-completeness-audit.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-environment-setup.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-formal-graph.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-generation.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-mathlibext-curator.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-proof-review.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-proof-vacuity-audit.md` | ~~collaborator~~ |
| `cat-harness/skills/folio-paper-adapter/lean-substantive-pass.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/lean-witness-audit.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/paper-importer.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-conciseness.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-editor.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-exposition-review.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-gap-audit.md` | ~~reader~~, ~~collaborator~~ |
| `cat-harness/skills/folio-paper-adapter/proof-integration-watcher.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-narrative-lean-equivalence.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-simplifier.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-status-tracking.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proof-triage.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/proposition-consolidation-audit.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/q-usage-watcher.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/remark-audit.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/rendering-auditor.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/rendering-fixes.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/semantic-review-scoping.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/simulator-math-audit.md` | ~~collaborator~~, ~~owner~~, ~~auditor~~ |
| `cat-harness/skills/folio-paper-adapter/simulator.md` | ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/verify-local-substrate.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/skills/folio-paper-adapter/witnessed-values.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
| `cat-harness/src/skills/corpus-grep.md` | ~~reader~~, ~~collaborator~~, ~~owner~~ |
