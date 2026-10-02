---
# folio-assistant-rmsy
title: generate-readme.sh overwrites any folio's README with qou's prose — the whole-file generator has to go
status: completed
type: task
priority: normal
created_at: 2026-08-29T08:25:00Z
updated_at: 2026-08-29T08:50:00Z
---

Follow-on to `rtoc` (PR #146). That one fixed the contents table; this is the
rest of the same script.

## The hazard

`scripts/generate-readme.sh` ends in `cp "$OUT" README.md`. It **replaces the
folio's entire README**, and what it writes is one folio's content held in the
platform: the title `# Quantum Observable Universe`, three `litlfred/qou`
badges, a Knot Registry of Alexander-Briggs indices, a Project Structure table
naming `content/quantum-observable-universe/lean/`, a Published Artefacts
table of `litlfred.github.io/qou` URLs, and a CC BY 4.0 licence block. Run it
in any other folio and the author loses their README and gains QOU's.

Nothing in CI runs it, and nothing but `readme-metadata.ts` references it — so
this is a loaded gun rather than a live fire. It should not stay loaded.

## Two more qou literals

- `readme-metadata.ts` prefixes every Lean module `QOU.` regardless of the
  folio's Lake library name.
- It carries `WORKFLOW_DESCRIPTIONS`, a hardcoded map of twelve `qou`
  workflow filenames, consulted before the workflow's own `name:`.

## Plan

Generalize the marker mechanism `rtoc` established rather than the script.
`content/pipeline/readme-sections.ts`: a registry of generated sections
(`folio:toc`, `folio:lean-coverage`, `folio:lean-modules`, `folio:simulators`,
`folio:workflows`), each injected **only where the folio's README carries its
marker**. A folio opts in; nothing else in the file is touched; there is no
path by which authored prose is overwritten. Then delete the whole-file
generator and its metadata emitter.

## Landed

`content/pipeline/readme-sections.ts` — five sections in one registry, each
written only where the README carries its markers. `readme_sync` MCP tool,
`bun run readme:sync[:check]`, `readme:sections --list`. `generate-readme.sh`
and `readme-metadata.ts` deleted. `readme-toc.ts` is a pure library now; the
two CLIs writing one file were a disagreement waiting to happen.

## Caught, again, only by running against the real folio

`folio:simulators` blanked qou's nine-row table. The directory it reads,
`folio-assistant/simulators`, exists only once the platform submodule is
checked out — so "absent from this checkout" rendered as "this folio has no
simulators". Sections now have a third state (`skip`): undetermined leaves the
region exactly as it was. Identical in shape to the TOC's unreadable-publish-ref
rule from `rtoc`, which I had already written and still did not generalise
first. An empty directory is still a determined empty.

## The stale table nobody could see

qou's committed coverage said 583 provable / 574 sorry-free (98.5%) for one
paper. Actual: 745 / 736 (98.8%), and two more papers carry Lean —
unital-groebner-bases (10/10) and fred2005-formal-groups (6/6) — which the
single-paper table could not show at all.
