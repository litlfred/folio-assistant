---
# folio-assistant-uknu
title: 'DUPLICATE id ON EVERY DOCS PAGE: just-the-docs renders nav_footer_custom twice, so both copies carry id="fa-nav-open"'
status: todo
type: bug
priority: normal
created_at: 2026-09-22T19:18:10Z
updated_at: 2026-09-22T19:18:10Z
parent: folio-assistant-o3xy
---

## What

Every generated docs page carries **two elements with `id="fa-nav-open"`**. A
duplicate `id` is invalid HTML, and `document.getElementById` plus every
`<label for=…>` resolve to the **first** one only.

## How it was found

Measured 2026-09-22 on the **rendered** page, not on the source — the staging
preview for PR #957, read out of the `gh-pages` publish ref rather than over
HTTP (the agent's egress proxy blocks `litlfred.github.io`, which is bean
`7s52`'s point: the publish ref is a git branch and can be read directly).

```
STAGING/claude-exciting-bardeen-csx7ay/reference/skill-instructions/coordinate.html
  671:  <input type="checkbox" class="fa-nav-open" id="fa-nav-open">
  2260: <input type="checkbox" class="fa-nav-open" id="fa-nav-open">
```

**The source is not duplicated.** `docs/_includes/nav_footer_custom.html:59`
declares the input exactly once. just-the-docs renders that include **twice per
page by design** — the theme's responsive pattern — and the two copies land in
different wrappers:

| line | wrapper | shown at |
|---|---|---|
| 671 | `.d-md-block.d-none.site-footer` | **md and up** (hidden below) |
| 2260 | `.d-md-none.mt-4.fs-2` | **below md** (hidden at md and up) |

Two labels bind to it, both in the same include:

```
:60  <label class="fa-nav-close"  for="fa-nav-open" …>
:84  <label class="fa-nav-toggle" for="fa-nav-open" …>
```

So at phone widths the **visible** labels resolve to the checkbox in the
**hidden** desktop copy.

## Why this is a finding and not a nit

`gjli` is a standing accessibility gate on every step of `p5wm`. A duplicate
`id` fails validation outright, and a `<label for>` pointing at a control that
is `display:none` is not operable by keyboard or by assistive technology — the
two mechanisms a mouse user never notices are missing.

It is invisible in the HTML *source*, which is correct throughout, and invisible
to `gates` — the same shape as the `gjli` defect itself, where 22 headings
shared one anchor and `gates --all` was green across it. **Only a build showed
it.**

## What is NOT established

**Whether the mobile toggle is actually dead at runtime.** That depends on
whether the stylesheet drives the nav through `:checked ~ sibling` selectors
scoped within each copy, or globally. Determining it needs a browser against a
built site, and the agent that filed this could not open one — egress to the
Pages host is blocked. **Do not close this bean on the duplicate `id` alone
without checking the behaviour**, and do not assume it is broken either.

## Two candidate fixes, neither chosen here

1. **Unique ids per copy** — suffix the id and both `for=` attributes per
   render (e.g. from `{{ include.variant }}`). Keeps the theme's two-copy
   pattern.
2. **Render the control once** and have both wrappers reference it.

Which is right depends on the runtime finding above, so it is left open rather
than guessed. Filed by the #956 consolidation session, which owns neither
`o3xy` nor `p5wm` — this is stream 2's surface.

## Done when

- [ ] The runtime behaviour at phone width is measured in a browser, and this
      bean says whether the mobile toggle was operable
- [ ] No generated page carries a duplicate `id`
- [ ] A check can fail on a duplicate `id` in a built page, so this class does
      not recur silently
