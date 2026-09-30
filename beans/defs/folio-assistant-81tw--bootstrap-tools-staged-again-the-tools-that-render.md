---
# folio-assistant-81tw
title: 'BOOTSTRAP-TOOLS STAGED AGAIN: the tools that render and validate bootstrap/ leave cat-harness, toward litlfred/bootstrap-tools'
status: in-progress
type: feature
priority: high
created_at: 2026-09-29T23:13:27Z
updated_at: 2026-09-29T23:13:54Z
parent: folio-assistant-vuip
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
- [x] `bootstrap-tools/bootstrap-tools.json` declared, `needs: ["cat-harness"]`, with AGENTS.md/CLAUDE.md/README; nothing in cat-harness imports or names it (check:partition, check:reference-direction green)
- [x] files moved with history; every path reference updated (package scripts, CI workflow, artefact-verification, declared-path baseline, schema viewer, glossaries — regenerated, never hand-edited)
- [x] IRIs: own namespace `…/bootstrap-tools/ns#` minted in own-namespaces.json; moved schema nodes resolve under the bootstrap-tools document IRI; no stale `cat-harness.jsonld#schema/{discussion,bootstrap-graph}` reference remains
- [x] the 5 published `bootstrap/schemas/*.schema.json` are BYTE-IDENTICAL before and after (their `$id`s are a published contract)
- [x] Zod validation runs as a step of the bootstrap render pipeline (owner: "need Zod usage in bootstrap tools as part of validation in rendering pipeline")
- [x] SEMVER skill in bootstrap-tools — owner, 2026-09-29, chose **"Bootstrap contract semver"**: a skill defining major/minor/patch for bootstrap's PUBLISHED schemas and graph, with the bump COMPUTED by the bootstrap-tools pipeline from a diff of the generated schemas (in the spirit of the instance-versioning proposal, #592: "a version bump COMPUTED by diffing the exported graph rather than asserted"). Not the every-instance version, and the release skills stay where they are.
- [x] cat-harness carries bootstrap's publication as a worked SDLC example — owner, 2026-09-29: *"in cat-harness, bootstrap publication can be an SDLC example"* — the lifecycle Zod change → generate → validate → computed semver bump → publish, placed in cat-harness's SDLC/release guidance, WITHOUT cat-harness code importing bootstrap-tools (check:reference-direction decides whether prose may name it)
- [x] `bun run gates` green apart from the known local-only `.claude/worktrees` failures

## Progress (2026-09-30)
- Root visibility is by DISCOVERY (`instanceRootsIn`), with no entry in `cat-harness.json`; see `_visibility_comment` in `bootstrap-tools/bootstrap-tools.json`.
- `partition/instance-rules.ts` got NO repo entry for this instance: `check:partition` scans only `cat-harness/` (bean `p11x`), so an entry would name bootstrap-tools from cat-harness code and enforce nothing. The direction is held by `check:reference-direction`, where cat-harness -> bootstrap-tools is 1 occurrence: the owner-mandated `own-namespaces.json` code.
- After merging main (release-minted `$id`s), `bootstrap:validate` reads the discussion `$id`s from the published schemas, and `bootstrap:semver` treats a `$id` moving to the next release version as no change.
- `bun run gates` 2026-09-30: 175 of 176 pass. The one red is `bun test`, and only for two assertions that expect the checkout directory to be called `folio-assistant` (`folio-root.test.ts`, `instance-render.test.ts`). They fail only because this worktree is `wt-bootstrap-tools`, and they pass in a checkout with the usual name.
