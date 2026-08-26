# Skills classification: what belongs in `folio-assistant` vs stays in `qou`

**Date:** 2026-06-29
**Scope:** the `.claude/skills/` tree in `litlfred/qou` (~95 `local/*.md`
skills + the typed `framework/ actors/ capabilities/ requirements/ roles/`
layer + `registry.ts`).
**Question:** which skills (and which of the typed framework layer) are
platform infrastructure that should live in `litlfred/folio-assistant` and
be synced back, versus genuinely QOU-domain skills that stay local.

> Filed from `litlfred/qou`. This is the canonical copy; the matching
> folio-assistant issue embeds the same tables.

## The decisive boundary

From [`scripts/setup-folio-assistant.sh`](../../scripts/setup-folio-assistant.sh):

> *qou is **CONTENT ONLY**. The platform it consumes (content pipeline,
> schemas, LaTeX rendering, viewer, computations) lives in a SEPARATE repo,
> `litlfred/folio-assistant` … the **paper adapter** lives at
> `folio-assistant/adapters/paper/`.*

So the test is **not** "is this skill Lean-specific / LaTeX-specific?" —
the Lean workflow, the LaTeX renderer, the content-object schema, and the
QA/witness pipeline are *all* platform code that already moved to
folio-assistant. The test is:

> **A skill stays in qou only if it encodes QOU physics / domain knowledge**
> (the substrate `q₀`, Hecke / Markov-trace compute, the canonical
> derivation chain, mass / binding, numerology discipline, witnessed
> physical constants). Everything that merely *drives platform machinery*
> belongs in folio-assistant — split into a content-agnostic **core**
> bundle and a **paper-adapter** bundle (generic to any formal-math paper:
> qou, ugb, fred2005).

## ⚠️ The archived plan is stale and partly wrong

[`docs/_archive/orphan-top-level/FOLIO_MIGRATION_PLAN.md` §"Skills Audit"](../_archive/orphan-top-level/FOLIO_MIGRATION_PLAN.md)
predates ~70 of the current skills (all the watchers, `integration-*`,
`compute-*`, beans / coordination, one-voice, clarity audits) and
**mis-files** `content-validation`, `latex-validation`, and
`content-block-review` as "stays in content repo." But the schema, the
validator, and the LaTeX renderer those three skills invoke **already live
in folio-assistant** — so they should move with the paper adapter. Do not
follow that table; this document supersedes its Skills Audit section.

## Three tiers

Tiers 1 and 2 both live in folio-assistant. Tier 2 is the paper-adapter
bundle — formal-math-paper-specific but domain-agnostic. Only Tier 3 stays
in qou.

### Tier 1 — folio-assistant CORE (content-agnostic, any folio)

Agent workflow, coordination, the watcher framework, deployment, the
QA-sidecar / bibliography / glossary / render-QC pipeline, beans.

`bean-coordination`, `todo-manager`, `session-intent`, `pending-show`,
`idle-backlog`, `continual-progress`, `coordinate`, `watch`, `pickup`,
`prepare-merge`, `prepare-merge-auto`, `delivery-summary`, `diff`,
`integration-watch`, `integration-watcher`, `integration-audit`,
`integration-backlog`, `deployment-auth`, `todo-review`, `docs-generation`,
`test-engineer`, `glossary-build`, `block-density`, `content-graph`,
`chapter-complexity-review`, `markdown-render-check`, `html-rendering-qc`,
`readability-editing`, `md-authoring`, `bib-qa`, `bib-human-review`,
`bib-photo-ingestion-watcher`, `one-voice-audit`,
`one-voice-integration-watcher`, `devils-advocate-watcher`.

### Tier 2 — folio-assistant PAPER-ADAPTER bundle (formal-math, domain-agnostic)

Lean workflow, proof tooling, content-object validation, LaTeX, paper
structure, import, simulators — generic to qou / ugb / fred2005, **not**
QOU physics.

- **Lean:** `formalizer`, `lean-generation`, `lean-proof-review`,
  `lean-build-fix`, `lean-completeness-audit`, `lean-substantive-pass`,
  `lean-environment-setup`, `lean-mathlibext-curator`,
  `lean-proof-vacuity-audit`, `lean-witness-audit`.
- **Proof tooling:** `proof-triage`, `proof-simplifier`,
  `proof-status-tracking`, `proof-editor`, `proof-conciseness`,
  `proof-exposition-review`, `proof-gap-audit`,
  `proof-narrative-lean-equivalence`, `proof-integration-watcher`.
