---
# folio-assistant-4q5x
title: 'uploads/ and library/ are undeclared: declare them as graphs and CREATE them when walking an instance''s dependency tree'
status: todo
type: task
created_at: 2026-09-18T23:46:13Z
updated_at: 2026-09-18T23:46:13Z
---

`cat-harness.json` declares four directories — `tools/`, `schemas/`, `skills/` (id `kg`) and `beans/`. Neither `uploads/` nor `library/` is among them, and neither exists in this checkout (`ls -d uploads library` -> both absent, 2026-09-19). In `litlfred/qou` both exist and carry real content; `folio_init` writes them for a NEW folio (AGENTS.md 'Starting a new folio'), so the gap is (a) they are not declared graph directories anywhere, and (b) nothing creates them in a repo that already exists or in an instance that inherits them.

They are the two halves of the document-ingestion pipeline — `content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md` is a whole block on the distinction, and its point is that a source still sitting in `uploads/` makes a clean grep of `library/` read as 'nobody has done this'. So an absent `library/` does not fail loudly; it reports success over nothing, which is the `dh4f` defect in its most expensive form.

## The tension to resolve, not ignore
AGENTS.md is explicit: **'Declare only what exists — a declared-but-absent directory is the bean `dh4f` defect, where a consumer scans nothing and reports a clean run over it.'** Declaring `uploads/` and `library/` while they are absent is that defect verbatim. What makes the declaration safe is the second half of this bean: instantiation CREATES them. Declaration without creation must not land on its own.

## Owner requirement (2026-09-19, chat)
- `uploads/` and `library/` exist like they do in `litlfred/qou`, each with a `.gitignore` and a `# do not delete me` marker, so an empty directory survives a git checkout (git tracks files, not directories).
- Both declared in the schema and skills for **folio-assist-core**, not only in a folio.
- **Creation walks the declared `directories` of the top-level `cat-harness.json` AND of every derivative instance / dependency**, creating any that do not exist. This is the behaviour of ALL getting-started / instantiation paths, not a one-off in `folio_init`.

## Done when
- `schemas/cat-harness.ts` carries whatever graph kind(s) `uploads` and `library` hold, registered in `BASE_GRAPH_KINDS` beside `kg`, `schemas`, `tools` and `beans`.
- A single function materialises declared directories, resolving the dependency tree, and every getting-started / instantiation entry point calls it — including `folio_init`, so there is one answer rather than two.
- Note the known gap it must not repeat: `resolveSkillDirs` in `schemas/harness-config.ts` computes the cross-instance overlay and HAS NO CALLER, so skill discovery is root-only in practice. A directory materialiser with no caller would be the same bug.
- A test asserts that an instance whose dependency declares `library/` gets `library/` created, and that materialising twice is a no-op.
