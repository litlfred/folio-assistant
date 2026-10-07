---
# folio-assistant-oycs
title: Remove the legacy special-branch names (qa-reports, lake-cache/, fhir-ast/, state) once every remote is renamed to cat-
status: todo
type: task
created_at: 2026-10-02T18:10:08Z
updated_at: 2026-10-02T18:10:08Z
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
