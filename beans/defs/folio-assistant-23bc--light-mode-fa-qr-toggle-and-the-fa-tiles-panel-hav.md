---
# folio-assistant-23bc
title: 'LIGHT MODE: .fa-qr-toggle and the .fa-tiles panel have no light-scheme tokens'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T17:11:38Z
updated_at: 2026-09-21T19:10:08Z
parent: folio-assistant-o3xy
---

Issue https://github.com/litlfred/folio-assistant/issues/756 item 6. Owner: 'class="fa-qr-toggle fa-tiles-toggle" does not respect light mode.' Same defect .fa-page-lang-bar records at docs-ui.css:1039.


## Measured 2026-09-21 — the toggle is innocent, and one literal is the defect

The report names `class="fa-qr-toggle fa-tiles-toggle"`, and **that element is
not the problem**: it is `background: transparent; color: inherit`, so it
follows the sidebar in either scheme. The report is still right, because what a
reader sees when they press it is the panel.

**The defect is one value.** `.fa-tiles` paints
`var(--sidebar-color, #27262b)` with no light-scheme override, so the panel
stayed dark on a light page. Everything inside it — `.fa-tile`,
`.fa-tiles-back` — is transparent-and-inherit, so a single override fixes the
panel and its contents together. That is a good design meeting one hard-coded
colour, not a sweep.

**The incoherence was already visible in the file.**
`.fa-tiles .fa-search-holder` has carried a light override since it was
written, setting `--fa-search-bg: #ffffff` — a white field painted onto a
panel that never went light. Somebody light-themed the contents of something
with no light mode.

## The a11y gate passed throughout, and that is not its failure

`test/a11y.e2e.ts` drives this exact harness in BOTH schemes and was green the
whole time, because **a dark panel with light text passes contrast**. Scheme
incoherence is not a WCAG failure, so no amount of axe coverage would have
found it.

Worth stating rather than glossing: the gate's silence was never evidence. What
shipped with this fix is a `scheme coherence` describe block asking the
question axe structurally cannot — *in light mode, is the panel light?* — as a
**luminance comparison against 0.5** rather than a hex equality, so a future
palette change that keeps the intent passes and only an inverted one fails.

## THE COUPLING I CREATED THIS MORNING, and had to repair

Hours earlier, fixing `rptk`, I tokenised `.fa-lang-bar` and wrote:

> ONE PALETTE, NOT TWO, and that is a measured claim rather than an omission.
> `.fa-tiles` paints `var(--sidebar-color, #27262b)` … and there is no
> light-scheme override for it — so this bar's backdrop is the same dark panel
> in both schemes. A light block here would be six tokens that never apply.

The measurement was correct. **The conclusion was contingent on this bean's
defect**, and fixing it falsified my own comment: every one of those seven
ratios is a number about `#27262b`, and in light mode the bar no longer sits on
it. So the two had to move together, and the paragraph is REPLACED rather than
appended under — a superseded claim left in place is one the next reader may
act on.

**A claim justified by another rule's absence has that rule's lifetime, not its
own.** That is the part worth more than the tokens.

## Done when

- [x] `.fa-tiles` has a light-scheme override, with the boundary and caption
      ratios measured (3.44:1 border, 12.24:1 caption)
- [x] `.fa-lang-bar` gains the light palette its backdrop now requires — the
      same six values as the per-page bar, because the backdrop is the same
      colour and a different set would be two answers to one question
- [x] the superseded ONE-PALETTE paragraph is replaced, not left standing
- [x] a spec asks what axe cannot, and is **falsified**: held the CSS out and
      the light case fails with `panel was rgb(39, 38, 43)` — `#27262b` exactly
- [x] 91 e2e pass across a11y, sidebar-panels and sticky-todos

### One honest note about that falsification

Only **one of four** new cases failed on the old stylesheet. The
language-bar coupling case PASSED pre-fix, and correctly so: panel and bar were
both dark, so they were on the same side — the wrong one. That assertion tests
coupling, not correctness, and the panel case is what tests correctness. Two
assertions because they are two properties.
