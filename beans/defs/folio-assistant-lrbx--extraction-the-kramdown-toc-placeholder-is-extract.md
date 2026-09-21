---
# folio-assistant-lrbx
title: 'EXTRACTION: the kramdown {:toc} placeholder is extracted as translatable prose, and translators dutifully translate it'
status: todo
type: task
priority: normal
created_at: 2026-09-21T13:22:39Z
updated_at: 2026-09-21T13:22:39Z
parent: folio-assistant-bzyu
---

Found while doing he0e (PR #691). `1. TOC` at docs/guides/agent-onboarding.md:20 is the list item kramdown REPLACES with the generated table of contents, immediately followed by `{:toc}`. Its text never reaches a reader in any language.

pot-extract.ts picks it up as a translatable string anyway, and the Arabic and Russian translators rendered it — ar has جدول المحتويات. That is a sensible human reading of a string that should never have been offered to them, and it cost real translator attention.

he0e worked around it: TOC is marked `#, localised` in every glossary, with a comment saying why, so translation-terms-preserved stops asking. That silences the symptom and records the cause; it does not fix it.

## Done when

- a kramdown attribute-list directive and the placeholder it consumes are not extracted as translatable strings;
- the existing TOC entries in ar/ru POs are obsoleted rather than left as live msgids;
- the TOC entry can come out of the five glossaries;
- checked against a folio other than this one, since extraction is shared by every instance.
