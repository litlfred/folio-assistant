---
name: ui-accessibility
description: >
  Every user interface this project produces must be operable by keyboard,
  legible at measured contrast, and comfortable to hit. How to build to that,
  how to check it, and why an automated pass is not the standard.
consulted: true
---

# All UI must follow accessibility guidelines

This is a **rule**, stated as one by the owner, and it binds every surface this
project produces: the knowledge-graph viewer, the docs site, the action-icon
tiles, anything future.

## Why it is load-bearing here, and not boilerplate

**This instance's declared interaction profile is low-dexterity.**
`interaction/interaction.json` records it, and it already shapes the form of every
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
bunx playwright test test/a11y.e2e.ts
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
