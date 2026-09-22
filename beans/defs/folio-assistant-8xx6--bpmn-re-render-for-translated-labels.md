---
# folio-assistant-8xx6
title: BPMN re-render for translated labels
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-19T00:41:33Z
parent: folio-assistant-bzyu
---

The "next" recorded on bean `t8g3`. Re-render BPMN diagrams so translated
labels appear, handling text overflow.

**Now unblocked.** Its own input list was partly broken: `schemas/translation-tools.ts`
listed `processes/publication-workflow.bpmn` in the `dak` entry's
`bpmnDiagrams`, and **that file has never existed** — `docs/publication-workflow.md`
is a PAGE embedding three diagrams. An unresolvable path makes the re-render
SKIP it, and a skipped diagram is indistinguishable from one that needed no
work. Corrected to `draft-to-publication.bpmn` and gated by
`bun run check:workflow-refs` (PR #245).

The `draft-to-publication` reading is an inference, flagged for the author.



---

**2026-09-18 — extract/inject half done, PR #246.**

The `bpmn` format entry declared NO extractModule, NO injectModule and had no
code. Built `content/pipeline/bpmn-translate.ts`: `extractBpmn` /
`injectBpmn`, never touching ids, refs, folio: extensions or DI bounds.

**Overflow measured before building** (it was the go/no-go, and I expected the
opposite): a French set ~18% longer with every authored `&#10;` break dropped
re-wrapped to the SAME 3 lines, 42px of an 80px task box. bpmn-js re-wraps
regardless — the authored breaks are not load-bearing, re-render is enough.

End-to-end on translation-workflow: 35 msgids, 15 nodes both sides, activity
ids and skill refs identical, 9/9 names translated, rendered SVG carries them.

**REMAINING on this bean:** the per-locale orchestration. Nothing writes
`translations/<locale>/*.bpmn` or a locale SVG, and the docs site does not
serve one. The modules are proven; putting a French diagram on a French page
is still to do.



---

**2026-09-18 — orchestration built; page wiring is the remaining blocker.**

`scripts/translate-bpmn.ts` (`bun run translate-bpmn`):
- `--extract` → **706 translatable strings across 20 diagrams**, written as
  `translations/<locale>/workflows/<name>.pot`. Committed for `fr`, matching
  the existing convention (only fr carries committed .pot files).
- `--inject --locale <x>` → reads `<name>.po`, writes the localised .bpmn,
  and **skips a diagram with no .po**, reporting which — "not translated yet"
  is the ordinary state of all 20, not an error.

**Measured before building, and it reshaped the scope:** `translations/<locale>/`
held .po files for `index` and `agent-onboarding` and NOTHING for any diagram,
and `docs/fr/` contains one page that embeds no diagram at all.

**So page wiring is genuinely blocked and was not attempted.** No translated
page references a workflow SVG, so rendering locale SVGs now would produce
files nothing links to — present but unreferenced, the mirror of the dangling
references `check:workflow-refs` gates. That needs a translated page that
actually shows a diagram first.

End-to-end test proves the property that matters for a shipped diagram: a
fully-translated .bpmn still LOADS, with identical node ids, identical skill
refs and identical bean ops. A pass producing good French and a disconnected
graph would satisfy every string-level test.

_2026-09-19T00:41:33Z_ — Checked 2026-09-19 on main at 17dc1e6 — LIVE per the bean's own last note, which records the orchestration as built (scripts/translate-bpmn.ts, 706 strings across 20 diagrams, fr committed) and page wiring as the remaining blocker. Nothing in this pass contradicts that; not re-measured.
