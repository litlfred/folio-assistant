---
# folio-assistant-9set
$schema: bean/1.0.0
title: 'CI speed II (c1): six gate jobs still wait on both qa-working-copy and publish-pages (cis1 part b, closed undone)'
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T11:19:01Z
parent: folio-assistant-k3vv
---

`folio-assistant-cis1` (archived, status completed) had two parts. Part a, the mount cache, is done (`CAT_MOUNT_CACHE_DIR` in `mount-from-lock.ts` and the workflows). Part b was not: on main b3bc4d2, `code-quality-gates.yml` still has six jobs whose `needs` hold **both** `qa-working-copy` and `publish-pages`:

- typescript-test
- gates-kg
- gates-docs
- gates-unrun
- e2e-shard
- skill-registration-chain

Filed as a follow-up rather than reopening cis1, because an archived bean must stay terminal (`check:bean-archive`).

## Done when
- [x] each of the six jobs either drops the `needs` it does not read, or carries a comment saying which output it reads

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.
