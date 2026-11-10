---
# folio-assistant-cysv
$schema: bean/1.0.0
title: 'One DTH scaffold and seed tool in the platform (dth init), replacing per-repo copies'
status: in-progress
type: task
priority: normal
created_at: 2026-10-31T20:35:18Z
updated_at: 2026-11-10T16:51:00Z
parent: folio-assistant-dthl
---

Owner, 2026-10-31 (card "A. Both"): pass litlfred/dth-phc#1 section 9 item 2 to its owner as a bean.

dth-sc, dth-pc and dth-phc each copied dth-hrh by hand. Each grew its own `seed_from_l1.py`, `pdf_tables.py`, `add_figures.py`, glossary validator and coverage adapter (`scripts/glossary/validate.ts`, `scripts/folio/check_l1_coverage.ts` in dth-phc).

- [x] List what each DTH repo has locally and what differs.
- [x] Propose one `dth init` (repo wiring, `needs`, mounts, package scripts, Contributor Log hooks) plus one seed tool (L1 sections to folio blocks, tables, figures with their rebuild route) in folio-assistant-core.
- [x] Say how the existing repos move to it without losing their reviewed content.

A proposal for the architect group and owner, not approved work.

## Audit Update (2026-11-10)

All Stage 1 (`dth init`) and Stage 2 (shared seed tool, glossary validator, and L1 coverage check) platform deliverables have been implemented and merged:
- `litlfred/folio-assistant-core#462` (`d6dd78ba`) & `#465` (`8267f363`): `folio_init` (`--type dth`) + shared `dth:glossary:validate` and `dth:coverage:check` (`scripts/dth/validate-glossary.ts`, `scripts/dth/check-l1-coverage.ts`).
- `litlfred/folio-assistant-core#489` (`3866d023`) & `#497` (`1b6c5fc6`): shared DTH seed tools (`scripts/dth/seed-from-l1.py`, `scripts/dth/pdf-tables.py`, `scripts/dth/add-figures.py`).
- `litlfred/folio-assistant-core#566` (`7b2d3072`) & `#569` (`03159b3c`): shared DTH `review.html` and `review.pdf` (`dth:review:html`, `dth:review:pdf`) with 30/30 tests passing in `folio-assistant-core/test/dth-tools.test.ts` and `folio-assistant-core/test/dth-review.test.ts`.
- `litlfred/smart-base#270` (`8f7426f1`) & `litlfred/cat-harness-tools#1705` (`742fa238`): shared `sushi-config.yaml` and `index.config.json` DTH layer wiring.
- **Per-repo migration status:** 3/5 DTH repos (`litlfred/dth-hrh#72` `efdc6b67`, `litlfred/dth-sc#8` `d2a51703`, `litlfred/dth-phc#7` `547ef610`) have merged their Stage 1 + Stage 2 cutovers onto `main`; `litlfred/dth-pc#8` (`391d0e8f`) and `litlfred/dth-sfp#6` (`b3fa0828`) remain open on their content branches (deferred under the `dth-*` content hold).
