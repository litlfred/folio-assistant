---
# folio-assistant-udx8
title: 'KG viewer chrome: graph-view 404, JSON-LD + GitHub source links, drop the github.com header, search into an expanding navbar icon'
status: completed
type: task
priority: normal
created_at: 2026-09-19T07:30:04Z
updated_at: 2026-09-19T08:10:21Z
---


_2026-09-19T07:48:18Z_ — PR #352 (branch claude/kg-viewer-chrome). All four fixes land in the DOCS-SITE chrome, not the kg-viewer generator: docs-ui.js, head_custom.html, _config.yml, plus a new scripts/site-links.ts.

(1) The graph-view 404 was a composed link: head_custom.html wrote `'/kg/' | relative_url` and nothing has ever been published at <base>/kg/ — renderingPath puts the viewer at <base>/<stub>/. Targets are now resolved through artefactStub + renderingPath into docs/_data/harness.json, and site-links.ts --site <dir> verifies each against a BUILT tree (ok / dead=exit 1 / unknown=exit 2). Wired into docs-site.yml after the export. Measured on a real build: kg and jsonld ok, /kg/ absent from the tree entirely.

(2) One Source tile became JSON-LD + Source. The export produces NO .jsonl, so the machine-readable half is .jsonld only. Source stays a github.com blob URL, never raw.githubusercontent.

(3) aux_links removed from docs/_config.yml — that is what drew 'GitHub' as text at the top right of the main panel. The repo URL is now resolved from the git remote instead, so it is not written down twice.

(4) The theme's .search container is MOVED into the existing launcher as a Search tile (first cell). Moved, not rebuilt — just-the-docs binds to the element it rendered — and it never leaves the document, because getElementById does not find a detached node and view.innerHTML='' would have killed search outright.

Old e2e fixture asserted kg == '/folio-assistant/kg/' and passed: it was agreeing with the defect. It now reads harness.json.

_2026-09-19T08:00:31Z_ — FINDING worth keeping — a real build caught what the fixture hid.

The e2e fixture for just-the-docs' search was written from memory with aria-label on #search-input. The theme does NOT emit one: the field's name comes from <label for=search-input> containing <span class=sr-only>. My CSS had `display: none` on .search-label to drop the redundant magnifier — which removes the label from the accessibility tree and leaves the input with NO computed accessible name at all (measured over CDP Accessibility.getPartialAXTree: name == "").

axe passed it in BOTH schemes. Its `label` rule accepts a non-empty placeholder attribute as a last-resort pass, and it checks the attribute rather than the computed name. So this is another instance of the thesis tests/a11y.e2e.ts already argues: axe is necessary and not sufficient.

Found only by fetching the real Jekyll output of the staging build from gh-pages (STAGING/claude-kg-viewer-chrome/index.html) and reading the markup the site actually ships. Both fixtures are now copied from that build; the label is clipped rather than display:none; and the guard is an accessible-name assertion read out of Chromium over CDP, verified to FAIL when display:none is reinstated — getByLabel and a for= lookup both pass under the defect, so either would have been a guard that cannot fire.

_2026-09-19T08:07:49Z_ — PR #352 MERGED by the owner at sha 5cbad6e — the four fixes are in main.

Follow-up PR #357 carries the two commits that landed after that merge and are NOT in main:
 - the accessible-name fix (main currently ships a search field whose computed accessible name is empty)
 - the site-links check mirrored into feature-staging.yml, with a test holding both workflows together

Gates on the merged state: bun test 2248/0 fail, playwright 121 pass (CI=1), eslint clean, tsc clean, kg:audit:check exit 0.
