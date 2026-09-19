---
# folio-assistant-1lfx
title: 'DEPLOY: STAGING must report which host rendered it, not assume gh-pages'
status: todo
type: task
priority: high
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T09:56:19Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "make sure
STAGING knows where rendering happes (ghpages, local server) so can tell user
correctly".

## The defect, stated as what goes wrong

An agent finishing a change tells the author where to look. Today that sentence
is composed on the assumption that rendering went to GitHub Pages. On a private
repository there is no Pages; on a local-git-only topology there is no forge at
all. In both cases the agent hands over a URL that **does not resolve**, and the
author — who types with difficulty — spends the round-trip finding that out.

This is the failure `content/pipeline/readme-links.ts` was written for one level
down: *composing* a link instead of *resolving* one. The README audit already
refuses to compose; the staging report still does.

## The third state applies here too

There are three answers, not two, and the third is the one that gets lost:

1. rendered to GitHub Pages at `<url>`
2. rendered to a local server at `<url>`
3. **could not determine where this rendered** — say so, and do not guess

Reporting (3) as (1) is exactly the `ci-health` "could not check rendered as
green" defect and the `readme-sections` "directory absent rendered as no
simulators" defect. Both are recorded in `AGENTS.md` as already paid for.

## Route

The render target is a property of the topology, so it is read from the
instance's declaration, not inferred from the presence of a git remote. Which
field, and whether it belongs in `harness.json` or the harness declaration, is
a design question for the parent epic — hence the dependency below.

## Done when

- [ ] the staging report names its host and its URL from a declaration
- [ ] "could not determine" is a distinct, reachable state with a test
- [ ] no code path composes a `github.io` URL from a git remote for this purpose

## Depends on

The parent epic's publication-host axis. Until the set of hosts is agreed there
is nothing for the declaration to range over.

## Related

`folio-assistant-g4dv` (STAGING compare-with-main must deep-link, issue #248)
and `folio-assistant-lx2s` (feature-branch staging under gh-pages, issue #215)
are both about staging and both assume Pages. Whoever takes this should check
whether either needs the host to be a variable.

**Unblocked 2026-09-19** — the owner accepted the axes ("yes on axes"), so the dependency stated above is discharged. Implement against the vocabulary in `docs/proposals/deployment-topologies.md`.
