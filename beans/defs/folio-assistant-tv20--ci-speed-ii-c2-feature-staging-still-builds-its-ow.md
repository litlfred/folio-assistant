---
# folio-assistant-tv20
$schema: bean/1.0.0
title: 'CI speed II (c2): Feature Staging still builds its own site (cis4, closed undone)'
status: todo
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T08:26:16Z
parent: folio-assistant-k3vv
---

`folio-assistant-cis4` (archived, status completed) asked that Feature Staging reuse what Code-quality gates already built. On main b3bc4d2, `feature-staging.yml` still mounts and runs `derive:publish` itself (the step "Build the derived artefacts kept off the commit"), so each PR push builds the site twice.

Filed as a follow-up rather than reopening cis4, because an archived bean must stay terminal.

## Done when
- [ ] Feature Staging reuses the gates run's derived output for the same tree, or the bean records why it cannot

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.
