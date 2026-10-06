---
# folio-assistant-hupw
title: 'SMART separation cutover: retire smart-trust, smart-base, smart-immunizations, smart-ig to fsh-guts/separated and repair main'
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T19:10:49Z
updated_at: 2026-10-06T19:27:00Z
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
