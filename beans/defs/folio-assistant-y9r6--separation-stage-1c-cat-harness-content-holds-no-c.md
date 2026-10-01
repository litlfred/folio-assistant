---
# folio-assistant-y9r6
title: 'Separation stage 1c: cat-harness content holds no code — block manifests, tool and skill definitions become JSON'
status: todo
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-01T06:58:01Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-8lcl
---

Stage 1c of the split plan — FR-7, content holds no code. Owner D2 (2026-10-01), option 1: convert to JSON data, validated by the tools on read.

- 189 block manifests + 7 translation nodes → `<block>.json`; `readBlockManifest` accepts `.json`
- 100 `defineTool` literals (4 files) → one JSON tool node each under `cat-harness/tools/<stub>/`; `discover.ts` (in tools since 1a) validates with `ToolDefinitionSchema`; the 129 `test/results/kg-qa/tools/*` sidecars keep their verdicts (identity-checked relocation if keyed by path)
- 8 `SkillDefinition` `.ts` → entries in `skills/skill-definitions/*.json` (the #1702 form)
- browser JS under `docs/` per D5 (default, 2026-10-01): site chrome moves to `cat-harness-tools/site/`, composed in by `compose-docs`

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] new gate `check:content-code-free` (no tracked `.ts/.js/.py/.sh` under `cat-harness/`) watched red first, then green, and wired in CI
- [ ] every node and page `.jsonld` byte-identical (`jsonld-gen-check`)
- [ ] `knownSkills` identical; `kg-export` node count identical; `check:tools` and `tool-coverage` green
