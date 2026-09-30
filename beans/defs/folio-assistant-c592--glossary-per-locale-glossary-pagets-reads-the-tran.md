---
# folio-assistant-c592
title: 'GLOSSARY PER LOCALE: glossary-page.ts reads the translated .po catalogues and renders each locale''s terms'
status: todo
type: task
priority: normal
created_at: 2026-09-30T09:07:22Z
updated_at: 2026-09-30T09:10:44Z
parent: folio-assistant-lqo9
---

The one unchecked item of epic lqo9's Done when, split out 2026-09-30 so the epic's open work is a bean rather than a line: 'Labels and definitions are extracted to .pot like BPMN labels [done] ... and render per locale (next step: needs the glossary page to read the .po, which is a change to glossary-page.ts)'.

Surfaced by check:bean-rollup once lqo9's last two children (ftu0, x5o1) closed: an epic at todo with no open child asserts work its own subtree denies. The work IS still live; it had no bean.

## Done when
- [ ] folio-assistant-core/scripts/glossary-page.ts reads the glossary .po for each locale that has one and renders translated prefLabel / definition per locale
- [ ] an untranslated term shows the source text marked as untranslated, never silently English
- [ ] check:glossary covers the per-locale pages


## Measured 2026-09-30, before building — nothing to render yet
20 glossary templates exist (cat-harness/translations/<locale>/glossary/*.pot — incl. who-style-guide--who-terms.pot), and **no translated .po beside any of them**. (cat-harness/translations/<locale>/glossary.po is a different file: terminology hints for translation-block-qa.) Building per-locale rendering now would publish five locales in which every term reads 'untranslated'. Whether to build the rendering ahead of translations, or wait for the first .po, is put to the owner.
