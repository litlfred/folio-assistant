---
# folio-assistant-jh2j
title: 'TOOL 7/13: Task_Render — LaTeX / PDF rendering (16 files, 3 entry points)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:34:56Z
updated_at: 2026-09-20T04:34:56Z
parent: folio-assistant-d308
---

Group 7 of 13 in `d308`. **16 files, 3 entry points.**

`render-latex`, `generate-block-tex`, `generate-main-tex`, `latex-preflight`,
`latex-overfull-report`, `audit-tex-source`, `validate-tex`, `latexmk-compile`,
`render-changed-blocks`, `render-on-change`, `render-pre-commit`,
`render-discovery`, `render-value`, `headless-render-qc`, `refresh-authors-note`,
`scripts/render-tex/`.

**BPMN:** `authoring-a-paper · Task_Render`, `serviceTask`, refs
`latex-authoring`. Note `authoring-a-document · Task_Render` is a DIFFERENT
step — the document render path takes no TeX (see `content-profiles`), so a
single Tool must not claim both.

**Target repo (#223):** `folio-asst-sci`, together with `deploy/` and
`scripts/docker-latex-build/` (5 HOST files that render TeX in a container).

## Done when
- [ ] a Tool node for the TeX render path
- [ ] `satisfies` includes `latex-authoring`
- [ ] it does NOT claim `authoring-a-document · Task_Render`
- [ ] `requires` names the TeX distribution honestly, container arm included
- [ ] `tool-coverage` reflects it
