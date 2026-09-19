---
# folio-assistant-udx8
title: 'KG viewer chrome: graph-view 404, JSON-LD + GitHub source links, drop the github.com header, search into an expanding navbar icon'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T07:30:04Z
updated_at: 2026-09-19T07:48:18Z
---


_2026-09-19T07:48:18Z_ — PR #352 (branch claude/kg-viewer-chrome). All four fixes land in the DOCS-SITE chrome, not the kg-viewer generator: docs-ui.js, head_custom.html, _config.yml, plus a new scripts/site-links.ts.

(1) The graph-view 404 was a composed link: head_custom.html wrote `'/kg/' | relative_url` and nothing has ever been published at <base>/kg/ — renderingPath puts the viewer at <base>/<stub>/. Targets are now resolved through artefactStub + renderingPath into docs/_data/harness.json, and site-links.ts --site <dir> verifies each against a BUILT tree (ok / dead=exit 1 / unknown=exit 2). Wired into docs-site.yml after the export. Measured on a real build: kg and jsonld ok, /kg/ absent from the tree entirely.

(2) One Source tile became JSON-LD + Source. The export produces NO .jsonl, so the machine-readable half is .jsonld only. Source stays a github.com blob URL, never raw.githubusercontent.

(3) aux_links removed from docs/_config.yml — that is what drew 'GitHub' as text at the top right of the main panel. The repo URL is now resolved from the git remote instead, so it is not written down twice.

(4) The theme's .search container is MOVED into the existing launcher as a Search tile (first cell). Moved, not rebuilt — just-the-docs binds to the element it rendered — and it never leaves the document, because getElementById does not find a detached node and view.innerHTML='' would have killed search outright.

Old e2e fixture asserted kg == '/folio-assistant/kg/' and passed: it was agreeing with the defect. It now reads harness.json.
