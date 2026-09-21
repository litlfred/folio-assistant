---
# folio-assistant-u2gv
title: 'check-invocation-parity: the comment says the fixtures keep saying cat-bootstrap, and they do not'
status: todo
type: bug
priority: low
created_at: 2026-09-21T21:51:02Z
updated_at: 2026-09-21T21:51:02Z
parent: folio-assistant-1xhc
---

Found while merging `main` into `claude/bean-8h42-layout`, 2026-09-21. Tiny,
and recorded rather than fixed because it is another branch's file and fixing
it would widen an unrelated PR.

`cat-harness/scripts/tests/check-invocation-parity.test.ts` carries, on the
assertion that reads the real `docs-site.yml`:

> The fixtures above keep saying `cat-bootstrap` on purpose: they are
> synthetic YAML testing that the parser returns WHATEVER instance string it
> is given, so the name there is arbitrary and no directory has to exist for
> it. This line is the only one that reads the real file.

**The fixtures do not say `cat-bootstrap`.** Lines 25, 29, 121 and 124 all say
`./bootstrap`. A blanket rename appears to have taken them along with the
assertion the comment is attached to.

## Why it is worth a bean rather than a shrug

The comment's ARGUMENT is right, and it is the more interesting half: a
fixture naming a directory that does not exist is a STRONGER test of "the
parser echoes whatever it is given", because it cannot accidentally pass by
the name happening to resolve. Renaming the fixtures quietly weakened that,
and the comment is now the only record that it was ever deliberate.

So this is a claim in a comment that the code beside it contradicts — the same
class this session has been closing all day, at its smallest.

## Two ways to fix it, and they are not equivalent

- **Restore the four fixture strings to `cat-bootstrap`.** Honours the stated
  intent and keeps the stronger test. What the comment's author appears to
  have wanted.
- **Amend the comment to say they were renamed.** Smaller, and loses the
  argument for why they should not have been.

The first looks right. It is the author's call.

## Context, because it is the same failure twice

That assertion exists because #771 renamed the directory an hour after #790
added it, and neither branch carried the other's change — both green on their
own head, `main` red on the merge. This branch then hit the same red and fixed
it independently, renaming all five strings; `main`'s fix landed first and
this merge took `main`'s. Three sessions, one string, no collision detected by
any of them. `/coordinate` §"A COLLISION — coordinate" is the rule written the
same day.

## Done when

- [ ] the comment and the fixtures agree
