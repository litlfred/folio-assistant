---
# folio-assistant-hupw
title: 'SMART separation cutover: retire smart-trust, smart-base, smart-immunizations, smart-ig to fsh-guts/separated and repair main'
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T19:10:49Z
updated_at: 2026-10-06T19:11:10Z
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