- **Content / LaTeX / structure:** `category-theory`, `content-validation`,
  `content-block-review`, `latex-validation`, `latex-build-cache`,
  `rendering-auditor`, `rendering-fixes`, `critical-path-analysis`,
  `chapter-analysis`, `paper-importer`, `document-intake`, `simulator`,
  `simulator-math-audit`, `definition-clarity-audit`,
  `proposition-consolidation-audit`, `remark-audit`.

### Tier 3 — qou-LOCAL (QOU physics — STAYS)

`canonical-watcher`, `production-vs-exploratory-discipline`,
`compute-integration-watcher`, `verify-local-substrate`, `q-usage-watcher`,
`lean-q-substitution`, `lean-substrate-numerics`, `witnessed-values`.

### Hybrid — split (generic mechanism → folio; QOU data → thin local shim)

| Skill | Move to folio | Keep in qou |
|---|---|---|
| `editor` | generic routing / session-start / triage skeleton | QOU routing examples |
| `scientific-accuracy` | fact-check discipline / method | QOU physics examples |
| `ontologist` | terminology-discipline mechanism | the actual QOU ontology data |
| `one-voice-style-guide` | "scholarly voice" rubric | the author's specific voice profile |
| `compute-author` | precision / witness-JSON authoring discipline (the `witness-schema` package contract) | canonical-chain / Hecke / q₀ content |
| `compute-audit` | generic "find slow compute / cache wiring" method | LaurentQ / BlockCache / `markov_peel` specifics |
| `ffi-roundtrip-audit` | generic FFI-roundtrip method | `pyhecke` / `hecke-engine` specifics |
| `detangler-integration-watcher` | watcher framework | QOU chapter targets |
| `symbiotic-interaction` | author-steering protocol | QOU math-discovery tuning |
| `groebner-basis` | shared formal-math (ugb + qou) → paper adapter | — |

## The framework layer (highest-leverage, most overlooked)

The typed layer under `.claude/skills/` is pure platform and is **already
half-migrated**: [`framework/package-manifest.ts`](../../.claude/skills/framework/package-manifest.ts)
re-exports from `folio-assistant/schemas/`.

| Path | Disposition |
|---|---|
| [`framework/types.ts`](../../.claude/skills/framework/types.ts), `framework/package-manifest*.ts` | → folio-assistant (platform types; already re-exporting) |
| [`actors/`](../../.claude/skills/actors) (`reader`, `collaborator`, `owner`, `lean-mcp`) | → folio-assistant |
| [`capabilities/`](../../.claude/skills/capabilities) (`git-read`, `git-push`, `lean-toolchain`, `lean-mcp`, `deploy-access`, `llm-api`) | → folio-assistant |
| [`requirements/`](../../.claude/skills/requirements) (`session-start`, `content-change-review`, `commit-hygiene`) | → folio-assistant core; `sorry-citation` → paper adapter |
| [`registry.ts`](../../.claude/skills/registry.ts) | **stays in qou** — this repo's *instance manifest* selecting which folio skills + local skills it uses |
| [`roles/role-assignments.ts`](../../.claude/skills/roles/role-assignments.ts) | **stays in qou** — instance data binding roles → this repo's skill set (the `RoleAssignments` *type* moves) |

## Hooks / scripts that move with the skills

From `registry.ts` `hooks`:

- **Core:** `session-start-coord-sweep.sh`, `render-on-change.sh`,
  `check-upstream.sh`, the `PostToolUse` PR-subscribe hook.
- **Paper adapter:** `lean-build-bg.sh`, `check-no-lean-artifacts.sh`.
- **qou-local:** any physics-specific hook.

## Recommended mechanism

Exactly the path the
[2026-06-19 handoff §5.1](../handoffs/2026-06-19-folio-asst-beans-handoff.md)
already set: host the canonical generic skills in folio-assistant, then add
**two sync packages** to [`skills-config.json`](../../skills-config.json)
(mode `"sync"`, like the existing `claude-scientific-skills`) →
**`folio-core`** and **`folio-paper-adapter`**, synced nightly into
`.claude/skills/<pkg>/`. After that `local/` holds only Tier 3 + the
hybrid local-config shims, and `registry.ts` references the synced bundles.

## Net result

| Bucket | Count | Lives in |
|---|---:|---|
| Tier 1 — core | ~35 | folio-assistant |
| Tier 2 — paper adapter | ~30 | folio-assistant |
| Tier 3 — QOU physics | ~8 | qou |
| Hybrid (split) | ~10 | both |
| Framework types / actors / capabilities / generic requirements | — | folio-assistant |
| `registry.ts` + `role-assignments.ts` (instance data) | — | qou |

Of ~95 local skills, **only ~8 are genuinely QOU-specific.** The large
majority are platform infrastructure that should not live in qou.
