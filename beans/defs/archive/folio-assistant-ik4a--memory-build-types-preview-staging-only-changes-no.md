---
# folio-assistant-ik4a
$schema: bean/1.0.0
title: 'Memory: Build types "preview" (STAGING: only changes, no reindex) vs "full" (main, PC public comment, release); thread S-CI5, started 2026-11-01'
status: completed
type: task
priority: low
created_at: 2026-11-01T07:39:22Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `build-types.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Build types "preview" (STAGING: only changes, no reindex) vs "full" (main, PC public comment, release); thread S-CI5, started 2026-11-01


Thread "Define preview and full build types" (cmsg_017WNUkNK8kdDziPK58Pv6G9LnsQPJcTjWiA5Z3VuJbhHx), sibling S-CI5 of folio-assistant-7w1o. Questions go back to that parent thread (folio-assistant-swl0).
Status 2026-11-02 04:15Z: cat-harness#883 MERGED (3d86179). fa#2871 re-pin of cat-harness reverted: cat-harness#936 broke held ihris digest (kg:materialize:check), so #2871 is workflows-only at main pins; no new failures vs main; card Q-CI5-4 asks to merge red. Index marks reach fa with the next train once #936 is fixed.
Owner 2026-11-01 07:33Z: "preview" = no reindex, only changes; "full" = main deploy, PC public comment build and release.
Design (2026-11-01): env CAT_BUILD_TYPE (unset = full, any doubt builds full). builtAtPublish entries may say `index: true` (whole-corpus index); in a preview, derive:publish puts back main's copy from the writer-cone records instead of running it ("borrowed"). staging.json gets `buildType`; `pc:release freeze` refuses a preview build. Search index was already borrowed from main in previews (feature-staging.yml).
Measured preview 2026-11-01 run 41258956459: derive:publish 817s, Jekyll 164s, KG export 157s.
PRs 2026-11-01 (all draft, branch claude/build-types): cat-harness-tools#1220 (issue #1218), cat-harness#883 (#882), folio-assistant#2871 (#2870), folio-assistant-core#464 (#463). Merge order: tools#1220, cat-harness#883, then re-pin both in fa with #2871. Q-CI5-1 answered B by owner card 08:07Z: indexes = lsi:viz, slice:sqlite, handler:index, glossary:page, translation:status, node-kind:pages (cat-harness#883 3a). S-CI2 found uml:overview is 511 s of the 817 s preview derive (QA working copy), not an index.
