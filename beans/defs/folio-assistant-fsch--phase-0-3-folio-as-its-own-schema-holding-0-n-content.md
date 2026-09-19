---
# folio-assistant-fsch
title: Phase 0.3 — `folio` as its own schema holding 0..n Content instances (#223)
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-19T00:41:16Z
---

From [issue #223 comment](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5726628913).

Today `folio.config.json` carries a single `contentType` and a single adapter,
so *a folio* and *a content instance* are the same object. Making a folio a
container of zero-or-more instances touches `adapterForKind`,
`content/pipeline/profile-check.ts`, the render path and the viewer.

**Do this before the `content/` → `folio/` rename** (bean `rnfl`): a rename
lands cleanly on a settled model; a settled model does not land cleanly on a
corpus mid-rename.

Gate: `content_validate` passes on a zero-instance folio **and** on a
two-instance folio.

_2026-09-19T00:41:16Z_ — Checked 2026-09-19 on main at 17dc1e6 — GENUINELY LIVE, not started. harness.config.example.json still carries a single 'contentType' key (line 3, value 'document') and describes it as selecting one adapter and one profile, so a folio is still one content instance. This bean's own gate — content_validate passing on a zero-instance and on a two-instance folio — cannot be met by the current model.
