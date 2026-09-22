---
# folio-assistant-0hd6
title: 'translate-bpmn has no --check, and 12 diagrams have no .pot at all'
status: todo
type: task
priority: normal
created_at: 2026-09-19T10:06:30Z
updated_at: 2026-09-19T10:07:02Z
parent: folio-assistant-bzyu
---


_2026-09-19T10:07:02Z_ — FOUND WHILE REWIRING translate-bpmn.ts TO READ THE DECLARATION, 2026-09-19, and it is a pre-existing gap rather than anything that rewire caused. Running `bun run scripts/translate-bpmn.ts --extract --locale fr` produced TWELVE .pot files that git reported as UNTRACKED — templates that had never been generated for diagrams that have existed for some time: crdm-close, crdm-deliver, crdm-issue-linking, crdm-needs, crdm-requirements-definition, crdm-signoff, review-code, review-narrative and four more.

WHAT THAT MEANS IN PRACTICE: a .pot is a translator's input. A diagram with no .pot is not merely untranslated — it is INVISIBLE to whoever does the translating, because nothing in the translations tree says it exists. Twelve of thirty-two diagrams, so better than a third of the corpus, and the whole CRDM cluster is in it.

THE MECHANISM IS THE ABSENT GATE. `render-bpmn` has `render:bpmn:check`, which fails when an SVG is stale, and AGENTS.md records at length why that exists — a generated artefact with no staleness check drifts silently and the published site serves the old one. `translate-bpmn` has NO --check counterpart: package.json carries `translate-bpmn` alone. So adding a diagram and not re-extracting costs nothing at the time and is discovered only when somebody runs extract by hand, which is how this was found.

WHAT A FIX LOOKS LIKE, and it is the same shape as its sibling: a `--check` mode that regenerates into a temporary directory and fails when a .pot is missing or differs. One wrinkle that must be handled or the check is useless: the ONLY difference between two runs over an unchanged diagram is the POT-Creation-Date header, measured here — 32 files regenerated, every one differing in that line and nothing else. A naive byte comparison therefore fails always. The check has to compare with that header excluded, exactly as a lockfile check ignores its own timestamp.

NOT FIXED IN THE REWIRE PR deliberately. The rewire is about WHERE diagrams are found; this is about WHETHER their templates are current. Committing twelve generated files inside a directory-discovery change would bury a content question in a plumbing diff, and the twelve files are worth nothing until the gate exists to keep them current — otherwise the next twelve diagrams repeat this exactly.

VERIFIED NEUTRAL, which is what made the finding visible at all: after the rewire, regenerating every .pot changed ONLY the timestamp line in all 32 existing files. So `relative(root, file)` yields the same source reference the old `processes/${file}` interpolation did, and the rewire moves no translator-visible content.
