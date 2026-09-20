---
# folio-assistant-gpdo
title: 'COMPILED-ARTEFACT CACHING: .olean for mathlib, and the same shape for sushi/FHIR -> AST'
status: todo
type: task
priority: high
created_at: 2026-09-20T09:01:32Z
updated_at: 2026-09-20T09:01:32Z
parent: folio-assistant-kupb
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
