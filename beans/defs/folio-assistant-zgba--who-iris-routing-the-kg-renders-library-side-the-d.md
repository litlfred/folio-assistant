---
# folio-assistant-zgba
title: 'WHO-IRIS ROUTING: the KG renders library-side, the documentation docs-side, and the replica navbar stops carrying docs'
status: in-progress
type: task
priority: high
created_at: 2026-09-21T10:51:32Z
updated_at: 2026-09-21T10:51:32Z
parent: folio-assistant-kupb
---

Owner, 2026-09-21, two messages:

> i want the proposal pages for who-iris moved to their docs/. the docs/ should
> not be for the who-iris top navbar, instead, f-a navbar should still be on
> the left, with who-iris and then link to docs on side in navbar. see other
> beans/sibling work on LHS

and, ruling out the question of where the replica lives:

> the iris KG should be in who-iris/library (served by cat-harness/library)
> which may or may not inlude materialized content, the docs in who-iris/docs
> (served by cat-harness/docs)

## What was actually wrong

`who-iris/docs/` held BOTH the replica and the documentation, and
`mount-instance-docs.ts` copies a declared directory to `/<kind>/<instance>/`.
So `/docs/who-iris/` was not merely styled like the replica — it WAS the
replica, byte for byte, with the replica's own top navbar carrying the two
documentation links. That is what the owner was looking at.

## Done when

[x] the replica renders to `who-iris/library/`, served by cat-harness/library
[x] the documentation renders to `who-iris/docs/`, served by cat-harness/docs
[x] the replica's top navbar no longer links the documentation
[x] both directories carry an `index.html`, or neither mounts
[ ] `/who-iris/` serves the THEMED replica, not whichever kind sorts first
