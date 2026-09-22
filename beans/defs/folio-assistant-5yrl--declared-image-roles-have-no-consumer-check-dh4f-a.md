---
# folio-assistant-5yrl
title: Declared image roles have no consumer check — dh4f applied to a role
status: todo
type: task
created_at: 2026-09-22T06:08:05Z
updated_at: 2026-09-22T06:08:05Z
priority: normal
parent: folio-assistant-o3xy
---


Split out of `blv9` on 2026-09-22, because the two are different questions
over different corpora and folding them in would have made one gate answer
two things.

`blv9` asked whether a path **will resolve** — its subject is Liquid
interpolations in Jekyll templates, and its gate
(`scripts/check-docs-templates.ts`, shipped 2026-09-22) judges literals and
DECLINES variables. This bean asks whether a declaration is **read at all**:
for every `role` on an `images[]` entry in an instance declaration, is there
a consumer that actually reads images filtered by that role?

That is the `dh4f` shape — a consumer scans nothing and reports a clean run
over it — applied to an image role instead of a directory.

## Why it is not a one-line grep, and this is the whole reason it needs a bean

`blv9` recorded the finding that makes the naive version wrong. It is worth
restating here rather than pointing at it, because a reader who only sees
"check every role has a consumer" will build the naive version:

> `cat-harness.json` declared `role: "browser-icon"` on `mark-small` and
> nothing consumed it — the site emitted no favicon at all. But the reason
> was **not an absent caller**. `imagesForRole()` (`schemas/kg-node.ts`)
> filters on `i.role === role && i.layout !== undefined`, and a mark carries
> no `layout`, so the lookup returned an EMPTY MAP and said nothing about
> why. A caller existed; it could not reach what was declared.

So the check wants **two halves**, and the second is the one that catches the
real instance:

1. every declared `role` is named by at least one consumer; **and**
2. every lookup used to consume one can actually MATCH what is declared — a
   role whose images carry no `layout`, queried through a layout-keyed
   function, is unreachable by construction.

Half (1) alone would have caught the favicon case only by accident.

## What is already fixed, so the gate is regression cover not a bug hunt

`imageForRole()` exists as a SIBLING of `imagesForRole()` — added rather than
loosening the layout-keyed one, because the two answer genuinely different
questions and merging them would hide the layout contract the landing path
depends on. The favicon is served. This bean does not re-fix that; it asks
for the check that would have found it.

## Expect a third state

`check-docs-templates` needed one (literal judged, variable declined) and
`check:partition` names its own. A consumer reached through a variable role,
or through an indirection this tool cannot follow, is **declined** — listed,
not counted clean, and never in the failing set. An examined-clean case and
an unexaminable one must not look alike.

## Out of scope, recorded so it is not re-derived

`blv9` also found a **prose** claim about an asset that was never true (a CSS
comment asserting the mark used `currentColor`, measured false against every
commit that ever touched the icons). A comment is a declaration too, but that
shape is not mechanically checkable, and saying so out loud is better than
pretending a gate will cover it.

## Done when

- [ ] Half (1): every `role` declared on an `images[]` entry across every
      instance declaration is named by at least one consumer.
- [ ] Half (2): every lookup used to consume a role can match what is
      declared — no layout-keyed query over layout-less images.
- [ ] A third state for roles whose consumer cannot be determined; declined
      is listed and never counted clean.
- [ ] Falsified both ways: remove a real consumer → caught; restore → clean,
      and the declined set does not move.
- [ ] Registered in `package.json` and `code-quality-gates.yml`, and
      assigned in `scripts/partition/instance-rules.ts` with its reason.
