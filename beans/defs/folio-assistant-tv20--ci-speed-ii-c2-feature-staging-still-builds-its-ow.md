---
# folio-assistant-tv20
$schema: bean/1.0.0
title: 'CI speed II (c2): Feature Staging still builds its own site (cis4, closed undone)'
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-09T14:20:00Z
parent: folio-assistant-k3vv
---

`folio-assistant-cis4` (archived, status completed) asked that Feature Staging reuse what Code-quality gates already built. On main b3bc4d2, `feature-staging.yml` still mounts and runs `derive:publish` itself (the step "Build the derived artefacts kept off the commit"), so each PR push builds the site twice.

Filed as a follow-up rather than reopening cis4, because an archived bean must stay terminal.

## Done when
- [x] Feature Staging reuses the gates run's derived output for the same tree, or the bean records why it cannot

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T08:33:40Z_ — Claimed by claude/ci-skip-main-only-reruns — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-11-06T04:20Z_ (session https://claude.ai/code/session_01VQDpPd7y4nwxjHFm66CMKF): landed folio-assistant#2965 (`c37177e`, `.github/scripts/bundle-cache.sh`: the QA working copy and publish-time pages are keyed on a digest of the tree, the exact tool versions, every mounted state-branch tip and the qa-reports head, and reused from a trusted run that recorded the same digest) and #2966 (`d2f6726`: publish-pages folded into the qa-working-copy job, one setup and one runner wait fewer per run; `needs.publish-pages.*` → `needs.qa-working-copy.*`). Owner cards Q3 (merge the jobs), Q6 (land both), Q8 (merged by this session). Measured: misses cost 1–3 s per job; a hit needs the same tree AND unmoved state branches, which move every few minutes, so hits will be rare until keys narrow to traced reads (CI speed 14 is porting this onto `cached-step`). The QA working copy is not byte-reproducible across builds of one commit (17f6fa0a… vs 7ba8341b… at eaa6558), filed with CI speed 14's determinism audit. Main-push cache verdict: pending (run on d2f6726).

_2026-11-09T14:20:00Z_ — Completed: [`litlfred/folio-assistant#2953`](https://github.com/litlfred/folio-assistant/pull/2953) (`ci(feature-staging): reuse the gates' QA working copy in the preview when it is ready (bean tv20)`) merged to `main` at [`bef2b0b1a6dafbd5ed558777f1d968b2019ad849`](https://github.com/litlfred/folio-assistant/commit/bef2b0b1a6dafbd5ed558777f1d968b2019ad849) (`2026-11-08T18:29:09Z`), reusing the gates run's QA working copy in `feature-staging.yml` when ready for the same tree.
