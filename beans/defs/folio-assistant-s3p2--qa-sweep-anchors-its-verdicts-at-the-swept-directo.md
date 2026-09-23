---
# folio-assistant-s3p2
title: qa-sweep anchors its verdicts at the SWEPT directory, not the instance root, because resolveHarnessConfigPath climbs
status: todo
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
- [ ] where qou's verdicts actually live is measured
- [ ] the owner rules: move the anchor (with a migration) or leave it
- [ ] a test pins the anchor for a scaffolded folio
