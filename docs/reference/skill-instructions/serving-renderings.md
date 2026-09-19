---
layout: default
title: Serving a rendering
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/serving-renderings.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/serving-renderings.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/serving-renderings.md){: .fa-edit-source }

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
<base>/kg/<stub>.jsonld          the knowledge graph        application/ld+json
<base>/<stub>.schema.json        its declaration's schema   application/schema+json
```

So `…/folio-assistant/kg/cat-harness.jsonld` is the *cat-harness* instance's
rendering, served from a tree whose root happens to be `folio-assistant`. A
consumer asking for one instance's graph must not be handed another's because
the paths collided.

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
accepted cost of publishing there, and the remedy is the local deployment, not
a different extension: renaming the artefact to `.json` to make Pages serve it
as JSON would trade a wrong type for a wrong *name*, and the name is the part
a reader uses.

## What this skill does not cover

**How to run a server.** No tool is specified here — the media types and the
per-host enforcement story are the durable part, and a server that reads them
is an implementation of this, not a prerequisite for it.
{% endraw %}
