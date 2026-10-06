---
# folio-assistant-1lfx
title: 'DEPLOY: STAGING must report which host rendered it, not assume gh-pages'
status: todo
type: task
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T10:24:03Z
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

## CORRECTION, 2026-09-19 — most of this is already built

Measured on `main` before starting, and the bean's premise is largely
wrong. I was one step from adding a `publicationHost` field to the
instance declaration on the strength of it.

`content/pipeline/readme-toc.ts` already carries the whole model:

- `readme.linkStyle` in `harness.config.json`, three values —
  `blob` | `pages` | `raw` — each documented with **who can follow its
  links**
- the default is **`blob`**, chosen *because* it works on a private repo:
  it follows the viewer's GitHub session and renders PDFs inline
- `pagesBaseUrl` is optional and every read is guarded
  (`cfg.pagesBaseUrl ? … : undefined`) — the third state, already there
- selecting `pages` or `raw` prints an operator note naming who CANNOT
  follow those links, and says to set `blob` for a private folio

So "no code path composes a github.io URL for this purpose" is already
true of the README subsystem. The one path that does compose one,
`scripts/pages-bootstrap.ts:135`, exists to bootstrap Pages and is correct
by construction.

## What is actually left

Not a schema field. Two smaller things, and the first may be the whole bean:

1. **The AGENT's report has no source of truth.** When a session says "here
   is your staging URL", it composes that sentence itself — nothing reads
   `linkStyle` or a host declaration. That is a SKILL change, not code.
2. `linkStyle` answers "how do I link to a published artefact", which is
   not quite the proposal's `publication host` axis (`github-pages` |
   `local-server` | `jurisdiction-endpoint` | `none`). Whether those
   should be unified, or stay two facts, is a design question — and with
   `serve-rendering` now existing, `local-server` is a real value that
   `linkStyle` cannot express.

**Put to the BA rather than decided here.** Building the field would have
been inventing a second answer next to a working one, which is the drift
this repo keeps paying for.

## Status

Back to **todo**, scope reduced. Not blocked on anything but the question
above, and that question does not block any sibling bean.
