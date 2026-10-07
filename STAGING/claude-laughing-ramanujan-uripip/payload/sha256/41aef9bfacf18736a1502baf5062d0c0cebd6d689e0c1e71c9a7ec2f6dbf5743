---
name: ui-accessibility
description: >
  Every user interface this project produces must be operable by keyboard,
  legible at measured contrast, and comfortable to hit. How to build to that,
  how to check it, why an automated pass is not the standard, and what a
  rendering built client-side owes a reader — there is no no-JavaScript floor
  here, and the two gates that look like one are narrower than their names.
consulted: true
---

# All UI must follow accessibility guidelines

This is a **rule**, stated as one by the owner, and it binds every surface this
project produces: the knowledge-graph viewer, the docs site, the action-icon
tiles, anything future.

## Why it is load-bearing here, and not boilerplate

**This instance's declared interaction profile is low-dexterity.**
`cat-harness/memory/interaction.json` records it, and it already shapes the form of every
question the harness asks — numbered options, four or fewer, a stated default.

A UI that needs precise pointing, or that cannot be driven from the keyboard,
is unusable by the person it is being built for. So target size and keyboard
reachability are not the low-priority tail of WCAG in this repository. They are
the point, and the conformance floor is a floor rather than a target.

## The standard, concretely

- **WCAG 2.2 level A and AA.** Not AAA; do not claim it.
- **Every interactive thing is reachable AND activatable by keyboard.** Tab
  reaches it, Enter activates it, Space activates it if it is a button.
- **Targets are at least 24x24 CSS px** (SC 2.5.8), and aim higher: 32px for
  rows in a list, 28px for an inline control. Density is cheaper than a missed
  tap.
- **Contrast is computed, not eyeballed** — 4.5:1 for text, in **both**
  schemes, with the number written next to the token.
- **Focus is visibly indicated** by the page, not left to the user agent's
  default, and checked against every background a focused control can sit on.
- **A change that does not move focus is announced** — a live region, or focus
  management, or both.

## There is no no-JavaScript floor here — and exactly two gates that look like one

This is the question an agent arrives with, so it is answered before the
checks: **this project's accessibility standard does not require a surface to
work with JavaScript disabled.** WCAG 2.2 A/AA imposes no such rule, and
neither does this skill. A rendering MAY fetch and build its content
client-side.

Two things make it *look* otherwise, and both are narrower than their name
suggests. Measured 2026-10-02: these are the only two
`javaScriptEnabled: false` contexts in the repository.

| gate | what it actually requires | what it does NOT reach |
|---|---|---|
| `test/linear-floor.e2e.ts` | the **todo listing** (`#fa-todo-listing`) is in the served bytes, in document order, with its count equal to its own cardinality | anything else on the page |
| `test/first-paint-scheme.e2e.ts` | eight generated dashboards **first-paint dark from CSS alone**, in a light-preferring browser | the page's *content* — this is a colour assertion |

The first is the **board's** linear floor and nothing wider: it is R4 of
[`folio-board-requirements`](../../../docs/concepts/architecture/folio-board-requirements.md),
whose subject is the board. The second is about the first frame, not about
whether a reader can read the page.

**And the docs site's own navbar already requires JavaScript**, which settles
the question empirically rather than by reading. `mountNavIconRow`,
`mountDocumentIndex` and `mountInstanceGraphs` build three of its regions in
the DOM at load — shipped in #959, documented in `test/navbar-row.e2e.ts` as
"the three JS-mounted navbar regions", and no gate in this repository objects.
An argument that the docs site owes a no-JS rendering has to explain that
first.

**Why this paragraph exists at all.** On 2026-10-02 an agent relaxed R4 — a
*board* requirement, in a document whose own first section says it is "history,
not instruction" — and cited a measurement of the **docs nav** as the reason.
The relaxation was not merely mis-scoped, it was unnecessary: the nav was never
under the floor it relaxed. Reaching for a requirement to license a change is
how a rule gets read as wider than it is written, in both directions.

## A rendering built client-side owes two things the static one gave for free

These are **requirements**, stated by the owner on 2026-10-02, and they apply
to every surface — the board, the docs site, a viewer, a dashboard. They are
here rather than in a design record because a design record is not instruction
and nothing goes looking for a rule there.

