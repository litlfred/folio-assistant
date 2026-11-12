---
# folio-assistant-decn
$schema: bean/1.0.0
title: 'Memory: Review page inline default, back link, named anchors; 🔗 icon on doc pages; check-anchors QA (cat-harness-tools#1383, #1388, cat-harness#957)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-page-inline-default-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Review page inline default, back link, named anchors; 🔗 icon on doc pages; check-anchors QA (cat-harness-tools#1383, #1388, cat-harness#957)

Thread "Default review page to inline changes" (cmsg_017WNUkNK8kdDziPK58Pv6G91D1Q1jm8poFf9XDk1SNsEa). Owner asks 2026-11-02; mockups https://claude.ai/artifact/Df1xQwPoozafCbRX7HrGq8 approved (A, 06:54Z).
- cat-harness-tools#1383 (issue #1382, branch claude/review-inline-structured): every block opens Inline (`@structured` is a fallback), "Back to the document" link (id source-docs), anchors: chapter `#<doc>/<chapter>`, section `#<doc>/<chapter>/<sec label>`, block `#<label>` + 🔗 copy button; "No visible text change" note for metadata-only edits.
- cat-harness-tools#1388 (issue #1386, branch claude/doc-anchor-icons): edit-links runtime puts 🔗 first in each .block-actions and on every h2-h4[id] (theme a.anchor-heading hidden); scripts/check-anchors.ts reports (not gates) in build-instance-site. Paired cat-harness#957 regenerates site-chrome/assets/js/edit-links.js (tools test compares it); merge both together.
- Document pages inline the runtime (compactActionsScript), so they update on rebuild.
- ALL MERGED: cat-harness#957 b9fe9f7 (07:26Z), tools#1388 67df948 (08:10Z), tools#1383 7237894 (08:56Z). dth-hrh L2 pilot thread asked to re-pin + restage #88. tools#1397/cat-harness#970 (another thread) switch edit-links `catch (x)` to `catch {` for folio lint; keep that form.
- Local testing: clone bootstrap-tools + cat-harness as file: deps, `bun install --no-save`, then restore package.json/bun.lock; CAT_HARNESS_ROOT=<cat-harness clone>.
Related: folio-assistant-q9rj, folio-assistant-9y9s.
