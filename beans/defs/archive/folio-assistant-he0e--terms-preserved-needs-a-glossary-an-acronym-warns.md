---
# folio-assistant-he0e
title: 'TERMS-PRESERVED NEEDS A GLOSSARY: an acronym warns because the check cannot tell WHO to OMS from WHO dropped'
status: completed
type: task
priority: normal
created_at: 2026-09-21T12:02:00Z
updated_at: 2026-09-21T13:34:02Z
parent: folio-assistant-bzyu
---

Split out of pp93 (PR #691). translation-terms-preserved now reports a missing acronym as warn/minor rather than fail/major, because it genuinely cannot distinguish a correct localisation from a silently dropped term. That is the honest confidence, not the useful one.

A per-locale glossary would settle it: translations/<locale>/glossary.po already exists as a hand-authored PO with no POT, and schemas/translation.ts documents it. An entry mapping WHO to OMS turns the ar/es/fr/ru findings on docs/index.md from questions into passes, and leaves a genuinely dropped FHIR as the fail it should be.

## Done when

- an acronym with a glossary entry for this locale is checked against its MAPPED form, and passes when that form is present;
- an acronym with no glossary entry still warns, with the note saying so;
- a dropped acronym that the glossary says should have survived verbatim fails;
- the four acronym warns on docs/index.md are resolved one way or the other.
