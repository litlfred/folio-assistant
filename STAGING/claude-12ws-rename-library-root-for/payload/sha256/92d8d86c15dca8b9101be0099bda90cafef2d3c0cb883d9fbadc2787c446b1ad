---
# folio-assistant-pnn5
title: 'v8n5 Done-when #2 promised coverage ''the day instance #2 declares a theme'' — that day came and nothing compares'
status: todo
type: task
priority: normal
created_at: 2026-09-30T21:24:19Z
updated_at: 2026-09-30T21:24:41Z
parent: folio-assistant-1xhc
---

Found 2026-09-30 by becoming instance #2. Bean `7h3u` declared
`smart-trust/themes/`, which took the themes set from 1 to 2 — and that is the
condition `check-navbar-consistency.ts` said would close a gap.

## What the check promises at set size ≤ 1

```
NOTE: `v8n5`'s Done-when #2 — a surface must not fall back to the
      platform default for an instance that declares its own theme —
      is read over this set. At a set size of 1 there is nothing to
      COMPARE, so this reports the denominator and issues no verdict.
      The set is iterated rather than hardcoded, so instance #2 is
      COVERED THE DAY IT DECLARES ONE.
```

## What actually happens now that instance #2 exists

```
declaring a themes graph    2 of 17  (smart-trust, who-iris)
exit 0
```

The denominator generalised correctly — that part of the promise is kept, and
the set really is iterated rather than hardcoded. But past the
`themed.length <= 1` branch the script carries **a comment and no comparison**.
Nothing is read over the set. So the NOTE stopped printing and **no verdict
took its place**.

**A NOTE disappearing is not coverage arriving.** Before today the gap was
visible, in the check's own output, every run. Now it is invisible: the output
looks like an ordinary reported denominator, and a reader has no way to tell
that Done-when #2 is still unimplemented. That is `1xhc` exactly — the excuse
was the only thing making the absence legible.

## How it surfaced, which is the part worth keeping

`navbar-consistency.test.ts` asserted `out` contains *"issues no verdict"*, so
it went **red on the real corpus** the moment the set reached 2. The test was
RIGHT to fail: its name said *"at a set size of 1"* and that premise expired.
Had it been written to pass at any size, the transition would have been silent.

## NOT fixed here, and this is a reservation rather than laziness

Implementing the comparison means deciding **which theme may style which
surface**, and the code says three lines later that PR #1584 held exactly that
for the owner:

> And deliberately NO assertion about which theme may style a given surface.
> PR #1584 left exactly that open for the owner … Picking one here would answer
> a question the owner held, which is not a check's to answer.

So an agent implementing it now would answer the reserved question by the back
door. The gap is pinned by a test instead — `the size-1 NOTE is gone, and its
PROMISE is NOT yet kept` — which asserts the NOTE's absence so the state cannot
be mistaken for closed, and deliberately does not fail.

## Done when

- [ ] the owner rules what Done-when #2 should compare, given that a board
      styles a card only from `sticky`-kind themes and both declaring instances
      own non-sticky ones (`who-iris`: webpage + publication; `smart-trust`:
      webpage)
- [ ] the comparison is implemented over the ITERATED set, and FALSIFIED — an
      instance deliberately falling back to the platform default must make it
      fail, or it is a gate that cannot fire
- [ ] the pinning test above is replaced by the real one, rather than both
      existing

## Not established

Whether any surface currently DOES fall back to the platform default for an
instance that declares its own theme. Nobody has measured it — which is the
whole point of the missing check, and why this bean does not assert a defect
in the rendering, only in the coverage.
