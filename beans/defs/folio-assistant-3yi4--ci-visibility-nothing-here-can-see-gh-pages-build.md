---
# folio-assistant-3yi4
title: 'CI VISIBILITY: nothing here can see gh-pages build outcomes, so a cancelled deploy is invisible'
status: todo
type: bug
priority: normal
created_at: 2026-09-20T16:33:19Z
updated_at: 2026-09-20T16:33:19Z
parent: folio-assistant-1xhc
---

Split out of `bm6d` on the owner's instruction, 2026-09-20. `bm6d` fixed the
*cause* of the self-cancellations; this is the **blindness that let them run
for months unnoticed**, and it is bigger than that bean.

## The gap, measured

`bm6d` counted **6 of the last 10 `pages build and deployment` runs
`cancelled`**, in an exact pattern, and nothing in this repository said so.
Three properties combine to make those runs unreadable from here:

1. they are on **`gh-pages`**, not the default branch;
2. they are **bot-triggered** — actor `github-pages[bot]`, event `dynamic`;
3. `bun run check:ci-health` reads workflow state **on the default branch**,
   so it covers none of them.

The deploy job is green, the bot comments the URL, the link resolves — and the
build that was meant to serve it was cancelled. **This is `xom7` one ref over**:
*"a thing failing repeatedly with nothing in the repository saying so"*, which
is the bean `ci-health` itself exists to prevent.

## Why it survives `bm6d`

`bm6d` removed this repository's own self-inflicted half — one workflow pushing
twice. What it cannot touch is **contention between sessions**: four agents
deploying to one ref still cancel each other's builds, and that remains
invisible by exactly the same three properties. So the harm is reduced and the
blindness is not.

It also blocks `bm6d`'s own third Done-when — *"measured after: `cancelled`
runs over a comparable window are not caused by a repository's own consecutive
pushes"* — which could not be closed because nothing here can perform the
measurement. `bm6d` closed on its property instead, by the owner's decision.

## Done when

- [ ] `gh-pages` build outcomes are legible from inside the repository —
      whatever the mechanism, a person or an agent can ask *"are the previews
      actually building?"* and get an answer
- [ ] a `cancelled` run is reported as a **third state**, not folded into
      success or failure. It is neither: nothing broke, and nothing shipped
- [ ] and the report distinguishes **self**-cancellation from cross-session
      contention, because `bm6d` fixed the first and not the second, so a
      count that merges them cannot show whether it worked

## Not in scope

The contention itself (`6pfo`, `1feu`) and the `docs-site.yml` full-replace
question. This bean is about being able to SEE, not about reducing the
collisions.
