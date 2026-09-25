---
layout: default
title: 'Path containment'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/security/path-containment.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/security/path-containment.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/security/path-containment.md){: .fa-edit-source }

{% raw %}
# Path containment — two questions that look like one

`src/core/safe-path.ts` is the implementation. This is when to reach for which,
and it matters because the two checks are not interchangeable:

| you have | you want | use |
|---|---|---|
| a **URL path** (`/a/b.html`), possibly percent-encoded | the file it names inside a root | `resolveWithin`, then `realPathWithin` |
| a **single identifier** (`paperId`, a slug, a bean id) | one path segment, or a refusal | `safeSegment` / `joinSegments` |
| a path you are about to **write** that does not exist yet | containment despite an absent leaf | `writableWithin` |

**Why not one function.** `resolveWithin` leans on a URL pathname beginning with
`/`, so `normalize` absorbs leading `..` against the root — traversal by spelling
cannot escape it. An identifier has no leading slash, so `a/b` passed to it
resolves to a perfectly *contained nested* path. Contained is not the question
when the caller meant one directory, and a collapsed check would accept it.

**The lexical check is the weaker half.** `resolve` is string arithmetic and
never touches the filesystem, so a symlink inside the root pointing out of it
passes. Recorded in `serve-rendering.ts`: the first version of its resolver
returned **200** for exactly that, found by its own test rather than by review.
`realPathWithin` is the half that catches it, and `writableWithin` walks up to
the nearest existing ancestor because a target that does not exist yet has no
realpath to compare.

## Measured, 2026-09-25 — the three sinks that had nothing (bean `6bhf`)

All in `adapters/mcp-server/server.ts`, all reached from HTTP, all taking
`paperId` straight into `join()`:

| route | sink | primitive |
|---|---|---|
| `POST /api/import/arxiv` | `join(UPLOADS_DIR(), id)` → `mkdirSync(recursive)` + `writeFileSync` | arbitrary directory creation and file write |
| `GET /api/feedback?paperId=` | `feedbackPath` → `join(base, paperId, rootName + ".ts")` | read outside the store |
| `POST /api/feedback` | `writeFeedback` → `mkdirSync` + `writeFileSync` | write outside the store |

Two details worth carrying forward:

**`feedbackPath` took TWO external values and checked neither** — `paperId` and
`rootName`. A guard on the first argument only would have left half the hole
open, which is why `joinSegments` checks every segment rather than the first.

**A refused read and a refused write need different behaviour.** `readFeedback`
returns `[]` and logs, because it already returns `[]` for "nothing there" and
has no error channel — but it *logs*, since a traversal attempt and a typo look
identical in an empty array. `writeFeedback` **throws**, because a refused write
has no correct no-op: the caller believes the item was saved and will tell a
person so.
{% endraw %}
