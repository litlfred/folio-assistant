---
# folio-assistant-nbal
$schema: bean/1.0.0
title: 'URL SPACE (producer half): the declared enabled field and one resolver for an instance''s published path, in cat-harness'
status: completed
type: task
created_at: 2026-10-20T15:21:53Z
updated_at: 2026-10-20T15:21:53Z
parent: folio-assistant-yj32
---

Producer half of cat-tools-sthf (the consumer half, in the cat-harness-tools store) and of the core/cat-harness pointer folio-assistant-o7eq. Filed 2026-10-20 by the drain coordinator (session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6) after lane B2 measured that sthf cannot start in cat-harness-tools: the enabled field is absent from schemas/cat-harness.ts, and no function composes an instance's published URL (root-index.ts, kg-export.ts and sync-docs-harness.ts each compose their own).

Rulings it implements (recorded in sthf/o7eq): the URL segment is the instance NAME; the declared graph is a path segment; the root has no segment (its docs/ is installed by cat-harness and served at <base>/); three cases — <base>/ (root), <base>/<instance>/ (the instance as itself), <base>/<owner>/<graph>/<subject>/ (a viewer of another instance's assets).

## Done when

- [ ] enabled is a declared field on the instance declaration, default enabled, so a disabled instance is a declaration and not an absence
- [ ] one resolver in cat-harness composes the published path for the three cases, with tests
- [ ] cat-tools-sthf names this bean as done, so its consumers can switch

## 2026-10-20 — in review

litlfred/cat-harness#376, commit 1ef09a59: `schemas/url-space.ts` (`publishedPath`, `isPublished`), `enabled` on the declaration, tests. Close when it merges; then tell cat-tools-sthf its producer half is in.

## Summary of Changes

Merged 2026-10-20 as litlfred/cat-harness#376 (5f17a92). `schemas/url-space.ts`: `publishedPath` for the three ruled cases and `isPublished` (enabled by default); `enabled?: boolean` on the declaration; `property-skills.ts` records `enabled` as a gap (no skill edits it yet). cat-tools-sthf can switch its consumers once cat-harness is re-pinned past 5f17a92.
