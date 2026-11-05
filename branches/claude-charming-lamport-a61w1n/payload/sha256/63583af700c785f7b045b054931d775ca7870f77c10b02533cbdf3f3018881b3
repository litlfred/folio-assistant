---
# folio-assistant-x38u
$schema: bean/1.0.0
title: state:mount rewrites the .gitignore block from stale layer mounts without --id
status: in-progress
type: bug
created_at: 2026-11-05T13:21:54Z
updated_at: 2026-11-05T13:21:54Z
parent: folio-assistant-4j43
---

Every fresh folio-assistant session: the container's instance mounts are older than index.lock.json (mount-from-lock leaves them untouched), and a plain `bun run cat state:mount` rewrites the root .gitignore 'state mounts' block from those stale declarations, dropping /who-iris/test/attestations/** (declared by the pinned who-iris 35f23d3, absent from the stale on-disk copy). The staleLayerMounts guard (bean 792f) only applied with --id. Fix in cat-harness-tools state-mount.ts: apply the guard on every run. The committed line is correct and stays.

## Done when
- [x] cat-harness-tools: syncStateIgnores is skipped when layer mounts do not match the lock, with or without --id; test added (cat-harness-tools#1515)
- [x] PR merged in cat-harness-tools (fd997d6, 2026-11-05)
- [ ] reaches folio-assistant through the next re-pin train (not done here)

PR: https://github.com/litlfred/cat-harness-tools/pull/1515
