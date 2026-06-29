# Platform skills migration — qou → folio-assistant bundles

**Date:** 2026-06-29 · **Tracking issue:** [#27](https://github.com/litlfred/folio-assistant/issues/27)
· **Classification:** [2026-06-29-skills-classification.md](./2026-06-29-skills-classification.md)

Migrates the platform agent-skills from the `litlfred/qou` export into two
content-agnostic bundles in this repo, generalizing QOU-specific content where a
reusable mechanism exists and skipping irreducible QOU physics.

## Bundles

| Bundle | Path | Skills | What |
|--------|------|-------:|------|
| **folio-core** | `skills/folio-core/` | 43 | Content-agnostic: agent coordination, the watcher framework, QA / render / bibliography / glossary pipeline, docs, deployment. |
| **folio-paper-adapter** | `skills/folio-paper-adapter/` | 40 | Formal-math paper-adapter (any Lean 4 + LaTeX paper): Lean workflow, proof tooling, content-object validation, LaTeX, paper structure, import, simulators. |

Each bundle has a `package-manifest.json` (Docker/runtime deps + skill list).
Skill-definition `.ts` companions import the framework types from
`skills/framework/types.ts` (a re-export shim over `schemas/assistant-types.ts`);
their `schemaRef` modules were normalized to the real schema files
(`schemas/types`, `schemas/constraints`, `schemas/formalization-types`).

## Coverage

87 source skills → **83 migrated** (50→core incl. companions, 40 paper-adapter
`.md`), **4 skipped**:

| Skipped | Why |
|---------|-----|
| `q-usage-watcher` | Entirely the substrate-parameter `q` regime taxonomy; only generic part is the parent `integration-watcher` (already migrated). |
| `lean-q-substitution` | Pure QOU physics — the `s := q+q⁻¹` tactic for one substrate window. |
| `lean-substrate-numerics` | Pure QOU physics — bracket lemmas for one constant. |
| `simulator-math-audit` | Dead redirect stub (pointed at a file absent from the export). |

Tier-3 QOU-physics skills that *did* yield a reusable mechanism were generalized
(e.g. `canonical-watcher` → generic derivation-discipline watcher;
`verify-local-substrate` → generic `uses[]`-connectivity check;
`witnessed-values` → generic computed-value provenance).

## Duplicates to reconcile (not deleted in this pass)

These migrated skills already had a copy elsewhere in the repo; the bundle copy
is intended to become canonical, but the existing copies were **left intact** to
avoid breaking `skill_fetch` (which serves `src/skills/*.md`). Follow-up: retire
the old copies once the bundles are wired into `skill_fetch` / `skills-config`.

- `.claude/skills/local/`: `bean-coordination`, `todo-manager`
- `src/skills/`: `deployment-auth`, `editor`, `readability-editing`, `symbiotic-interaction`, `todo-review`

## Not migrated (by design)

- The qou **framework instance data** — `actors/`, `capabilities/`, `roles/role-assignments`,
  `registry.ts`. folio-assistant already has its own richer actor/capability model
  under `.claude/skills/`; the qou RBAC instance stays in qou. Only the framework
  *types* are shared (already in `schemas/assistant-types.ts`).

## Follow-ups

1. Wire the bundles into `skill_fetch` and a `skills-config.json` sync entry
   (`folio-core`, `folio-paper-adapter`) so qou/ugb/fred2005 consume them.
2. Render the bundle bodies on the docs site (extend `scripts/gen-skill-docs.ts`).
3. Retire the duplicate copies listed above.
4. Align the residual `AGENTS.md §<section>` cross-refs in a few skill bodies to
   folio-assistant's AGENTS.md.
