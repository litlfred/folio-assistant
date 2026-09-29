---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Serving a rendering'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/serving-renderings.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/serving-renderings.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/serving-renderings.md){: .fa-edit-source }

{% raw %}
# Serving a rendering — endpoints, MIME types, and what each host can enforce

A **rendering** is what an instance publishes about itself. Running it produces
**one or more endpoints under that instance's stub**, and every endpoint has a
media type that says what it is.

This skill is about the second half. The rendering already knows what it
produced; what keeps going wrong is that the *serving* forgets to say so, and a
`.jsonld` arrives at a client as `text/plain`.

## One stub, several endpoints, per instance in the tree

`artefactStub()` in `schemas/cat-harness.ts` is the stem: `stub` when declared,
otherwise `name`. Every artefact an instance publishes is named with it, so a
reader who knows the repository knows the filename.

The dependency tree is **a set of overlaying instances**, and each renders under
its own stub. That is the point of the stub being per-instance rather than
per-repository: after the split, `folio-assist-core` depending on
`cat-harness` means both are present, and both publish.

```
<base>/<stub>.jsonld             the knowledge graph        application/ld+json
<base>/<stub>.json               the same bytes             application/json
<base>/<stub>.schema.json        its declaration's schema   application/schema+json
<base>/<stub>/                   the viewer                 text/html
```

So `…/folio-assistant/harness.jsonld` is the *cat-harness* instance's
rendering, served from a tree whose root happens to be `folio-assistant`. A
consumer asking for one instance's graph must not be handed another's because
the paths collided.

**They sit at the base, not in a subdirectory.** An instance's repository IS its
declaration that it holds a graph — `<name>.json` at the root says which
graphs are here — so there is nothing left for a `kg/` segment to distinguish it
from, and the stub is already doing the separating that a directory would have
been doing. The renderings lived under `kg/` until 2026-09-19 and were moved.

**`<stub>/` is a directory because an extensionless URL has to be.** GitHub
Pages resolves `<base>/<stub>` only to a directory index, so the viewer is what
makes the bare stub openable. It reads `../<stub>.jsonld` — its PARENT, not its
sibling, which is the one thing about it that changed with the layout.

**One function computes all of this**, `renderingPath()` in
`schemas/cat-harness.ts`. The path was written out in six template literals
across two exporters, a type vocabulary and two workflows — five of them
minting an `$id`, which is an identity rather than a link. Moving the
renderings meant editing all six, and the sixth was found only because 95
published `schema` refs pointed at a URL that 404s. A path a consumer
dereferences is not a string to type twice.

## Every endpoint declares its media type

The declaration is part of the rendering, not of the server. A server is one
consumer of it; an MCP server is another; a `Link:` header generator is a third.
Writing the type at each of them is three places to disagree.

| extension | media type | why not the obvious one |
|---|---|---|
| `.jsonld` | `application/ld+json` | **not** `application/json`. A JSON-LD processor keys off this type to know the document carries a `@context` |
| `.schema.json` | `application/schema+json` | `application/json` parses, but loses that it is a schema |
| `.json` | `application/json` | |

## What each host can enforce — three states, and they are not degrees

**A local HTTP deployment enforces it.** It reads the declared type and sets
`Content-Type`. This is where the declaration is honoured exactly.

**An MCP server enforces it.** When it serves a rendered artefact it uses the
declared default media type rather than guessing from the extension — the
declaration is right there, and guessing is how `.jsonld` becomes
`application/octet-stream`.

**GitHub Pages does not, and cannot be made to.** Pages serves by its own
extension table with no per-file configuration: no `.htaccess`, no headers
file, no way to say `application/ld+json`. An unknown extension is served as
`application/octet-stream` or `text/plain` depending on the extension.

That third row is **not a failure to fix**. It is a property of the host, and
the honest handling is the one this repository applies everywhere else:

- **Do not pretend.** A tool reporting "served with the declared type" must not
  say so for a Pages URL it did not check.
- **Do not fall back to a guess that looks authoritative.** "Probably
  `application/json`" is worse than "this host does not declare one", because
  the first is quoted and the second is investigated.
- **Report "could not enforce" as its own state**, distinct from "enforced" and
  from "enforced wrongly". Same rule as `readme-sections`' third state,
  `ci-health`'s "could not check" and `resolveTodoTags`' `not-checked`.

## Consequences a consumer must expect

A client fetching `<stub>.jsonld` from Pages **will** receive the wrong
`Content-Type`. A strict JSON-LD processor may refuse it. That is a known and
accepted cost of publishing there, and the remedy is the local deployment.

**`<stub>.json` is an alias, and the distinction from a rename is the whole
point.** Renaming the artefact to `.json` would trade a wrong type for a wrong
*name*, and the name is the part a reader uses — that argument stands. Serving
the same bytes at BOTH extensions costs nothing and concedes nothing: `.jsonld`
stays canonical and is what every `@id` in the document names, while `.json` is
the one path by which a correct `Content-Type` can come out of this host at all.
A consumer that needs the media type more than the identity has somewhere to
go, and neither document claims to be the other.

What that does **not** license is a `.json` whose bytes differ, or an `@id`
pointing at it. Two documents asserting the same IRIs is the defect
`--base-url` exists to prevent, and an alias is only an alias while it is
byte-identical — which is why the staging build copies it *after* stamping,
so the two cannot disagree about which build they came from.

## Running one — `serve-rendering`

The hole this section used to declare is filled. The reasoning for leaving it
open stands and is why the split looks as it does: the media types and the
per-host story are the durable part, and a server is an implementation of
this rather than a prerequisite for it. So the contract moved into code and
the server reads it, instead of the server becoming the contract.

```sh
bun run serve:rendering --dir docs/_site --port 4000
```

`RENDERING_MEDIA_TYPES` and `renderingMediaType()` in `schemas/cat-harness.ts`
are the table, beside `renderingPath()` — where a rendering LIVES and what it
IS are the same kind of fact. Before this, the table existed only as prose on
this page: `grep` for `ld+json` across the repository's TypeScript returned
nothing (measured 2026-09-19), so every consumer had to re-derive it.

Obligations are `skills/requirements/serving-a-rendering.json`, so a second
implementation is checkable against the requirement rather than against this
one's source. Bean `folio-assistant-0hi8`, issue #363.

### What a general-purpose static server actually gets wrong

Less than this page used to imply, and the difference is worth carrying
because overstating it is how a working setup gets ruled out. **Measured
2026-09-19:** Python's `mimetypes` and `Bun.file().type` both already resolve
`.jsonld` to `application/ld+json`.

The gap is **one row**: `.schema.json` resolves to `application/json` in every
OS table, because `.json` is the suffix that matches and nothing knows the
compound extension means a schema. Hence longest-extension-first, and hence a
declared table rather than the filesystem's.

### Containment is part of the contract

Added because the reference implementation failed it. Its own test pointed a
symlink inside the served root at a file outside and got **200**: the URL is
clean so a lexical path check passes, and `resolve()` never touches the
filesystem. Real paths must be compared. This matters most for the
`self-sovereign` topology, which is outward-facing: no, and whose published
directory sits beside data nobody intends to publish.

The server binds **loopback** unless told otherwise, for the same reason.
{% endraw %}
