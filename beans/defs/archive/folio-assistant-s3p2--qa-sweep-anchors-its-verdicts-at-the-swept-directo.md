---
# folio-assistant-s3p2
title: qa-sweep anchors its verdicts at the SWEPT directory, not the instance root, because resolveHarnessConfigPath climbs
status: completed
type: bug
created_at: 2026-09-23T10:52:44Z
updated_at: 2026-09-23T10:52:44Z
parent: folio-assistant-q4jm
---

Measured 2026-09-23 on a folio scaffolded by init-folio. Running `qa-sweep.ts folio` wrote `folio/test/results/block-qa/handbook/introduction/overview.qa.json`. That is INSIDE the content graph directory, not `<repo>/test/results/block-qa/…`, which is where `blockQaPath` documents verdicts as living (relative to the instance root).

Cause: `findContentRepoRoot(startAbs)` in `cat-harness/content/pipeline/qa-sweep.ts` returns the FIRST directory where `existsSync(.git) || resolveHarnessConfigPath(dir)` holds. But `resolveHarnessConfigPath` itself climbs to parent directories. So it succeeds at the start directory whenever ANY ancestor has a config, and the sweep anchors at whatever path it was given.

Likely fix: return `dirname(found.path)` (the directory holding the declaration), or the declared instance root.

**Why it isn't fixed in qbfi's PR:** it moves where every existing folio's sweep writes its verdicts, and existing verdicts at the old anchor would stop being found (`existingBlockQaPath` checks only the instance-root tree and the legacy sibling). Check `litlfred/qou` first. Ask the owner whether to migrate the verdicts, or read both locations for a transition.

Meanwhile, `cat-harness/scripts/publish-block-qa.ts` (qbfi) reads BOTH anchors.

## Done when
- [x] where qou's verdicts actually live is measured (2026-09-23, qou `7aafd8dbe`): **3,653** `*.qa.json`, ALL legacy siblings under `content/` beside their blocks. None at `<root>/test/results/block-qa/`, none at a nested `content/test/results/block-qa/`. So moving the anchor strands nothing: `existingBlockQaPath` always falls back to the sibling.
- [x] the owner rules: move the anchor (with a migration) or leave it. **Owner, 2026-09-23: "1 + 2=bean"**: fix the anchor now (option 1). Moving qou's 3,653 sibling verdicts into `test/results/block-qa/` (option 2) is a separate bean.
- [x] a test pins the anchor for a scaffolded folio: `cat-harness/content/pipeline/qa-paths.test.ts`, which fails with the old condition (anchored at `folio/`) and passes with the fix. `findContentRepoRoot` moved into `qa-paths.ts` so it can be imported without running a sweep.

## Summary of Changes

`findContentRepoRoot` (now in `qa-paths.ts`) stops at the first directory that ITSELF declares an instance (`findDeclarationFile`) or holds `.git`, instead of any directory whose ancestors have a config. A sweep of a scaffolded folio's `folio/` now anchors at the folio root, where `blockQaPath` documents verdicts. No existing verdicts move. The platform's own 122 already sit at the anchor the fix computes (`cat-harness/`). qou anchors by `.git` at its root either way, and its 3,653 sibling verdicts are always read. Freshness is keyed on content hashes, not paths, so nothing turns stale. `publish-block-qa` keeps reading the swept directory as a transition fallback for folios swept before the fix.
