---
# folio-assistant-eqly
title: 'validate: a block on disk listed in no section, or listed and absent, is not a validation finding'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T15:52:13Z
updated_at: 2026-10-05T06:53:22Z
parent: folio-assistant-0lmb
---

Recorded from the qou orphaned-content census, 2026-10-04 (ORPH report; session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91, issue #2106). qou: 3 of 3,676 block manifests are in no chapter section and render nowhere, each with .md, .ts and a QA sidecar (e.g. prop:atomic-q-reeb-universal-rho). cat-harness validate.ts has no rule for 'on disk, in no section' or 'in a section, not on disk'. Proposed: one rule, both directions, reported per block.

_2026-10-05T06:48:05Z_ — Claimed by claude/eqly-orphan-blocks — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## Progress 2026-10-05 (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi)
Branch claude/eqly-orphan-blocks. Rule `no-unlisted-block` added to validate.ts (warning, per block, `[unlisted-block]`); only manifests that parse as a Block count; a chapter with a section reference reports `info` (undetermined) instead. The 'listed, absent' direction already existed (`Block manifest not found`, error) and is now pinned by a test. Measured against qou c452a0f9 with a manifest-membership approximation: exactly 3 of 3,676 unlisted, matching the census.
