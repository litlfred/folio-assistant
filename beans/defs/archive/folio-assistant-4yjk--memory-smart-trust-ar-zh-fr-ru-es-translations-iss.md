---
# folio-assistant-4yjk
$schema: bean/1.0.0
title: 'Memory: smart-trust ar/zh/fr/ru/es translations (issue #133, draft PR #136): re-scoped 11-08 to verify main''s set; method and gotchas'
status: completed
type: task
priority: low
created_at: 2026-11-08T18:51:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-un-translations.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-trust ar/zh/fr/ru/es translations (issue #133, draft PR #136): re-scoped 11-08 to verify main's set; method and gotchas


smart-trust UN-language translations: issue litlfred/smart-trust#133, draft PR #136 (branch claude/un-translations). Thread …VgTfgdAaK8cZ7FPYJ6EN2B.

- **Re-scope (user card, 2026-11-08, "B. Verify main's set"):** main already has `translations/<lang>/{pagecontent,processes,glossary}/*.po` (2,685 strings/lang), written by `input/scripts/translation-pot.ts`; `po-status.ts --merge` levels .po with .pot. #136 dropped the old smart-base layout (input/*/translations, translations/roundtrip) and now only fixes main's set.
- **#136 is stacked on #171** (English source typo fixes, branch fix/149-english-source-typos): merge #171 first.
- **Result 11-08 (commit 670f1c5):** blind round trip over all strings: 10 drifts (ar 4, fr 2, ru 4) + ~75 minors fixed; second round trip on 261 changed strings: 1 drift fixed. po-status 2685/2685, 0 obsolete; sushi 0 errors. Records are in the PR body only (not in the repo: translations/README.md is generated from the dir listing).
- **Policy:** English content errors are translated faithfully and listed in the PR, never silently corrected. Still needs native review; stays draft.
- **Gotchas:** polib `save()` joins `#:` references onto one line; split them back to one per line. sushi needs `smart.who.int.trust-phw#0.2.0-litlfred`, which the cache seeder can't find: install it from the tarball URL in `fhir-packages.lock.json` (check sha256). Give each parallel agent its own helper folder.

**Why:** a later thread may extend this to other repos or fix the English source errors listed in #136.
**How to apply:** reuse the work3 pipeline idea (src/tr/bt JSON per component, blind BT, compare, delta round trip, write-back).
