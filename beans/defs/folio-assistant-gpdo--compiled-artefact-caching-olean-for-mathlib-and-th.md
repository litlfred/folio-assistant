---
# folio-assistant-gpdo
title: 'COMPILED-ARTEFACT CACHING: .olean for mathlib, and the same shape for sushi/FHIR -> AST'
status: completed
type: task
priority: high
created_at: 2026-09-20T09:01:32Z
updated_at: 2026-09-23T02:45:00Z
parent: folio-assistant-5a3l
---

Owner, 2026-09-20: 'noting cacheing olean stragety for "compiled/compuable" data sources whchich will apply to sushi/fhr assets -> AST in planned FHIR publication iterartive issue.'

A THIRD KIND OF REMOTE CONTENT, and `materialization.ts` currently has two purposes (`working`, `archival`) with no room for it. A COMPILED artefact is neither:
- it is DERIVED, so it is not archival — the source is elsewhere and is what you would rebuild from;
- it is EXPENSIVE, so it is not merely working — the whole reason to hold it is that regenerating costs minutes or hours;
- it is INVALIDATED BY ITS INPUTS, which neither other purpose models. A `.olean` is valid for one Lean toolchain and one source revision; an AST from sushi is valid for one FSH corpus and one SUSHI version.

So the fixity question inverts. For an archive, fixity asks 'are these the bytes we stored'. For a compiled artefact it asks 'was this built from the inputs we have NOW' — a digest of the INPUTS, not of the file. A cache that passes a self-digest and was built from stale inputs is exactly the failure mode, and it passes every check this repository currently has.

THIS REPOSITORY ALREADY RUNS ONE, UNNAMED: `.github/workflows/lake-cache-refresh.yml` and `lean-build-sidecar.yml`. Whatever policy they encode is in YAML and in nobody's skill.

FHIR is the second instance and it is COMING, not hypothetical — the owner names 'sushi/fhr assets -> AST in planned FHIR publication iterative issue'. Two instances is what makes it a shape rather than a Lean detail.

## Done when
- A third purpose (or a distinct node kind — decide, do not default) covering compiled/computable artefacts.
- Validity expressed against INPUTS: toolchain version, source revision, input digest.
- A stale cache is DETECTED rather than trusted, and the detection runs before use, not on a schedule.
- lake-cache-refresh's existing behaviour is read and either adopted or explicitly superseded.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `5a3l`.** Compiled-artefact caching (.olean for mathlib) is the same shape as 54rk and has nothing to do with IRIS.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.

---

## Summary of Changes — 2026-09-23

Owner's pick: **"Third purpose"** (over a new node kind).

| Done-when item | Evidence |
|---|---|
| a third purpose covering compiled artefacts (decided, not defaulted) | `MATERIALIZATION_PURPOSES` gains `compiled` in `folio-assistant-core/schemas/materialization.ts` |
| validity expressed against INPUTS | `CompiledInputsSchema`: `toolchain` and `sourceRevision` required, `inputDigest` (sha256) optional. Required on a compiled copy and refused on any other. A compiled copy cannot discharge `sourceLoss`. |
| a stale cache is DETECTED, before use, not on a schedule | `compiledValidity(record, current)` returns `valid`, `stale-inputs` (naming each differing input) or `cannot-tell`, which is never a pass. `freshness()` reports a compiled copy as `input-bound`, so `cache:index` never lists it as a no-expiry candidate. |
| `lake-cache-refresh` read, and adopted or superseded | **Adopted.** `skills/folio-paper-adapter/lean-cache-restore.md` §"This cache is a `compiled` materialization" maps: branch toolchain → `inputs.toolchain`, Lake root commit → `sourceRevision`, `.trace` → per-module digests, keep-2 → retention. sushi/FHIR is recorded as the second instance. |

Tests: `materialization-compiled.test.ts` has 13 tests, and `cache-index.test.ts` gained 1. Existing materialization, remote-content and fixity tests are unchanged and pass.
