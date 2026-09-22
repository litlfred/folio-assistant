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

**NOT blocked on bean `fsch`.** It was scrapped 2026-09-20 and the block is
void. Its closing note settles the object as *an instance with directories,
each holding a graph*, with `folio` one renderable graph kind among several —
which does not remove the reason for this rename but **supplies** it: under
that model `folio/` is a declared directory holding a `folio` graph, so the
directory currently called `content/` (431 files, 46,401 lines of *pipeline*,
holding no content) is misnamed on the shipped model rather than on a
proposed one.

This work therefore stands and is unblocked. Stage by consumer — pipeline,
scripts, docs, workflows, CI — with wiring moving in the same commit as its
targets (`AGENTS.md`: move wiring and script together).

Gate: no `content/` path literal outside intentional content-instance paths;
full suite green **and** a synthetic-folio run proving each moved tool still
reads a non-empty corpus (the `dh4f` gate — a green check is the symptom, not
the reassurance).
