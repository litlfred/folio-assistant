---
$schema: folio-memory/v1
id: locale-directories-are-declared-not-inferred
label: trap
summary: "a locale directory is translated content because the declaration says so, never because of its name"
createdAt: 2026-09-19
agents:
  - platform-boundary-guard
---
`docs/fr/` is French because `cat-harness.json` declares it `locale: "fr"`,
`graphs: ["translated-content"]`. **Never** match a directory name against a
list of language subtags: a `no/` chapter is silently hidden, a `pt-BR/` or
`translated-fr/` directory is silently shown as source, and neither announces
itself. The DIRECTORY says what to expect; the FILE says what it is (`lang`,
`translation_source`). `translation:index:check` fails when they disagree.
`nav_exclude: true` is the half JS cannot do — just-the-docs builds the nav
once, for every reader, before anybody picks a locale. Full rule:
`skills/folio-core/translation-manager.md#the-navbar-filters-by-locale`.
