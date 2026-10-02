---
# folio-assistant-thux
title: 'QUIET CLAIMS: a bean worked through its children is quiet by design — the check reads the parent''s own file only'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T16:39:21Z
updated_at: 2026-09-23T16:39:48Z
parent: folio-assistant-1xhc
---


`bean-quiet-claims` reads one signal: `updated_at` on the bean's own file. For a
task that is the right signal. For a bean worked **through its children** it is
the wrong one — nothing touches the parent's file while the children move, so
the parent accrues quiet hours for doing exactly what it is for.

And the finding then names no action a person can take. Its action says:

> Check for a liveness signal this sweep cannot see: an open PR naming the bean,
> or an unmerged branch touching it. If there is one, the claim is live and
> there is nothing to do.

For a parent there is no such signal to find, and the only way to make the
number go down is to edit the file for no reason. That is `o5qj`'s shape one
check over: a finding whose remedy is either unavailable or forbidden.

## Measured, 2026-09-23

Two sweeps, and they answer different questions — worth keeping apart.

**Network sweep** (all 298 unmerged remote branches, all 20 open pull requests):
of 39 quiet claims, **12 were live** — 4 named in an open PR (`0hi8` #1040,
`7sf1` #951, `d308` #938, `zzmr` #938), 3 with an unmerged branch touching the
bean file (`3lbz`, `30hn`, `z4mq`), and **5 epics whose children carried a
signal** — `1xhc` with 8 such children while reported quiet for 100 hours,
`ahvw` with 8, `1swy` and `0lmb` with 2 each, `8jt6` with 1.

A trap found on the way: a naive substring match on a four-character bean id is
wrong. `2634` "matched" a dependabot pull request — a digit run inside a version
string. Requiring a bean-shaped reference (`folio-assistant-2634`, or
backticked) drops it. Probably part of why the check does not try.

**Store-local rule** (what this bean implements): a claim with a child whose own
file moved inside the 72-hour window is excused. On the real store **39 → 31,
with 8 excused.**

The two numbers do not correct each other. Five is "epics with a child carrying
a NETWORK signal"; eight is "claimed beans with a child whose FILE moved". Only
the second is computable here, and the basis keeps saying the count is an upper
bound for the first.

## Keyed on parenthood, not on `type: epic`

The relation carries the argument — a bean worked through its children is quiet
for a reason whatever it calls itself — and `type` is a label a bean sets about
itself while `parent` is a fact another bean asserts about it. Keying on the
label would also force a ruling on what `feature` means, which this check has no
business making.

## The discrimination it must keep

A parent **all** of whose children are also quiet still fires. `bzyu` is the
worked case: 8 open children, none moving. Without that, the change would excuse
every parent and the check would stop saying anything about the beans it exists
for.

## Done when

- [x] A claim with a recently-moved child is not reported quiet
- [x] It is COUNTED rather than dropped — `bean-quiet-claims-parenting-live-work`, thresholded by nothing
- [x] A parent whose children are all quiet still fires
- [x] Keyed on `parent`, not on `type`
- [x] The threshold's basis says what changed, and keeps the upper-bound sentence for the network half it still cannot see
- [x] Verified on the real store: 39 → 31, 8 excused

Parent `1xhc`. Follows `o5qj`. Surfaced from [#860](https://github.com/litlfred/folio-assistant/issues/860).
