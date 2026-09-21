---
# folio-assistant-0hi8
title: 'DEPLOY: a local HTTP server that serves a rendering with its declared media types'
status: in-progress
type: feature
priority: high
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T10:04:45Z
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

- [x] a `requirements/*.json` entry states the obligations, `satisfiedBy` the
      tool node(s)
- [ ] at least two tools satisfy it, because one is an assertion and two is a
      demonstration — the same argument `4dbr` makes about a second forge
- [x] a test fetches every endpoint and asserts the `Content-Type`, so the
      claim is checked rather than described

## Not doing

Deciding which server. That is the point of there being several.

**Claimed 2026-09-19**, branch `claude/brave-hypatia-r820sf`, after the owner accepted the axes.

## Measured before starting

- Nothing in `tools/` satisfies `serving-renderings` — grep over
  `tools/` and `skills/requirements/` returns zero. The hole the skill
  declares is real and still open.
- **No media-type table exists anywhere in code.** `grep` for
  `ld+json`/`schema+json` across all `.ts` returns nothing. The table
  lives only in the skill's prose, so every consumer that ever serves one of
  these must re-derive it.
- `renderingPath()` and `artefactStub()` in `schemas/cat-harness.ts`
  already own "where a rendering lives"; the media type is the same kind of
  fact and belongs beside them.

## The assumption I checked and had to drop

I expected to find that a general-purpose static server serves `.jsonld`
as `application/octet-stream`. **It does not.** Measured:

    python3 mimetypes: .jsonld -> application/ld+json
    Bun.file().type:   .jsonld -> application/ld+json

Extension inference gets `.jsonld` and `.json` RIGHT. What it gets wrong
is **`.schema.json` -> `application/json`**, because `.json` is the
suffix it matches and nothing knows the compound extension means a schema.

So the requirement is narrower and sharper than "generic servers cannot do
this": it is longest-extension-first resolution plus one compound type that
no OS table carries. Claiming the broader thing would have been encoding a
rule against a working setup — the trap recorded the same day.

## Summary of Changes, 2026-09-19

- `RENDERING_MEDIA_TYPES` + `renderingMediaType()` in
  `schemas/cat-harness.ts`, beside `renderingPath()` — where a rendering
  LIVES and what it IS are the same kind of fact, and the table existed
  nowhere in code before.
- `scripts/serve-rendering.ts` (`bun run serve:rendering`) — the server the
  skill deliberately left unspecified.
- `skills/requirements/serving-a-rendering.json` — seven statements, so a
  second implementation is checkable against the requirement rather than
  against this one's source.
- Tool node `serve-rendering`; new `Port` I/O type (0 admitted, so tests
  can bind a free port instead of racing on a fixed one).
- `serving-renderings.md` §"What this skill does not cover" replaced by
  §"Running one".
- 18 tests, real HTTP against a bound socket.

## What the tests found in my own code

**A symlink inside the served root pointing outside it returned 200.**
`resolve()` is string arithmetic and never touches the filesystem, so the
lexical containment check passed a perfectly clean URL while the escape
happened in the link. Fixed by comparing `realpathSync` of target and root.
That is now requirement `contained`, and it is NOT inherited from the
skill — it is there because the reference implementation failed it.

Two traversal assertions were also wrong: they demanded `resolveWithin`
return `undefined` for `/../../etc/passwd`, which it does not and need
not — a URL pathname always starts with `/`, so `normalize` absorbs the
`..` against the root. They pinned a mechanism while missing the case that
was actually broken. Rewritten to assert the property.

## Done when — the evidence for the ticks above

*Ticked IN PLACE 2026-09-21, bean `sfhr`. This section already carried the
verdicts; the canonical list above did not, so every reader and every tool
consulting it saw an untouched bean. The reasoning below is the author's and
is unchanged — only the boxes moved.*

- [x] a `requirements/*.json` entry states the obligations
- [ ] **at least two tools satisfy it** — NOT done, and deliberately.
      The obvious second candidate is a generic static server, and it fails
      `compound-extension-wins`: every OS table resolves `.schema.json` to
      `application/json`. Caddy configured per-path would satisfy it and is
      not installed here, so declaring it would assert conformance nobody
      measured. The "one is an assertion, two is a demonstration" argument
      still stands and this box stays open.
- [x] a test fetches every endpoint and asserts the `Content-Type`

## Correction to this bean's own premise

Its body says a local server is needed because Pages cannot serve
`application/ld+json`. True of Pages, but I had also assumed a generic
LOCAL server would get `.jsonld` wrong. Measured: python3 `mimetypes` and
`Bun.file().type` both resolve it correctly. The real gap is one row,
`.schema.json`. Recorded so the next reader does not repeat the
overstatement.
