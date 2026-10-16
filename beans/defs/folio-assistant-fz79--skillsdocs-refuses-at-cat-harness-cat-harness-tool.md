---
# folio-assistant-fz79
$schema: bean/1.0.0
title: 'skills:docs refuses at cat-harness + cat-harness-tools main: skill-instructions/glossary-terms.md and review-comments.md are produced by no source'
status: completed
type: bug
created_at: 2026-10-10T17:19:46Z
updated_at: 2026-10-16T06:40:49Z
parent: folio-assistant-ml9h
---

Found by lane A running skill:register in an index composed from cat-harness, cat-harness-tools and sci main (2026-10-10). The chain stops at skills:docs: two pages in cat-harness/docs/reference/skill-instructions/ carry a 'Generated from' banner naming a source that publishes nothing. The script cannot tell a deleted skill from an undeclared directory (bean 3x2o) and removes nothing.

## Done when
- [x] for each page: the source skill is found declared again, or a person confirms deletion
- [x] skill:register runs to the end at main's pins

_2026-10-16_ — Completed: Verified on main (0b4df4ad37): bun run cat skills:docs:check exits 0 (359 instruction bodies up to date, glossary-terms.md present under cataloguing).
