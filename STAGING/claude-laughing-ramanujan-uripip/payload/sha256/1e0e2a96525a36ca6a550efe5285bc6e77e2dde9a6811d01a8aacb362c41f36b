---
name: path-containment
description: >
  Turning a value from outside into a path. The two different questions —
  a URL path versus a single identifier — why collapsing them is a defect,
  and the three sinks in this repository that had neither check.
---

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

## Then two MORE sinks, 2026-09-26 — and this is the lesson, not the list

The three above were fixed. **Two others in the same file were not**, and were
found only by re-reading every `join()` rather than the ones the bean named:

| route | sink | primitive |
|---|---|---|
| `POST /api/import/upload` | `id = paperId \|\| <slugified>` → `join()`; `filename = file.name` → `writeFileSync` | **arbitrary file write, path AND content** |
| `POST /api/import/scan` | `join(UPLOADS_DIR(), body.paperId)`, then `join(uploadDir, tf)` for each `meta.files` member | **arbitrary file read, two chained** |

> **A fix aimed at the sinks an audit LISTED leaves the sinks it did not.** The
> bean that found the first three also wrote the helper, and the helper was
> correct, and the routes it did not name stayed broken. Enumerate the sink
> shape — every `join()` reached from a request — not the instances a previous
> pass happened to catch.

Three specifics worth carrying:

**The fallback was sanitised and the supplied value was not.** `id = paperId ||
file.name.replace(/[^a-z0-9-]/gi, "-")` reads as defended, and the branch that
is defended is the one nobody attacks. Check the value you were *given*, not the
one you would have invented.

**A file name needs `basename` AND `safeSegment`, in that order.** `basename`
reduces `../../etc/passwd` to `passwd`, which is contained — but
`basename("..")` is `".."`, which is not a name. Either alone admits something.

**A second traversal can survive fixing the first.** `/api/import/scan` reads
`meta.files` out of `import-meta.json`, which `/api/import/upload` writes from
the uploaded file's own name. So validating `paperId` left the read primitive
fully reachable through a member name, with no traversal in the identifier at
all. **Ask where each element of a parsed structure came from, not just the
parameter.** That one is `realPathWithin` rather than `safeSegment`, because a
`.tex` may legitimately sit in `sections/`: the question there is containment,
not single-segment-ness.

### The gate, and what it cannot do

`scripts/tests/server-path-sinks.test.ts` — 8 of its 13 tests fail against the
pre-fix server and all 13 pass after, verified by reverting the file. It is a
**source ratchet** and says so: it proves the guard has not been deleted, never
that a value is checked on every path to a sink. It asserts its own non-vacuity,
because a renamed server would otherwise make every `not.toContain` pass.
