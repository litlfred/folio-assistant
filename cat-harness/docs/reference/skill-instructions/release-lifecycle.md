---
layout: default
title: 'Release lifecycle'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/release-lifecycle.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/release-lifecycle.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/release-lifecycle.md){: .fa-edit-source }

{% raw %}
# Release lifecycle — process and policy

This skill governs **when and why** to create releases. For the **how**
(tagging, notes, `gh release create`), see
[`../folio-core/package-release.md`](package-release.md).

## Semver policy

folio-assistant follows [Semantic Versioning 2.0.0](https://semver.org/):

| Version part | When to bump | Examples |
|---|---|---|
| **Major** (X.0.0) | Breaking change to MCP tools, schema types, or public API. Requires downstream folios to update. | Rename a block kind, remove a pipeline stage |
| **Minor** (0.X.0) | New backward-compatible capability. New skills, tools, block kinds, BPMN workflows. | Add a skill, add a docs page |
| **Patch** (0.0.X) | Bug fix, typo, documentation correction, CI fix. No new capability. | Fix a BPMN marker, fix a broken link |

## Release types and their gates

| Type | Gate | Who decides |
|---|---|---|
| **Draft** | First PR for a planned release merges | Agent creates, BA approves |
| **Pre-release (RC)** | All must-have beans resolved, CI green | BA decides when to test |
| **Named release** | Stakeholder sign-off on the RC | BA + stakeholders |

## Release planning with epics

A **release epic** groups all work for a specific release:

```bash
beans create "Release v0.5.0" --type epic
beans create "Add release lifecycle skill" --type story
beans update <story-id> --parent <epic-id>
```

### Release readiness checklist

A release is ready when:
- [ ] All must-have beans in the epic are resolved
- [ ] CI is green on main
- [ ] All changed docs pages regenerated and verified
- [ ] All changed BPMNs re-rendered
- [ ] Changelog is complete
- [ ] BA has reviewed and approved

## Where code review sits

Code review happens at the **PR level** (before merge to main).
Release approval happens at the **RC level** (after many PRs merge).

```
PR → code review → merge → accumulate in draft release
                                    ↓
                         draft → RC → stakeholder test → named release
```

See [`code-review-process`](code-review-process.md) for the review detail.

## Changelog format (Keep a Changelog)

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- New `release-lifecycle` skill (#1340)

### Changed
- Updated CRDM workflow with Phase 4b prioritization (#1340)

### Fixed
- Added `isMarkerVisible` to BPMN gateways (#1340)
```

Derived from conventional commits:
- `feat:` → **Added**
- `fix:` → **Fixed**
- `docs:` → **Changed**
- `BREAKING CHANGE:` → **⚠ Breaking**

## Cross-domain applicability

| Domain | "Release" | "RC" | "Tag" |
|---|---|---|---|
| **Code** | GitHub release | Staging deployment | Git tag |
| **Paper** | Publication milestone | Draft circulation | DOI assignment |
| **Project** | Deliverable milestone | Stakeholder review round | Completion report |

The process is identical; the artefacts differ.

## Rules

- **Never create a release without BA approval**
- **Never skip the pre-release step** — even for patches
- **The changelog is written for humans** — no commit hashes or bean IDs
- **One release per epic** — if scope creeps, split the epic
- **Draft releases are mutable; named releases are immutable**

## Cross-references

- [`../folio-core/package-release.md`](package-release.md) — release mechanics
- [`code-review-process.md`](code-review-process.md) — review in release context
- [`../../skills/crdm/crdm-requirements-workflow.md`](crdm-requirements-workflow.md) — Phase 6 feeds into release
- [`../folio-core/staging-review.md`](staging-review.md) — staging previews for RCs
- [`../folio-core/todo-manager.md`](todo-manager.md) — bean management within epics
{% endraw %}
