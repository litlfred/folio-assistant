---
# folio-assistant-j00t
title: Retire the unused contributes config field and its module loader path
status: completed
type: task
priority: normal
created_at: 2026-10-05T11:38:54Z
updated_at: 2026-10-09T15:35:00Z
parent: folio-assistant-zzmr
---

Left behind by riit. Every contribution is now a node: block kinds, content adapters, QA checkers, pipeline plugins and Tool nodes. No instance declares a `contributes` module; measured 2026-10-05, no `<instance>.json` carries the field.

The loader still reads it:
- `harness-config.ts` has `contributes: z.string().optional()` at :364 and imports the module at :1862.
- `harness.config.example.json` documents the field.

## Done when
- [x] The field, its loader branch and the example entry are gone, or the owner rules to keep it as an extension point.
- [x] RendererContribution is decided. No renderer is contributed today: either renderers get a node graph like checkers have, or the shape goes along with the field.

## Closed 2026-10-09

- Branch: `claude/j00t-retire-contributes`
- Commit: `ec68a7a0` (`feat(config): retire unused contributes config field and module loader (folio-assistant-j00t)`)
- Repository / Worktree: `cat-harness` (`.claude/worktrees/cat-harness-j00t`)

### Summary of Changes
1. **Config & Schema**:
   - Removed `contributes` from `HarnessConfig` interface and `HarnessConfigSchema` in `schemas/harness-config.ts`.
   - Removed `contributes` example and comment from `docs/reference/harness.config.example.json`.
2. **Module Loader**:
   - In `schemas/harness-config.ts`, removed dynamic module loading loops from `loadContributions` and `loadContributionsSync`.
   - Removed unused helper functions `contributingDependencies`, `contributeFunction`, and `registerPinned` (inlined `name` and `root` pinning into `registerDeclaredContributions`).
   - Removed `DECLARED_COMPUTED_IMPORTS["cat-harness/schemas/harness-config.ts"]` and the `contributingDependencies` import from `scripts/staging-cone.ts`.
3. **RendererContribution Decision**:
   - Preserved `RendererContribution` and its registry accessors in `schemas/contributions.ts` because it is actively referenced in `content/pipeline/render-discovery.ts` (`registry?.renderer(...)`), `schemas/render-targets.ts`, and tested in `scripts/tests/render-discovery.test.ts`.
4. **Tests & Input Sites**:
   - Retired test `every declared \`contributes\` module lies under \`*/contributes.ts\`` in `scripts/tests/input-sites.test.ts`.
   - Retired computed import test for harness-config in `scripts/tests/staging-cone.test.ts`.
   - Updated `content/pipeline/pipeline-plugins.test.ts` to declare pipeline plugins via KG nodes rather than retired `contributes` module fixture.

### Verification Evidence
- `bun test scripts/tests/input-sites.test.ts scripts/tests/staging-cone.test.ts content/pipeline/contributions-root.test.ts scripts/tests/associated-harness-config.test.ts scripts/tests/render-discovery.test.ts content/pipeline/pipeline-plugins.test.ts`: 84 pass, 6 skip, 0 fail (141 expect calls).
- `bun run typecheck`: clean pass (`tsc --noEmit -p tsconfig.json`, exit code 0).
- Branch pushed cleanly to `origin/claude/j00t-retire-contributes`.
