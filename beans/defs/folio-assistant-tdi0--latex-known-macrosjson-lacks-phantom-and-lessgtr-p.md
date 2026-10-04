---
# folio-assistant-tdi0
title: 'latex-known-macros.json lacks \phantom and \lessgtr: preflight false positives on a real paper'
status: todo
type: bug
tags:
    - latex
    - preflight
created_at: 2026-10-04T18:57:25Z
updated_at: 2026-10-04T18:57:25Z
---

Found 2026-10-04 running paper-feature-build on litlfred/qou (PR #2118). The LaTeX preflight that build.ts runs reports two undefined-macro findings, and both are standard commands:
- \phantom is LaTeX core (first use qou chapters/mass-theory.tex:7091);
- \lessgtr is amssymb, which the paper print template loads (chapters/knots-particles-confinement.tex:179).
cat-harness/content/pipeline/latex-known-macros.json contains neither (grep count 0). The preflight's own message names the remedy: add genuine standard/package commands to that file, or re-seed with --seed.

Done when: both are in the known list (or a re-seed adds them), and the preflight on qou's render reports 0 findings for them.
