---
# folio-assistant-c1lo
title: 'ACCESSIBILITY: every translated page renders <html lang="en-US"> — the layout ignores the page''s lang, and Arabic gets no dir="rtl"'
status: todo
type: bug
priority: high
created_at: 2026-09-30T11:56:26Z
updated_at: 2026-09-30T11:56:26Z
parent: folio-assistant-o3xy
---

Found 2026-09-30 building the site locally (bean c592) and reading the rendered HTML, not the markdown.

Measured on a preview-site build of this branch: fr/index.html, ar/index.html and ar/glossary/index.html all open with <html lang="en-US">, and no page carries dir="rtl". The markdown declares lang: fr / lang: ar in front matter; the just-the-docs layout never reads it. Pre-existing and site-wide — every translated page, not only the new glossary ones.

Why it is high: WCAG 2.2 SC 3.1.1 (Language of Page) is Level A. A screen reader reads the French and Chinese pages with English pronunciation rules, and Arabic lays out left-to-right. The repository's own rule (bean gjli) is that UI follows accessibility guidelines.

## Done when
- [ ] the rendered <html> carries lang from the page's front matter (site default otherwise)
- [ ] ar pages carry dir="rtl" (and the navbar/tables survive it — look at a built page, not the markdown)
- [ ] a check over a BUILT site (preview-site output), since the defect is invisible in the source
