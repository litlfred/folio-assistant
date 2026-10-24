---
# folio-assistant-oycs
$schema: bean/1.0.0
title: Remove the legacy special-branch names (qa-reports, lake-cache/, fhir-ast/, state) once every remote is renamed to cat-
status: todo
type: task
created_at: 2026-10-02T18:10:08Z
updated_at: 2026-10-24T07:40:00Z
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

## 2026-10-22 — precondition 3, measured for this repository only

`git ls-remote --heads origin` on litlfred/folio-assistant shows **no** legacy
name: no `qa-reports`, `cat-qa-reports`, `state`, `lake-cache/*` or `fhir-ast/*`
head; the QA branch is `cat/cat-harness/qa-reports` (qa-store.ts `QA_BRANCH`).
The other remotes the bean names (litlfred/qou, smart-trust, smart-base and the
folio-assistant-sci cache host) are outside this session's repository scope and
were NOT checked, so precondition 3 is half-met and the fallback stays. Session
https://claude.ai/code/session_01JkK6uP3iU2etyMbrw7v3cu.

_2026-10-24T07:40:00Z_ — Precondition 3 re-measured on litlfred/qou (`git ls-remote --heads`): **16** `lake-cache/*` heads remain, **0** `cat-lake-cache/*` and **0** `cat/folio-assistant-sci/lake-cache/*`, although `9io2` (the declaration and mirrors) is completed. The qou branches themselves were never renamed. The fallback stays until they are; renaming them is a change to qou and goes to the owner first. Session https://claude.ai/code/session_01AnAGBDDY8TMwCApxe4b3pX.
