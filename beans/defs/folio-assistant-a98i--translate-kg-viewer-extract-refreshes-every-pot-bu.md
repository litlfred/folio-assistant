---
# folio-assistant-a98i
title: translate-kg-viewer --extract refreshes every .pot but never syncs the .po stubs
status: in-progress
type: task
created_at: 2026-09-19T08:11:21Z
updated_at: 2026-10-06T19:56:02Z
tags:
  - ready-to-close
parent: folio-assistant-bzyu
---

MEASURED 2026-09-19 while adding one string to `scripts/kg-viewer-strings.ts`.

`bun run translate-kg-viewer --extract` rewrites all five `translations/<loc>/kg-viewer.pot` files and refreshes each TranslationNode manifest. It does **not** touch the `.po` stubs beside them. So a new msgid leaves every catalogue one entry short, and nothing in the tool says so — it prints `po: 0/39, manifest refreshed` and exits 0.

The shortfall surfaces only in `scripts/tests/kg-viewer-strings.test.ts` ("every locale has a stub carrying every msgid the viewer says"), which is the right gate but the wrong place to LEARN it: the tool that exists to keep catalogues in step is the one that should have done it, and an agent who runs `--extract` and sees a clean exit reasonably believes it is done.

## What I did instead, 2026-09-19

Synced all five by hand: rebuilt each `.po` from its `.pot`, preserving the file's own header (which declares the NOT-YET-TRANSLATED status and the do-not-machine-fill warning) and every existing `msgstr`. All were empty, so nothing was at risk this time — which is exactly why it is worth fixing before a catalogue has real translations in it and a careless regeneration drops them.

## Done when

- [x] `--extract` adds a missing msgid to every `.po`, with an empty `msgstr`
- [x] it NEVER overwrites an existing `msgstr` — a filled catalogue must survive
- [x] it reports what it added per locale, rather than exiting 0 silently
- [x] removing a string from the table is handled too, or the tool says it does not handle it

## Evidence

- Implemented `syncPoContent` in `cat-harness/scripts/translate-kg-viewer.ts`:
  - Syncs existing `.po` content against string entries.
  - Adds missing msgids with `msgstr ""`.
  - Preserves existing `msgstr` translations, comments, and entry flags (e.g. `#, fuzzy`).
  - Prunes obsolete msgids from `.po` if removed from string table and reports them in result.
  - Preserves file header blocks (including comments and header metadata).
  - Reports added and pruned msgids per locale during `--extract`.
- Added unit tests in `cat-harness/scripts/tests/translate-kg-viewer.test.ts` (7 tests, all passing):
  - Adds missing msgids with empty msgstr.
  - Preserves existing filled msgstr translations.
  - Prunes obsolete strings and reports them.
  - Preserves header metadata and comments.
  - Generates default header when file is empty.
  - Preserves entry flags (e.g., fuzzy).
  - Idempotent when content already matches.
- Existing string tests in `cat-harness/scripts/tests/kg-viewer-strings.test.ts` pass (17/17).
- `bun run translate-kg-viewer:check` passes with exit code 0.
- All fast quality gates (`bun run gates`) pass.

_2026-10-06T19:56:02Z_ — Claimed by claude/a98i-translate-kg-viewer-sync-po — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
