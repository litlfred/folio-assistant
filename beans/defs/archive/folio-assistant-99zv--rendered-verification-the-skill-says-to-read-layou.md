---
# folio-assistant-99zv
title: 'RENDERED VERIFICATION: the skill says to read layout off the staging preview and never says how — plus a check that passed over a page with no stylesheets'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T19:47:12Z
updated_at: 2026-09-23T20:12:24Z
parent: folio-assistant-p5wm
---


Owner, 2026-09-23: *"playright skills update to check intended UI (also need
usabuility check)"*.

`rendered-verification` already existed and already covered the ground — build
the site, drive it with Playwright, measure computed style rather than reading
the stylesheet. So this **extends it** rather than adding a ninth skill beside
eight that overlap.

## The gap

The skill said, correctly:

> **It is not what CI builds** — CI uses the pinned `remote_theme`, this uses
> the gem — so read a *theme-chrome* question off the staging preview, not off
> this.

And then never said **how**. It could not: this environment's proxy refuses
`litlfred.github.io`, so the staging preview could be named and not opened.
That made the one instruction covering the highest-risk class of question
unfollowable.

**It is committed.** `feature-staging.yml` deploys each preview into
`STAGING/<slug>/` on `gh-pages`, and git reaches what HTTP cannot. Added with
the commands, and the trap that comes with it: a staged page addresses its
assets under the STAGING baseurl, so serving the extract at `/folio-assistant/`
404s every stylesheet.

## Assert the conditions — a check that passed over nothing

Measured the same day. A first run, mounted at the wrong path, reported **both
pages PASS** over a page with **zero stylesheets**. The verdict was green and
meaningless; what gave it away was the numbers beside it — `fullwidth=false`
where the page expands 4 of 5 figures, `z-index: auto` where the rule says 100,
a 1164px sidebar where the open width is 264.

So a rendered check now reports its own preconditions: stylesheet count,
`status >= 400` count, and the state the defect requires. `dh4f` in a browser.

## The usability half — visible is not usable

The owner asked for a usability check, and this is the form it takes that a
computed-style read cannot reach: hit-test the control's CENTRE. A control can
have the right size, colour and label and still be un-clickable.

Found exactly that way in `tcq2`: the search field had the right box and a hit
test at its centre returned `P.fa-search-notice`, because `.search` computed to
height 0 around a 36px input. Nothing in the stylesheet says that.

Two ways the test lies, both met the same day and both recorded: it resolves
INSIDE the control (an `<svg>` in a button reads as "covered" unless the
`contains` pair is used), and it reports preview-only overlays (the staging
banner, `z-index: 9999`) — so identify the coverer before calling it a defect.

And why it is usability rather than polish: when the covered control is the only
route back to a state, un-clickable is `l4zi`.

## Two environment facts

`pkill -f "http.server"` from the shell running one kills the command issuing
it — done twice in one session, the second immediately after noticing the
first. And a probe script left at the repository root fails
`check:undeclared-files` long after the probe stopped being interesting.

## Done when

- [x] The gh-pages route is written down with runnable commands
- [x] The STAGING-baseurl trap is stated where the route is
- [x] A rendered check reports stylesheet count, 404 count and the defect's precondition
- [x] The hit-test recipe is given, with both ways it lies
- [x] The `l4zi` link is made, so a covered control is graded not just noted
- [x] The skill's `description` says the new ground, so it is found by someone looking for it
- [x] Generated skill docs regenerated rather than hand-edited

Parent `p5wm`.
