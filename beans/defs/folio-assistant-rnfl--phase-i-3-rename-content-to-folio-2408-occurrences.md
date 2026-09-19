---
# folio-assistant-rnfl
title: 'Phase I.3 — rename `content/` → `folio/` (2,408 occurrences, 429 files) (#223)'
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
parent: folio-assistant-vke6
---

Mechanical but wide: **2,408** literal `content/` occurrences across **429**
files (measured 2026-09-18). `content/` holds no content — it is 431 files /
46,401 lines of *pipeline*.

**Blocked on bean `fsch`** (the folio schema). Stage by consumer — pipeline,
scripts, docs, workflows, CI — with wiring moving in the same commit as its
targets (`AGENTS.md`: move wiring and script together).

Gate: no `content/` path literal outside intentional content-instance paths;
full suite green **and** a synthetic-folio run proving each moved tool still
reads a non-empty corpus (the `dh4f` gate — a green check is the symptom, not
the reassurance).
