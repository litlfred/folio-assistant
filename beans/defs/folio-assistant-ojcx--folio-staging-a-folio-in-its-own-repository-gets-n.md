---
# folio-assistant-ojcx
title: 'FOLIO STAGING: a folio in its own repository gets no STAGING build — feature-staging is not reusable and init-folio never writes it'
status: todo
type: task
created_at: 2026-09-22T21:04:36Z
updated_at: 2026-09-22T21:04:36Z
parent: folio-assistant-q4jm
---

Epic q4jm roast, finding R1, measured 2026-09-22.

- `.github/workflows/feature-staging.yml` triggers on `pull_request`, `pull_request_target` and `workflow_dispatch`. There is **no `workflow_call`**, so a folio repository cannot reuse it.
- `cat-harness/scripts/init-folio.ts` mentions staging **0** times.

So STAGING, and with it every before/after in this epic, exists only for the platform's own docs site. A DAK or L1 handbook folio lives in its own repo.

**What.** Make the staging workflow reusable (`workflow_call` with inputs for the build command and the publish ref), and have `init-folio` / `folio_init` write the caller workflow into a new folio. Coordinate with lx2s (issue #215), which owns the mechanism, and with g196 / oz5w / 1lfx, which own its open defects. This bean adds the cross-repo reach only.

## Done when
- [ ] feature-staging is callable from another repository, tested with a scratch folio
- [ ] `init-folio` writes the caller, and `readme:sync` lists it
- [ ] the ChangeSet (jwox) is emitted by the reusable workflow, not only by this repo's

## From jwox (2026-09-22)

The ChangeSet CLI exists (#981): `bun run folio-assistant-core/schemas/changeset.ts --folio <dir> --base <main sha> --head <branch sha> --out <site>/changeset.json`. The reusable workflow should publish its output beside the staging site. That is 6pfo's "staging metadata as a KG graph", so settle the path with it.