- **Print and PDF SHALL wait for load and render before printing.** Owner,
  verbatim: *"print/pdf needs to wait until loaded/rendered before printing
  (assuming can load assets)"*. A `window.print()` that fires before the fetch
  resolves produces a blank or partial page, and **a PDF is not re-checkable
  after the fact the way a web page is** — a reader who got a blank page has no
  way to tell it from a page that was blank. Playwright's
  `waitUntil: "load"` is not sufficient on a page that fetches after load.
- **A load that FAILS SHALL say so** rather than render as empty. "Could not
  load" and "there is nothing here" are different facts, and a client-side
  fetch is the easiest place in this repository to lose the distinction —
  `could-not-determine-is-a-third-state-everywhere` applied to the one surface
  where the failure is invisible to every gate. **A `console.warn` is not
  saying so**: it reaches a developer with the console open and no reader ever.

What the relaxation does **not** touch, because the same ruling states them
independently: movement stays keyboard-operable, and drag stays an accelerator
rather than the only way in. The declared interaction profile is low-dexterity
and no byte-count argument reaches it.

## An automated pass is not the standard, and this is measured

Run axe. Also read the markup. **They find different things, and the overlap is
small.**

Baselined against the knowledge-graph viewer on 2026-09-19:

| found by | what |
|---|---|
| **axe only** | insufficient contrast (1 node light, 4 dark); five undersized targets |
| **reading only** | a diagram with no keyboard path; no live region; a placeholder-only field label; no skip link; unstyled focus |

**Why axe could not see the worst one.** The one-hop neighbourhood diagram drew
each neighbour as a bare `<circle>` with a click handler. No role, no
`tabindex`. A checker has nothing to report because there is no *control* there
to find a fault with — it is a shape. Every edge in the diagram was unreachable
by keyboard while the same edges in the table beside it were fine, and an
automated run was green over it.

**And why reading is not sufficient either.** Turning those circles into
`role="button"` groups introduced `nested-interactive`: the SVG carried
`role="img"`, which is a *leaf* in the accessibility tree, now wrapped around
focusable children. axe caught that on the next run; the human who wrote it had
not. A diagram stops being a picture the moment it becomes a set of controls.

Neither half replaces the other. Run both.

## Traps this project has already paid for

**A colour written for one scheme and never rechecked in the other.** The
viewer drew `color: #fff` on its accent. That is 5.97:1 in light, where the
accent is dark green — and **2.19:1 in dark**, where the accent is a *light*
green. Text on an accent is a token per scheme (`--on-accent`), never a
literal. Compute both.

**A placeholder used as a label.** It is the accessible name only until
somebody types, and then the field has none. axe passes it. A user does not.
Use a real `<label>`, visually hidden if the design wants no visible text.

**`opacity` to dim text on a coloured background.** It blends toward the
background and quietly drops the ratio below the floor. Use a second token with
its own measured value.

**A panel rewritten in place.** The user activates a control, the content
changes, and their cursor has not moved. Nothing was said. `aria-live="polite"`
on the region, and a count announced when a filter changes the list.

## How to check it

`test/a11y.e2e.ts` is the worked example and the gate. It runs in CI as the
`End-to-end + accessibility (hard)` job.

```sh
bunx playwright test cat-harness/test/a11y.e2e.ts
```

Two halves, deliberately:

- **axe-core** over the page in **both colour schemes at two viewports**,
  asserting zero WCAG A/AA violations. The failure names the rules, so a red
  run says *what* rather than *how many*.
- **Assertions axe cannot make** — focus lands on the control, Enter and Space
  both act, the accessible name says where an edge goes, no target is under
  24px, the skip link takes the first Tab, the field keeps its name after
  typing, the live regions exist, focus is visibly outlined.

**Before this, `bunx playwright test` ran in no workflow at all.** Twenty-nine
e2e tests existed and none was a gate. If you add UI and do not add a check
that runs, you have written a habit rather than a rule.

## When you cannot check something, say so

Contrast, names, roles, keyboard paths and target sizes are all checkable here.
Some things are not, from this environment: whether a screen reader actually
announces what the markup implies, whether an animation triggers vestibular
discomfort, whether a colour pair is distinguishable to a particular form of
colour blindness beyond what a ratio captures.

Report those as unverified rather than implying the gate covers them. A gate
that is believed to cover more than it does is worse than a narrower one.
