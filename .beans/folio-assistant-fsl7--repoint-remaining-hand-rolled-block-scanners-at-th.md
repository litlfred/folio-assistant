---
# folio-assistant-fsl7
title: Repoint remaining hand-rolled block scanners at the module loader
status: todo
type: task
created_at: 2026-08-08T13:25:41Z
updated_at: 2026-08-08T13:25:41Z
---

Follow-up to jwd9, which replaced the source-text scan with module imports in conjectural-propagation-audit and conditional-class-banner-audit and added write-verification to prune-transitive-deps.

Still scanning source text:

- qa-checkers-extended.ts strips uses/cites from .ts text to decide whether an LP hint refers to this block or a downstream one. It is a SYNCHRONOUS checker, so it cannot await an import; repointing needs either a sync loader or a restructure of that criterion to inspect named fields instead of doing text surgery on everything-except-three-fields.
- readBlockManifest in qa-utils.ts is regex-based but builds its kind alternation from BLOCK_KINDS, so it cannot drift. It is the sync path walkBlocks depends on. Fine as is unless a sync loader appears.

Not urgent. Filed so the remaining scanners are known rather than rediscovered.
