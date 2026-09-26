---
# folio-assistant-a98i
title: translate-kg-viewer --extract refreshes every .pot but never syncs the .po stubs
status: todo
type: task
created_at: 2026-09-19T08:11:21Z
updated_at: 2026-09-19T08:11:21Z
parent: folio-assistant-bzyu
---

MEASURED 2026-09-19 while adding one string to `scripts/kg-viewer-strings.ts`.

`bun run translate-kg-viewer --extract` rewrites all five `translations/<loc>/kg-viewer.pot` files and refreshes each TranslationNode manifest. It does **not** touch the `.po` stubs beside them. So a new msgid leaves every catalogue one entry short, and nothing in the tool says so — it prints `po: 0/39, manifest refreshed` and exits 0.

The shortfall surfaces only in `scripts/tests/kg-viewer-strings.test.ts` ("every locale has a stub carrying every msgid the viewer says"), which is the right gate but the wrong place to LEARN it: the tool that exists to keep catalogues in step is the one that should have done it, and an agent who runs `--extract` and sees a clean exit reasonably believes it is done.

## What I did instead, 2026-09-19

Synced all five by hand: rebuilt each `.po` from its `.pot`, preserving the file's own header (which declares the NOT-YET-TRANSLATED status and the do-not-machine-fill warning) and every existing `msgstr`. All were empty, so nothing was at risk this time — which is exactly why it is worth fixing before a catalogue has real translations in it and a careless regeneration drops them.

## Done when

- [ ] `--extract` adds a missing msgid to every `.po`, with an empty `msgstr`
- [ ] it NEVER overwrites an existing `msgstr` — a filled catalogue must survive
- [ ] it reports what it added per locale, rather than exiting 0 silently
- [ ] removing a string from the table is handled too, or the tool says it does not handle it
