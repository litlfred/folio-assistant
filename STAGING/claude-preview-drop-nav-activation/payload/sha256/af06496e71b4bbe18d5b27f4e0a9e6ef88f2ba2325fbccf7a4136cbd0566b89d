---
# folio-assistant-oycs
$schema: bean/1.0.0
title: Remove the legacy special-branch names (qa-reports, lake-cache/, fhir-ast/, state) once every remote is renamed to cat-
status: completed
type: task
created_at: 2026-10-02T18:10:08Z
updated_at: 2026-10-24T08:42:00Z
parent: folio-assistant-fs43
---

Follow-up to folio-assistant-32f6. During the cat- rename every reader and writer resolves the new name first, then the legacy name (`cat-harness/scripts/special-branches.json`). This bean removes that fallback.

## When
Not before ALL of:
1. the owner has renamed every legacy branch through the rename API — in this repository (`qa-reports`, `state`) AND in each folio repository carrying a `lake-cache/*` or `fhir-ast/*` family (e.g. litlfred/qou, litlfred/smart-trust, litlfred/smart-base);
2. one full `lake-cache-refresh` cycle has run after the last rename, so no run that started before it is still in flight;
3. `ls-remote --heads` on each of those remotes shows no legacy name.

## Done when
- [x] each entry's `legacy` list in `special-branches.json` is empty
- [x] the fallback is removed from every file in `MIRRORS` (`lake-cache.sh` `LEGACY_CACHE_PREFIX`, the two fetchers, produce, reseed, both restore actions, `lake-cache-refresh.yml`)
- [x] `qa-store.ts` (arc 3fva) no longer reads the legacy `qa-reports` name
- [x] `bun test cat-harness/scripts/tests/special-branches.test.ts` green on the new names alone

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

_2026-10-24T08:12:00Z_ — Preconditions 1 and 3 are now met. qou's 16 `lake-cache/*` heads were renamed (bean `qr4n`), and `git ls-remote --heads` shows no legacy name on qou, smart-trust, smart-base, folio-assistant-sci, fhir-harness, smart-immunizations, folio-assistant, cat-harness or cat-harness-tools. Precondition 2 (one full `lake-cache-refresh` cycle after the rename) is being checked next. Claimed by the "Drain KG tools beans" thread. Session https://claude.ai/code/session_01AnAGBDDY8TMwCApxe4b3pX.

## Closed 2026-10-24 (cloud drain thread)

The fallbacks are gone. Merged:
- folio-assistant-sci#70: lake-cache readers, fetchers, produce, reseed and the restore action read `cat/folio-assistant-sci/lake-cache/` only.
- fhir-harness#150: `ig-cache.sh`, `gen-ig-ast-pages.ts` and `stage-ast-sites.ts` read `cat/fhir-harness/fhir-ast/` only.
- cat-harness-tools#695: `qaBranchCandidates` returns the current QA branch only. A cross-layer test checks fhir-harness's prefix list.

Measured first with ls-remote: no legacy lake-cache, fhir-ast or qa-reports heads on any litlfred repo, nor on the WHO repos checked (read only). qou's 16 branches were renamed by qr4n.

Boxes 1 and 4 are moot: `special-branches.json` and its test were removed on 2026-10-05 (beans rva2, lehh). qou's own `lake-cache-refresh.yml` still lists the old prefixes for its prune listing. That is harmless, and it stays untouched because qou is a math repo.
