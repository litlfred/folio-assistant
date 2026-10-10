---
# folio-assistant-fz79
title: 'skills:docs refuses at cat-harness + cat-harness-tools main: skill-instructions/glossary-terms.md and review-comments.md are produced by no source'
status: todo
type: bug
created_at: 2026-10-10T17:19:46Z
updated_at: 2026-10-10T17:19:46Z
parent: folio-assistant-ml9h
---

Found by lane A running skill:register in an index composed from cat-harness, cat-harness-tools and sci main (2026-10-10). The chain stops at skills:docs: two pages in cat-harness/docs/reference/skill-instructions/ carry a 'Generated from' banner naming a source that publishes nothing. The script cannot tell a deleted skill from an undeclared directory (bean 3x2o) and removes nothing.

## Done when
- [ ] for each page: the source skill is found declared again, or a person confirms deletion
- [ ] skill:register runs to the end at main's pins
