---
# folio-assistant-ojcx
title: 'FOLIO STAGING: a folio in its own repository gets no STAGING build — feature-staging is not reusable and init-folio never writes it'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T21:04:36Z
updated_at: 2026-09-22T23:19:42Z
parent: folio-assistant-q4jm
---

Epic q4jm roast, finding R1, measured 2026-09-22.

- `.github/workflows/feature-staging.yml` triggers on `pull_request`, `pull_request_target` and `workflow_dispatch`. There is **no `workflow_call`**, so a folio repository cannot reuse it.
- `cat-harness/scripts/init-folio.ts` mentions staging **0** times.

So STAGING, and with it every before/after in this epic, exists only for the platform's own docs site. A DAK or L1 handbook folio lives in its own repo.

**What.** Make the staging workflow reusable (`workflow_call` with inputs for the build command and the publish ref), and have `init-folio` / `folio_init` write the caller workflow into a new folio. Coordinate with lx2s (issue #215), which owns the mechanism, and with g196 / oz5w / 1lfx, which own its open defects. This bean adds the cross-repo reach only.

## Done when
- [ ] feature-staging is callable from another repository, tested with a scratch folio. **Done differently: a NEW reusable `folio-staging.yml`**, not feature-staging made reusable (see round 1). It is callable, but **not yet run from a real folio repo**, and that run is the test still owed
- [x] `init-folio` writes the caller (`.github/workflows/staging.yml`), OFF until the author sets `build_command`. Whether `readme:sync` lists it is not checked
- [x] the ChangeSet (jwox) is emitted by the reusable workflow as `<preview>/changeset.json`, with its summary in the PR comment

## From jwox (2026-09-22)

The ChangeSet CLI exists (#981): `bun run folio-assistant-core/schemas/changeset.ts --folio <dir> --base <main sha> --head <branch sha> --out <site>/changeset.json`. The reusable workflow should publish its output beside the staging site. That is 6pfo's "staging metadata as a KG graph", so settle the path with it.

## Round 1: 2026-09-22

**A new workflow, not a refactor.** `feature-staging.yml` is 1,554 lines shaped around this repo's docs site: docs layers, TypeDoc, the KG viewer, navbar tiles and the render log. Making it reusable would put the platform's own previews at risk. So `.github/workflows/folio-staging.yml` is a thin `workflow_call` workflow that shares the SCRIPTS (staging-banner, render-log, backoff-sleep). It copies its guards together with their reasons:
- the injection-safe slug, checked by value (`fuzm`);
- refusing an empty build before any delete (`oisv`);
- replace, never overlay (`85im`);
- a branch-keyed concurrency group (`xd1s`);
- a retrying push;
- updating the preview comment in place.

**The folio owns its build.** `build_command` and `site_dir` are inputs, the same division `publish.yml` makes for `builder_image`. The platform owns the slug, banner, ChangeSet, deploy and comment.

**Found: the platform defines no site build for a DOCUMENT folio.** `publish.yml` builds a paper, through LaTeX. So `init-folio` writes the caller **off**: dispatch-only, with a build step that refuses and a note saying which line to set. The alternatives were a guessed command, which would publish a preview built by something nobody chose, or a live PR trigger, which would make every PR in a new folio red. This probably wants its own bean if no existing one covers a document folio's site build.

**Removal is deliberately absent.** Previews stay when a PR closes. Deletion is `deletion-requires-confirmation` / `plj1` territory, and the platform's own cleanup is guarded three ways. A folio's cleanup needs the same design, and has none yet.

**Owed:** a real run from a folio repository. This repo holds no folio, so the reusable workflow has not executed end to end.
