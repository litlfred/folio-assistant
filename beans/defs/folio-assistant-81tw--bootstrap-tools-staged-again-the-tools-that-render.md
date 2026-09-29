---
# folio-assistant-81tw
title: 'BOOTSTRAP-TOOLS STAGED AGAIN: the tools that render and validate bootstrap/ leave cat-harness, toward litlfred/bootstrap-tools'
status: in-progress
type: feature
priority: high
created_at: 2026-09-29T23:13:27Z
updated_at: 2026-09-29T23:13:35Z
---

**Owner, 2026-09-29:** *"we will https://github.com/litlfred/bootstrap-tools use this for the tools that render bootstrap/ but were put in cat-harness. for now create dir bootstrap-tools/ for staging split out into repo. make sure IRIs updated"* — then, choosing scope: *"1 2 ... need Zod usage in bootstrap tools as part of validation in rendering pipeline. will also need SEMVER skills in bootstrap-tools"*.

**This reverses `319n` (2026-09-24, "Validate/zod in cat-harness") for the files below, on the owner's explicit ruling.** `etg1` (09-20) first staged bootstrap-tools; `319n` retired it. `graph.ts` and `requirement.ts` STAY in cat-harness: cat-harness imports them, so moving them creates a cycle.

`litlfred/bootstrap-tools` exists and is empty (checked 2026-09-29).

## Scope (owner options 1 + 2)
Move, with history (`git mv`):
- `cat-harness/scripts/gen-bootstrap-schemas.ts`, `bootstrap-schema-page.ts`, `gen-bootstrap-graph.ts`, `check-bootstrap-concepts.ts`
- `cat-harness/schemas/discussion.ts` (+ test), `cat-harness/schemas/bootstrap-graph.ts`
- their tests: `bootstrap-schema-page.test.ts`, `bootstrap-graph.test.ts`, and the `check:bootstrap-concepts` block of `requirements.test.ts`

## Done when
- [ ] `bootstrap-tools/bootstrap-tools.json` declared, `needs: ["cat-harness"]`, with AGENTS.md/CLAUDE.md/README; nothing in cat-harness imports or names it (check:partition, check:reference-direction green)
- [ ] files moved with history; every path reference updated (package scripts, CI workflow, artefact-verification, declared-path baseline, schema viewer, glossaries — regenerated, never hand-edited)
- [ ] IRIs: own namespace `…/bootstrap-tools/ns#` minted in own-namespaces.json; moved schema nodes resolve under the bootstrap-tools document IRI; no stale `cat-harness.jsonld#schema/{discussion,bootstrap-graph}` reference remains
- [ ] the 5 published `bootstrap/schemas/*.schema.json` are BYTE-IDENTICAL before and after (their `$id`s are a published contract)
- [ ] Zod validation runs as a step of the bootstrap render pipeline (owner: "need Zod usage in bootstrap tools as part of validation in rendering pipeline")
- [ ] SEMVER skills in bootstrap-tools — scope to be confirmed with the owner
- [ ] `bun run gates` green apart from the known local-only `.claude/worktrees` failures
