---
# folio-assistant-rn24
$schema: bean/1.0.0
title: 'GATES: content-root gate set follow-ups (smart-ra re-pin, drop the PREREQUISITE_FILES skip)'
status: completed
type: task
priority: normal
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-30T18:30:00Z
parent: folio-assistant-3fva
---

Bean for cat-harness-tools#281. The decision is made and implemented: smart-ra is held to its own gate set (cat-harness-tools#288; `scripts/lib/root-gate-set.ts`, `.github/scripts/layer-pr-checks/run-gates.py`).

## Done when
- [x] smart-ra's `index.lock.json` is re-pinned off cat-harness-tools 954ef7b, through the consent-recorded `mount:remote --seed` together with a cat-harness re-pin (`litlfred/smart-ra#96`, merged 2026-10-29)
- [x] the `PREREQUISITE_FILES` skip in `run-gates.py` is dropped. This needs `glossary:page` to run before `uml:overview:check` in smart-ra, and a PlantUML renderer (the jar fetch failed). (`litlfred/cat-harness-tools#897`)

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

## Progress
- **2026-10-30:**
  - Verified `smart-ra/index.lock.json` on `main` is already re-pinned off `954ef7b` via `litlfred/smart-ra#96` (`cat-harness-tools` at `e06110356fd76a6133e320b9f64935453314f441`, `cat-harness` at `58a6600656fc8fa14137b4b7b999a31987447311`), which also brings in the Maven Central `plantuml-1.2026.9.jar` renderer fix (`e061103`).
  - Opened `litlfred/cat-harness-tools#897` (`fix/rn24-content-root-gate-set-follow-ups`):
    1. Dropped `PREREQUISITE_FILES` in `.github/scripts/layer-pr-checks/run-gates.py` so `uml:overview:check` and `readme:subgraphs:check` run in content roots.
    2. Added `hostedKgWrites(repoRoot)` in `scripts/qa-refresh.ts` so `kg:audit:all` claims the hosted KG-QA tree of any instance declared in `repoRoot` whose `kgQaHomeFor` resolves to `"hosted"` (e.g. `cat-harness/test/results/dpi-h-ra/**` in `smart-ra`), making `qa:refresh` complete (`COMPLETE (computed): 1718 file(s), 12738300 bytes from 24 writer(s), 6 not applicable here`).
    3. Added `["bun", "run", "cat", "glossary:page"]` to `WORKING_COPY_STEPS` and updated `workingCopyUnbuildable` in `scripts/qa-working-copy.ts` to accept content roots carrying `index.config.json`, so `ensureWorkingCopy` builds the glossary pages when `skill:register` is skipped as `readsState`.
    4. Updated `snapshot()` in `scripts/publish-check.ts` to skip top-level `BUILD_OUTPUT_DIRS` (`_kg`, `build`, `_site`, `dist`) when `repoRoot` itself is in `roots` (while keeping `bootstrap/_kg/`), preventing `_kg/cat-harness/cat-harness.jsonld` regenerated during `qa:refresh` from being flagged as a moved committed file during `uml:overview:check`.
    5. Verified cold-start `bun run cat uml:overview:check` and `bun run cat readme:subgraphs:check` both exit 0 in `smart-ra`.

_2026-10-30T18:30:00Z_ — `litlfred/cat-harness-tools#897` merged (`a3ed72d`) after main was merged into the branch (`bf34ee0`; import conflicts resolved to the in-repo `../schemas/...` paths from 8lcl). Both boxes are done, so this bean is completed and `cat-harness-tools#281` closes. Lane F thread (https://claude.ai/code/session_01Qmmkt9AsHEPn8ghL33PKJp).
