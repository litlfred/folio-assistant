---
# folio-assistant-0hi8
title: 'DEPLOY: a local HTTP server that serves a rendering with its declared media types'
status: todo
type: feature
priority: high
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T08:55:36Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "no github,
local git only. tools (several options) to run lightweight server locally for
skill of hosting content (using mime time data whch github tool cant)" and
"github on private repo so gh-pages not avaialbe. use local server skill."

## This hole is already documented, deliberately

`skills/folio-core/serving-renderings.md` settles the durable half — the four
endpoints under an instance's stub, the media type each declares, and the three
enforcement states per host. Its closing section reads, verbatim:

> **How to run a server.** No tool is specified here — the media types and the
> per-host enforcement story are the durable part, and a server that reads them
> is an implementation of this, not a prerequisite for it.

That was the right call then and is what makes this bean cheap now: the contract
exists, and what is missing is a Tool node satisfying it.

## Why it is load-bearing rather than a convenience

The same skill records that **GitHub Pages cannot be made to serve
`application/ld+json`** — no `.htaccess`, no headers file, no per-file
configuration. So a strict JSON-LD processor may refuse the graph this project
publishes, and the skill already names the remedy as "the local deployment."
Two of #363's topologies (local-git-only, private-repo) have no Pages at all, so
for them the local server is not a remedy — it is the only publication host.

## What to build

A **Tool node** (per `skills/folio-core/skills-and-tools.md`), not a bespoke
server. "Several options" in #363 is the requirement: the skill states what a
conforming server must do, and more than one tool may satisfy it.

The conformance obligations are already written in `serving-renderings.md`:
read the declared media type rather than guessing from the extension; serve
`<stub>/` as a directory index so the extensionless URL resolves; serve
`<stub>.json` byte-identically to `<stub>.jsonld`.

## Done when

- [ ] a `requirements/*.json` entry states the obligations, `satisfiedBy` the
      tool node(s)
- [ ] at least two tools satisfy it, because one is an assertion and two is a
      demonstration — the same argument `4dbr` makes about a second forge
- [ ] a test fetches every endpoint and asserts the `Content-Type`, so the
      claim is checked rather than described

## Not doing

Deciding which server. That is the point of there being several.
