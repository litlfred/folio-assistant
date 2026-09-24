---
# folio-assistant-0hd6
title: translate-bpmn has no --check, and 12 diagrams have no .pot at all
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:06:30Z
updated_at: 2026-09-23T19:06:25Z
parent: folio-assistant-bzyu
---


_2026-09-19T10:07:02Z_ — FOUND WHILE REWIRING translate-bpmn.ts TO READ THE DECLARATION, 2026-09-19, and it is a pre-existing gap rather than anything that rewire caused. Running `bun run scripts/translate-bpmn.ts --extract --locale fr` produced TWELVE .pot files that git reported as UNTRACKED — templates that had never been generated for diagrams that have existed for some time: crdm-close, crdm-deliver, crdm-issue-linking, crdm-needs, crdm-requirements-definition, crdm-signoff, review-code, review-narrative and four more.

WHAT THAT MEANS IN PRACTICE: a .pot is a translator's input. A diagram with no .pot is not merely untranslated — it is INVISIBLE to whoever does the translating, because nothing in the translations tree says it exists. Twelve of thirty-two diagrams, so better than a third of the corpus, and the whole CRDM cluster is in it.

THE MECHANISM IS THE ABSENT GATE. `render-bpmn` has `render:bpmn:check`, which fails when an SVG is stale, and AGENTS.md records at length why that exists — a generated artefact with no staleness check drifts silently and the published site serves the old one. `translate-bpmn` has NO --check counterpart: package.json carries `translate-bpmn` alone. So adding a diagram and not re-extracting costs nothing at the time and is discovered only when somebody runs extract by hand, which is how this was found.

WHAT A FIX LOOKS LIKE, and it is the same shape as its sibling: a `--check` mode that regenerates into a temporary directory and fails when a .pot is missing or differs. One wrinkle that must be handled or the check is useless: the ONLY difference between two runs over an unchanged diagram is the POT-Creation-Date header, measured here — 32 files regenerated, every one differing in that line and nothing else. A naive byte comparison therefore fails always. The check has to compare with that header excluded, exactly as a lockfile check ignores its own timestamp.

NOT FIXED IN THE REWIRE PR deliberately. The rewire is about WHERE diagrams are found; this is about WHETHER their templates are current. Committing twelve generated files inside a directory-discovery change would bury a content question in a plumbing diff, and the twelve files are worth nothing until the gate exists to keep them current — otherwise the next twelve diagrams repeat this exactly.

VERIFIED NEUTRAL, which is what made the finding visible at all: after the rewire, regenerating every .pot changed ONLY the timestamp line in all 32 existing files. So `relative(root, file)` yields the same source reference the old `processes/${file}` interpolation did, and the rewire moves no translator-visible content.

## Done when

- [x] `translate-bpmn --check` exists, compares with `POT-Creation-Date` excluded, and fails on a missing or stale `.pot` — landed on main before this bean was picked up (around #790 / `388302c2`, orphan detection `690a6544` #815).
- [x] `translate-bpmn:check` (and `translate-bpmn:bootstrap:check`) in `package.json` and in `code-quality-gates.yml`, so `bun run gates` runs them — already on main.
- [x] Every declared diagram has a `.pot` in every locale — measured 2026-09-23: 67 diagrams × 5 locales, 0 never extracted, 0 out of date, 0 orphaned; bootstrap 3 × 5, same. `--extract` over both instances changed no file.
- [x] A third state: `--check` with no gating locale exits 2 ("nothing was checked") instead of 0 — added here.
- [x] A test proving the checker FIRES, not only that the tree is fresh — added here.

## Summary of Changes

Picked up 2026-09-23. On measuring first, the bean's headline gaps were already closed on main: `--check` existed and was gated, and no diagram lacked a `.pot` (67/67 in each of ar, es, fr, ru, zh; the original 12 were extracted in the same merge that added the gate). The root cause was the one the bean named — no staleness gate, so a new diagram cost nothing until someone ran `--extract` by hand; it was NOT an extractor filter (the default-xmlns `translation-workflow.bpmn` yields 42 msgids).

Two real gaps remained and are fixed here:

1. **Vacuous pass.** With no locale carrying a `processes/` tree, `--check` examined zero templates and printed "Every diagram has a current .pot" with exit 0 — the `dh4f` shape. It now exits 2.
2. **The checker's own behaviour was untested.** `bpmn-pot-current.test.ts` only asserted the committed tree passes, which a `--check` that always exits 0 would also satisfy. Added five cases on a throwaway `--instance`: nothing-examined → 2, missing → 1 then extract → 0, timestamp-only difference → 0, changed label → 1 (stale), orphaned template → 1.
