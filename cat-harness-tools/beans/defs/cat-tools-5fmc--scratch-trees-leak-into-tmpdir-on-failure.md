---
# cat-tools-5fmc
$schema: bean/1.0.0
title: 'SCRATCH TREES LEAK: publish-check and ig-index:build leave multi-GB trees in os.tmpdir() when they fail or are cancelled'
status: in-progress
type: bug
priority: normal
created_at: 2026-11-06T07:40:00Z
updated_at: 2026-11-06T07:40:00Z
---

Measured 2026-11-05 in a cloud session: leaked `/tmp/publish-check-tree-*` copies (5-6 GB each) and `/tmp/ig-index-*` work directories (447 MB) filled the disk, so the next run failed with ENOSPC and leaked again.

- `scripts/publish-check.ts` `scratchCopy`: a copy that throws partway (a full disk, a FIFO) never returned its root, and the `exit` hook was registered only after it returned. SIGTERM and SIGINT (a cancelled job, a timeout) do not reach `exit`.
- fhir-harness `scripts/build-ig-indexes.ts`: the `ig-index-*` work directory it creates (when `--work` is not given) is never removed, on success or failure.

## Done when

- [ ] `scratchCopy` removes a partial copy before rethrowing; publish-check removes its copy on SIGINT and SIGTERM. Test: a copy that fails partway leaves `os.tmpdir()` empty.
- [ ] build-ig-indexes removes the work directory it created, in a `finally`, and keeps one given by `--work`. Test: fail partway, `os.tmpdir()` clean.
