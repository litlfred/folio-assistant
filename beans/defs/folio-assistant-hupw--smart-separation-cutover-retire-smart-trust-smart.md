---
# folio-assistant-hupw
title: 'SMART separation cutover: retire smart-trust, smart-base, smart-immunizations, smart-ig to fsh-guts/separated and repair main'
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T19:10:49Z
updated_at: 2026-10-06T19:43:03Z
parent: folio-assistant-n3ni
---

Stage 13 / F of n3ni. Owner 2026-10-06 (confirmed twice): 'cutover dirs should go to fsh-guts', then 'All three now'. Content lives in forks litlfred/smart-trust, litlfred/smart-base, litlfred/smart-immunizations (branch claude/seed-smart-base). smart-ig retired with them: it is only the waypoint between smart-base and the two IGs, and its needs:[smart-base] cannot resolve once smart-base is gone.

## Done when
- [ ] smart-trust/, smart-base/, smart-immunizations/, smart-ig/ and their root smart-*.config.json relocated to fsh-guts/separated/<name>/ with a note (movedFrom, movedOn, repository, matching commit), pushed via state:push
- [ ] orphaned open PRs recorded here and in the PR
- [ ] main repaired: needs, scripts, CI, site composition, tests, generated docs no longer depend on them
- [ ] every removed gate named in the PR, with why
- [ ] bun run gates green on the branch; draft PR CI green



## Holder
Claimed 2026-10-06 by session_01EcBv3uwKYcnNbCC6BcPG92 on branch claude/cutover-smart-to-fsh-guts.



## Scope changes from the owner (2026-10-06, relayed by the coordinator; quoted on #2320, comment 6023794862)
- 'smart-immz, smart-trust, smart-base', '1', 'leave smart-ig for now.... that will be ingesteed and deprecated'. **smart-ig is NOT retired.** It was moved and then reversed in the same session: fsh-guts cf210f4c235 moved it and e62ece34ac2 put it back; on main it never left a commit.
- smart-* gets the same as who-iris: each fork stays on folio-assistant's site through a REMOTE SUBSCRIPTION or MOUNT (beans 0mpw #2326, g8jp #2324, w0at S8), with no submodules. **Site composition is repointed, never removed.** The `needs` edges and configs become subscriptions, not removals.
- #2307 (0r7u) merges FIRST. After it merges, merge origin/main and re-relocate smart-base so the frozen copy carries #2307's changes.

## Progress
- [x] relocated: fsh-guts `cat/cat-harness/fsh-guts` at e62ece34ac2 holds separated/smart-base (3918 + config), smart-trust (2311 + config), smart-immunizations (1533), and three notes. Main commit 5169ebee12e.
- [x] removed the content-only gates smart-base:{document-kinds,smart-kg-l1,dth-terms,diig-figure}:check (649fd175b05)
- [ ] BLOCKED on #2326: no remote-mount fetcher or materialiser exists yet, so smart-ig's needs:[smart-base] and site composition cannot resolve. The PR stays draft.
- [ ] after #2307 merges: re-relocate smart-base

## Orphaned open PRs (measured 2026-10-06)
- #2307: modifies 1146 files under these dirs. It is sequenced first.
- #2189: modifies smart-base/scripts/gen-dak-components-figure.test.ts



## Gate inventory without the mount (bun run gates, 2026-10-06, head 649fd175b05)
`gates` refused to run (exit 2): `qa:working-copy` failed because three qa:refresh writers failed. Each one traces to the absent instances, and none is a defect to repair on main:
- `p2:refusals`: 'smart-trust/fhir-artifact-index/index.json does not exist'.
- `skill:register` → `skills:docs`: '10 page(s) in the output directory were produced by NO source'. These are smart-base skills' generated pages. Regenerating them away would remove pages from the site, which the owner forbade, so they are left until the mount restores their source.
- `check:wireframes`: visualiser refs into smart-base, smart-trust and smart-immunizations docs are undeclared.
- Every overlay warns: needs smart-base / smart-trust / smart-immunizations (root) and smart-base (smart-ig) match no instance.
- audit:coverage: check:fhir-harness-exclusions 'none of its 1 script path(s) could be read'.
All of these are expected to clear unchanged once a remote mount lands each fork's smart-base/ at the old local path.



## For the resume (after #2307 merges and #2326 lands). Not acted on yet.
From #2326's author (0mpw), relayed by the coordinator:
- **Entry shape:** in folio-assistant.json, `remoteMounts: [{ harness, repository: "litlfred/<fork>", ref: <full 40-char sha>, overrides? }]`. Pins:
  - smart-base 8e16a06d22fe0b06edebb29ba5c5504bce12cb15
  - smart-trust 02cb3002ffeb15b8836523d23fcca411325434bc
  - smart-immunizations fa0b4071ff9f4902dc5371c17caf60f53aaac0cf
- **Lookup:** `findInstance` finds `<dir>/<name>.json` under any top-level directory, so `smart-base/smart-trust.json` is found for smart-trust.
- **Mount path:** defaults to the fork declaration's `livesAt.path`, else the directory it was found in. Overrides `{ "smart-trust": { path: "smart-trust" } }` and `{ "smart-immunizations": { path: "smart-immunizations" } }` avoid colliding at `smart-base/`; `upstreamRoot` stays `smart-base/`.
  - **Measured 2026-10-06 at those pins:** each fork's `livesAt.path` already reads `smart-trust`, `smart-immunizations` and `smart-base`, with `livesAt.repository` still `litlfred/folio-assistant`. So the default may already land correctly, but that rests on a field that is stale in the fork. Set the overrides explicitly anyway, so the mount does not depend on it.
- **needs:** smart-ig and cat-openapi stay local; smart-base needs fhir-harness, also local.
- **Before wiring:** `bun run mount:remote --plan --instance <dir>` on #2326's branch. It writes nothing.
- A separate PR is making `kg:subscribe` honour `upstreamPath`, so the subscriptions can be recorded as well (blocker 3).
