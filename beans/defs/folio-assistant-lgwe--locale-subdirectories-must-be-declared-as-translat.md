---
# folio-assistant-lgwe
title: Locale subdirectories must be declared as translated content and filtered from the navbar
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T07:27:41Z
updated_at: 2026-09-19T07:51:03Z
---


_2026-09-19T07:51:03Z_ — Implemented on claude/translated-locales-navbar (PR #351). Declaration: two new graph kinds in BASE_GRAPH_KINDS — `translation-sources` for `translations/` (previously undeclared entirely, the dh4f defect in reverse) and `translated-content` for the ten rendered locale directories — plus a `locale` field on ContentDirectory that is REQUIRED on the first kind and REFUSED anywhere else. Nothing reads a language subtag out of a path. Navbar: `nav_exclude: true` on all ten translated pages takes them out of the statically-built nav (just-the-docs builds it once, for every reader, before anybody picks a locale — no client-side work substitutes for that), and `mountNavLocale` in docs-ui.js swaps each item IN PLACE from `docs/_data/translations.json` when a non-source locale is selected. Fallback is the absence of a rewrite rather than a branch. Three states recorded as `data-fa-nav-index`: ok / empty / unknown, with the index published as `null` when the data file was absent so 'could not tell' never renders as 'there are none'. Gates: 2201 unit tests, 90 e2e (10 new, verified to fail with the filter disabled), eslint, kg:audit:check, readme:sync:check all green. Adjacent finding filed separately as bean d2kp: the `gen-docs-pages --check` gate is a folded YAML line and has never run, and un-folding it is not a one-line fix because those pages embed live QA verdicts.
