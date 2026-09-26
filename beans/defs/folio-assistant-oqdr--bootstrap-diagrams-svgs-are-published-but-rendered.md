---
# folio-assistant-oqdr
title: Bootstrap diagrams' SVGs are published but rendered by nothing since the split
status: in-progress
type: bug
priority: normal
created_at: 2026-09-24T17:52:19Z
updated_at: 2026-09-26T09:51:47Z
parent: folio-assistant-vke6
---

## What
`cat-harness/docs/assets/img/workflows/` holds `initialize-harness.svg`, `log-message.svg` and `discussion.svg`, whose sources are `bootstrap/processes/*.bpmn`. `render-bpmn.ts` renders `workflowFiles(cat-harness)`, which does not reach bootstrap, so these three are never re-rendered and `render:bpmn:check` cannot see them drift. The generated process pages (`docs/processes/initialize-harness.md`, `log-message.md`) embed them.

Seen 2026-09-24 while deriving subprocess links (bean `xl55`): `initialize-harness.svg` still carries the pre-`xl55` fallback link `assets/img/workflows/log-message.svg`, which resolves to nothing from the SVG's own location.

`bootstrap.svg` in the same directory has no diagram at all — possibly an orphan. Per deletion-requires-confirmation, it is reported, not removed.

## Done when
Bootstrap's diagrams are rendered and checked (by render-bpmn over every instance, as gen-processes-viz already does with `instanceRoots`), or their SVGs move to bootstrap's own site layer; and the owner has decided about `bootstrap.svg`.

_2026-09-26T09:51:47Z_ — Claimed by claude/oqdr-render-bootstrap-diagrams — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

---

_2026-09-26T10:05Z_ — **NOTE FROM ANOTHER SESSION, not a claim and not a closure.**
This bean is yours and mid-flight; nothing here is ticked and the status is
untouched. But the work overlaps almost exactly with what
`claude/fervent-mccarthy-nw4olk` pushed at ~09:55 (PR #1361, bean `bjzs`), and you
should know before spending the round.

I reached it from `bjzs` — *"render:bpmn never lists a nested diagram"* — and did
NOT find this bean first, which is my failure: I searched the store for "per
declared instance" and "nested-instance-audited", neither of which matches how you
worded it. It has been open since 2026-09-24.

**What is already pushed** (commits `5f12698dde` and the one following):

- `render-bpmn.ts` takes its sources from the union over every declared instance
  via `instanceRootsIn` — which is the shape THIS BEAN names (*"as
  gen-processes-viz already does with `instanceRoots`"*). My first attempt was a
  two-element list naming `bootstrap` by hand; your wording is what corrected it.
  Measured: 16 instances, union of 74 diagrams, identical to the hand-built pair,
  so nothing widens today and no instance is named by a literal.
- All three SVGs re-rendered. They WERE stale: sources last changed 2026-09-24,
  SVGs were from 2026-09-20. `render:bpmn:check` goes 71 → 74 judged, exit 0.
- **Your `xl55` finding is fixed by that re-render.**
  `initialize-harness.svg` carried `assets/img/workflows/log-message.svg`, which
  resolved to nothing from the SVG's own location; the re-rendered file carries
  `../../../processes/log-message.html`. The fix existed and had never reached
  bootstrap, because nothing re-rendered it.
- A basename-collision report, now FATAL. The docstring carried it as prose
  (*"today there is one such directory, so it is not a live defect"*), and with
  more than one instance in range both readings are wrong — `--check` would
  compare one source against the other's picture, and a write run lets the later
  render overwrite the earlier.

**What is NOT done, and is still this bean's:**

- `bootstrap.svg` — confirmed orphaned rather than merely suspected:
  `bootstrap/processes/bootstrap.bpmn` does not exist (renamed to
  `initialize-harness.bpmn`). 22150 bytes. Reported, not removed —
  `deletion-requires-confirmation`, and your `## Done when` already puts it to the
  owner.
- The alternative you offer — moving the SVGs to bootstrap's own site layer — is
  untouched. What landed keeps them where they already were, because the root's
  site already publishes bootstrap content (`docs/bootstrap/`,
  `docs/uml/overview/bootstrap/`) and all three SVGs were already there.

If you would rather your branch carry this, say so on #1361 and I will drop mine
— it is one file plus a test. What I would ask either way is that the
`instanceRootsIn` shape survives, since it is the half that came from your bean.

