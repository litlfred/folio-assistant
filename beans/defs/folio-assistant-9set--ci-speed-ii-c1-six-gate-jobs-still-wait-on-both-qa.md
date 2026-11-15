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

_2026-11-06T04:20Z_ (session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF): landed folio-assistant#2965 (`c37177e`, `.github/scripts/bundle-cache.sh`: the QA working copy and publish-time pages are keyed on a digest of the tree, the exact tool versions, every mounted state-branch tip and the qa-reports head, and reused from a trusted run that recorded the same digest) and #2966 (`d2f6726`: publish-pages folded into the qa-working-copy job, one setup and one runner wait fewer per run; `needs.publish-pages.*` → `needs.qa-working-copy.*`). Owner cards Q3 (merge the jobs), Q6 (land both), Q8 (merged by this session). Measured: misses cost 1–3 s per job; a hit needs the same tree AND unmoved state branches, which move every few minutes, so hits will be rare until keys narrow to traced reads (CI speed 14 is porting this onto `cached-step`). The QA working copy is not byte-reproducible across builds of one commit (17f6fa0a… vs 7ba8341b… at eaa6558), filed with CI speed 14's determinism audit. Main-push cache verdict: pending (run on d2f6726).
