---
# folio-assistant-lx2s
title: 'Feature-branch staging under gh-pages (issue #215)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-17T22:29:53Z
updated_at: 2026-09-19T00:41:01Z
---


_2026-09-19T00:41:01Z_ — Verified RESOLVED, 2026-09-19 on main at 17dc1e6. .github/workflows/feature-staging.yml exists with 32 STAGING references and is demonstrably working — it deployed previews for PRs #298 and #308 in this session, each commenting the STAGING URL. Note this bean has an EMPTY body: title and issue #215 only, no statement of what 'done' means, so this verification is against observed behaviour rather than against the bean's own gate. NOT closing it — not my bean to resolve.

_Body written 2026-09-19, same situation as `t8g3`: this bean was a title and an
issue number. Reconstructed from
[issue #215](https://github.com/litlfred/folio-assistant/issues/215) and the
workflow on disk._

## Correction to my own note above

I noted this bean RESOLVED earlier today on the strength of
`feature-staging.yml` working — it deployed previews for PRs #298 and #308.
**That was too fast.** Issue #215 is still **open**, reopened after
[PR #217](https://github.com/litlfred/folio-assistant/pull/217) merged, so the
owner does not consider it finished. The mechanism runs; the issue's scope is
wider than the mechanism.

## What the owner asked for

- Feature branches render at `<owner>.github.io/<instance>/STAGING/<branch>/`.
  **Done** — `feature-staging.yml` does exactly this, with cleanup on merge or
  close.
- **All rendered content stamped with the commit sha**, so a reader can tell
  whether what they are looking at matches main, has been deployed, or is
  stale. Partially done: the injected banner carries branch and sha, and the
  KG export is stamped, but "all rendered content" is a stronger claim than a
  banner on HTML pages.
- Staging is **the place reviewers retrieve rendered changed content for
  comparison against main** during publication review. The deep-link half of
  this landed as bean `g4dv`.
- **BPMN documenting the skills and workflow per SOP.** Not evident.

The issue's worked scenario is the acceptance test worth holding it to: an
author changes an immunization schedule, the agent helps with narrative blocks
and deterministic logic and surfaces downstream implications, the guidance
review committee compares before and after on STAGING, approves, and only then
does the change merge and publication begin.

## Todo
- [ ] establish what "all rendered content is stamped" covers beyond the HTML banner
- [ ] BPMN for the feature-branch review SOP
- [ ] walk the issue's immunization-schedule scenario end to end and record where it breaks

## Done when
Issue #215 can be closed by its author.
