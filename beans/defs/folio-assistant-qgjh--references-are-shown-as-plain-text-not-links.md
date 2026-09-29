---
# folio-assistant-qgjh
title: References are shown as plain text, not links
status: todo
type: bug
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-23T10:36:13Z
parent: folio-assistant-4ccr
---

Slugs, file names, skills and related nodes are printed as code or plain text although the target exists, so the relationship a page exists to show cannot be followed. Emit links wherever the target resolves.

Observed on: `catalogue`, `external-schemas`, `folio`, `glossary`, `library`, `methodologies`, `processes`, `tools`, `voices` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 9 still present, 0 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — References shown as plain text, not links — catalogue: 3 tables (state 3 rows, gate 5, every-node 13 rows) contain 0 <a>. Node titles, catalogue paths and 'held as' library ids are plain text or <code> (34 unlinked codes). (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — external-schemas: The dependents are now 'user|declared by' tables with 0 links. Paths such as folio-assistant-core/schemas/dublin-core.ts are <code> and not links. The 22-row term tables have 0 links. Only the spec table has links (34, to in-page anchors). (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — folio: The node table (id|summary|anchor|theme|declared in|links|prose, 5 rows) and the directory table contain 0 <a>. 'links' and 'declared in' are text or code (16 unlinked codes). (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — glossary: Each term name links to GitHub (48/48). The description cells contain 0 links, and 9 descriptions name other roles or permissions in literal backticks, e.g. 'Inherits `reviewer`… the `adjudication` permission'. (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — library: The listing table (3 rows) and the uploads table contain 0 <a>, and so does /cat-harness/library/cat-harness/ (11 rows). Slug, title and cover are not links. (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — methodologies: 14 'library/…' ingested-source references are <code> (e.g. library/arxiv-2508.05192v2, library/dusengumuremyi-2026-ai-mediated-raci). None is inside <a>, and every library href on the page belongs to nav chrome. (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — processes: The 'skill|run by' table has 99 rows and 0 links, with .bpmn names as <code>. The 'lane|in' table (105 rows) also has 0 links. Only the process table links (74/74). (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — tools: The main table 'tool|what it does|invoked|satisfies|i/o' has 104 rows and 0 <a>. satisfies/skill ids are <code> (296 unlinked codes on the page). (links.mjs)
- **STILL-PRESENT** — References shown as plain text, not links — voices: 0 content links on /cat-harness/voices/ (102 span.cite) and on /cat-harness/voices/who-style-guide/ (25 span.cite, e.g. 'who-pub-tps-931#page-014, p14'). (links.mjs)
