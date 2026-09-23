---
# folio-assistant-uknu
title: 'DUPLICATE id ON EVERY DOCS PAGE: just-the-docs renders nav_footer_custom twice, so both copies carry id="fa-nav-open"'
status: completed
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

- [x] The runtime behaviour at phone width is measured in a browser, and this
      bean says whether the mobile toggle was operable
- [x] No generated page carries a duplicate `id`
- [x] A check can fail on a duplicate `id` in a built page, so this class does
      not recur silently

## Summary of Changes

**Measured in Chromium on a local build (`preview:site`, served at its `baseurl`), 2026-09-23. The mobile toggle was operable by mouse only by accident, and was NOT operable by keyboard.**

| at 375px, before | result |
|---|---|
| click the footer copy's `☰` | opens the nav, but only because `for="fa-nav-open"` resolves to the FIRST id, the checkbox inside `.side-bar` |
| Space on the footer copy's own checkbox | ticks a checkbox OUTSIDE `.side-bar`, so `.side-bar:has(.fa-nav-open:checked)` never matches and **nothing opens** |

The theme's source for this, v0.12.0: `components/sidebar.html` includes `nav_footer_custom.html` inside `.side-bar`, and `components/footer.html` includes it again in the main content (`.d-md-none`).

**Fix.**
- `nav_footer_custom.html` renders the checkbox and both labels once per page, behind an `unless`/`assign` guard. The sidebar is included first in `_layouts/default.html`, so the copy that renders is the one inside `.side-bar`.
- The harness tabs still render in both copies. They carry no id, and the footer copy is where a phone reader finds them.
- After the fix, at 375px and at 1280px, there is one checkbox and one `☰`; click opens the nav, Space opens it and Space again closes it.

**The other duplicate the scan found.** `external-schemas/index.html` had `hl7-fhir` twice: kramdown slugged the heading "HL7 FHIR" to the same id as the explicit `<a id>` beside it. `gen-external-schemas-viz.ts` and `gen-methodologies-viz.ts` (same shape, latent) now put the id ON the heading with a kramdown IAL `{#id}`.

**The check.** Added `html-unique-ids` to the pre-deploy verifier set (`publish-verify.ts`, bean `vigi`). A duplicate id now blocks the deploy and raises the publication-manager alert.

| tree | before | after |
|---|---|---|
| local build, 1,288 pages | 433 findings (432 `fa-nav-open`, 1 `hl7-fhir`) | 0 |
| live `gh-pages` (non-STAGING), 3,115 pages incl. TypeDoc and smart-trust | 1,223 findings, exactly those two ids | fixed by this change; no third id anywhere |

The live-site row is why this check can block: its first run on main will not find something this change did not fix.
