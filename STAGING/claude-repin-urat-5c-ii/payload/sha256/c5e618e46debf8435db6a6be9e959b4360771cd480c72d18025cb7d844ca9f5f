---
# folio-assistant-oycs
$schema: bean/1.0.0
title: Remove the legacy special-branch names (qa-reports, lake-cache/, fhir-ast/, state) once every remote is renamed to cat-
status: todo
type: task
created_at: 2026-10-02T18:10:08Z
updated_at: 2026-10-22T14:20:00Z
parent: folio-assistant-fs43
---

Follow-up to folio-assistant-32f6. During the cat- rename every reader and writer resolves the new name first, then the legacy name (`cat-harness/scripts/special-branches.json`). This bean removes that fallback.

## When
Not before ALL of:
1. the owner has renamed every legacy branch through the rename API — in this repository (`qa-reports`, `state`) AND in each folio repository carrying a `lake-cache/*` or `fhir-ast/*` family (e.g. litlfred/qou, litlfred/smart-trust, litlfred/smart-base);
2. one full `lake-cache-refresh` cycle has run after the last rename, so no run that started before it is still in flight;
3. `ls-remote --heads` on each of those remotes shows no legacy name.

## Done when
- [ ] each entry's `legacy` list in `special-branches.json` is empty
- [ ] the fallback is removed from every file in `MIRRORS` (`lake-cache.sh` `LEGACY_CACHE_PREFIX`, the two fetchers, produce, reseed, both restore actions, `lake-cache-refresh.yml`)
- [ ] `qa-store.ts` (arc 3fva) no longer reads the legacy `qa-reports` name
- [ ] `bun test cat-harness/scripts/tests/special-branches.test.ts` green on the new names alone

## Status (2026-10-22)
- `cat-harness/scripts/special-branches.json` and `cat-harness/scripts/tests/special-branches.test.ts` were retired on 2026-10-05 (`#2191`, bean `rva2`) and moved to `fsh-guts/scripts/special-branches.json` (`fsh-guts/scripts/special-branches.md`) when branch declarations moved into each harness's own `<instance>.json`.
- Legacy fallback readers remain in `cat-harness-tools/scripts/qa-store.ts` (`LEGACY_QA_BRANCHES = ["cat-qa-reports", "qa-reports"]`), `folio-assistant-sci/scripts/lake-cache.sh` (`LEGACY_CACHE_PREFIXES`), `fhir-harness/scripts/ig-cache.sh` (`LEGACY_CACHE_PREFIX`), and `cat-harness-tools/scripts/tests/cache-family-fallbacks.test.ts`.
- Precondition 3 (`ls-remote --heads` on every folio remote shows no legacy name) is still unmet on `litlfred/qou` (measured 2026-10-22: 15 `refs/heads/lake-cache/*` branches remain on `litlfred/qou`, 0 `cat/folio-assistant-sci/lake-cache/*`).
