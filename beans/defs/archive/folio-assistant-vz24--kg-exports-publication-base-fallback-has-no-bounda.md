---
# folio-assistant-vz24
title: 'kg-export''s publication-base fallback has no boundary: an instance outside the repo gets this site''s base'
status: completed
type: task
priority: high
created_at: 2026-09-21T16:46:00Z
updated_at: 2026-09-21T16:50:00Z
parent: folio-assistant-vke6
---

## What

`exportIdentity`'s fallback — mine, from `40fl`/#718 — inherits the host
instance's `canonicalUrl` for **any** instance declaring none, with no
condition on where that instance lives. Measured on `main` at `0fc29b98cc`:

```
$ kg-export.ts --instance /tmp/.../outside --out …
  @id  https://litlfred.github.io/folio-assistant/outside.jsonld
  exit 0, no problem reported
```

A directory in `/tmp` was handed **this repository's** base. That URL will
never resolve; it claims a document this site does not publish; and the export
called it clean. `makeIri`'s own note calls this out — *links that look
dereferenceable* — and the fallback walked straight past it.

## Why it survived two PRs

`u1iu`/#725 **wrote the fix** — `publicationBase`, a path-boundary check, with
the same reasoning. It merged at `0fc29b98cc` carrying its other two parts (the
`check:published-instance-exports` gate and the QA-sidecar stem) and **dropped
`publicationBase` on the merge**: `grep publicationBase` over the tree returns
nothing.

The likely reason is the instructive part. My unconditional fallback had
already made the failing command exit 0, so by the time they merged, **the
symptom was gone and the defect was not**. A fix that removes the evidence for
a better fix is worse than no fix, and that is what mine did.

## The boundary

`here === repoRoot || here.startsWith(repoRoot + sep)` — never bare
`startsWith`, which calls `/repo-other` a child of `/repo`.

`bootstrap` inherits because this repository **publishes** it, by the
deploy step one function away. `/tmp/outside` is not published here, so the
honest answer is the third state that already existed: a document-relative
`@id` plus a reported problem. A base for it would be a guess wearing the
clothes of a fact.

## The diagnostic named the wrong reason

*"and none declared by the publishing instance"* was true while the fallback
was unconditional and became false the moment it gained a boundary: for an
outside instance the host **does** declare a base, it simply does not extend
there. Left alone, it would have sent its reader to add a `canonicalUrl` that
is already present. It now states which of the two reasons applies.

## Done when

- [x] The fallback applies only to an instance this repository publishes
- [x] Path-boundary comparison, not a prefix
- [x] An outside instance keeps the third state and reports a problem
- [x] `bootstrap` and the root still resolve unchanged
- [x] The diagnostic names the reason that actually applies
- [x] Three tests, each falsified against the defect it exists for — the
      unconditional fallback fails the outside test; a bare `startsWith` fails
      the sibling test

## Summary of Changes

`publishedHere` computed once in `exportIdentity` and returned, so the caller's
diagnostic does not repeat the comparison — a second path-boundary check is a
second chance to write `startsWith`.

Merged as `220233c76e` (PR #746) and **verified on `main` after the merge**, not
only on the branch: the boundary is at `kg-export.ts:2156` and the `/tmp`
instance exits 1.

Verified: outside instance → document-relative `@id`, problem reported, exit 1;
`bootstrap` → `<base>/bootstrap.jsonld`, exit 0; root unchanged.
`gates` 91 of 91. Both QA sidecars checked by **subject**, not by diff size —
`kg-export.qa-results.json` names `cat-harness.jsonld` and
`kg-export.bootstrap.qa-results.json` names `bootstrap.jsonld`. That
check is here because last time I read only the diff of this file, saw
`script_hash` and `updated_at`, and called a real defect timestamp noise.
