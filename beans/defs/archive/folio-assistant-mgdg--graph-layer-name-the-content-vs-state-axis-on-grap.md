---
# folio-assistant-mgdg
title: 'GRAPH LAYER: name the content-vs-state axis on GraphKindDef'
status: completed
type: task
priority: high
created_at: 2026-09-20T05:04:18Z
updated_at: 2026-09-20T05:14:17Z
parent: folio-assistant-zzmr
---

Every registered graph kind said whether it RENDERS; none said whether it holds
CONTENT or STATE. The split already existed in the data and was unnamed:
`beans/beans.json` splits `defs` (what is being worked on) from `workflows`
(where it got to), and `workflow-state` was already a registered kind.

Owner, 2026-09-20: *"that is a KG-State graph outside of the KG-content graph,
but references it"*.

## Summary of Changes

- `GraphLayer = "content" | "state"` and a **required** `holds` on
  `GraphKindDef`. Required is the whole mechanism: `tsc` names every kind that
  has not decided, at the keyboard. An optional field would have made "did not
  say" indistinguishable from "content".
- Every registered kind classified, each with its reason beside it. The four
  that are not obvious from their name — `qa`, `health`, `uploads` / `library`,
  `fsh-guts` — carry the reasoning rather than the verdict alone.
- `graphLayer()`, `isContentGraph()`, `isStateGraph()`, `graphKindsOfLayer()`.
  The two predicates are deliberately NOT each other's negation: an
  unregistered kind has not said `content`, it has not said anything.
- **A hole the axis itself opened, closed in the same change.** `register`'s
  diamond check compared `type` and `renderable` only. Two layers registering
  one kind on opposite sides of the line would have passed and the first would
  silently have won — the "one name, two answers" failure the registry throws
  to prevent, reintroduced by the field added to end it. Extracted as
  `sameKind`, which names the three behavioural fields and says why `summary`,
  `skill` and `schema` are not compared.

## Done when

- [x] `holds` required on `GraphKindDef`, and a kind without it does not compile
- [x] every registered kind classified with its reason
- [x] `sameKind` compares it, so a cross-layer disagreement throws
- [x] tests: every kind classified (catches a dynamically-built one, where the
      type is erased); the two sides partition; the four non-obvious kinds
      pinned by name, not by count; the diamond regression guard
- [x] falsified — flipping `fsh-guts` to `content` fails the pin
