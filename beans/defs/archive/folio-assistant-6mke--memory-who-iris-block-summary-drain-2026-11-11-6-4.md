---
# folio-assistant-6mke
$schema: bean/1.0.0
title: 'Memory: who-iris block summary drain 2026-11-11 — 6,444 blocks/187 entries, 16 agents, branch claude/iris-block-summaries stacked on #217, Q-SUM-1 language card'
status: completed
type: task
priority: low
created_at: 2026-11-11T00:07:03Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `iris-block-summaries-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: who-iris block summary drain 2026-11-11 — 6,444 blocks/187 entries, 16 agents, branch claude/iris-block-summaries stacked on #217, Q-SUM-1 language card


Thread "Write summaries for all library assets" (cmsg_017WNUkNK8kdDziPK58Pv6G9VCWXXaJxjKVF8xNjpQFvuw), user asked 2026-11-11 00:01Z "Spawn agents to do summaries for all assets in the library".

- Backlog on #217's branch claude/iris-derived-kg: 6,444 prose blocks in 187 who-iris entries (`bun run cat summaries` after `bash .github/mount-from-lock.sh --root .` + `bun install` in who-iris).
- Storage: existing flow, library/<entry>/summaries.json via `bun run cat summaries:record -- drafts.json`; drafted_by {kind agent, id claude-code, model "not-disclosed", session}; state draft; lang en. IRIS thread agreed (page shows them as agent drafts, separate from IRIS abstract).
- Work files (ephemeral container): /tmp/claude-0/sum/{chunks,drafts,PROMPT.md,check.py}; 191 chunks, 16 agents. Copy final drafts to /mnt/project-files/iris-summaries-2026-11-11/.
- Plan: one PR on litlfred/who-iris branch claude/iris-block-summaries, base claude/iris-derived-kg; WHO content → merge via card.
- Q-SUM-1 = B (user 01:27Z): English + document language. Second round: 10 agents, /tmp/claude-0/sum/l2 (3,175 blocks ru/ar/zh/fr/es/pt/fa; en+fr bilingual entries skipped).
- English recorded: who-iris#221 (draft, base claude/iris-derived-kg, issue #220), backlog 6,444 → 0. 68 unsummarised blocks remain in mounted cat-harness/library/process (other repo, not done).
- Tools fix cat-harness-tools#1839 (issue #1838): record adds a draft in a new language beside a current summary. Needs merge + who-iris re-pin before recording the second language.
- Source problems list: /mnt/project-files/iris-summaries-2026-11-11/source-oddities.md (incl. 10665-381036 "do not distribute further").
- 01:34Z user: summaries in all 6 UN languages for every block. Round 3 = translations of English into ar/zh/es/fr/ru (37,405; /tmp/claude-0/sum/l3, 14 agents un-00..13). Round 2 (doc-language from source, /tmp/claude-0/sum/l2) all OK.
- English draft corrections found by round 2: /tmp/claude-0/sum/en-fixes.json (7 blocks) + matching translations l3-overrides.json (28). Final record plan: reset summaries.json to base, record en (fixed), l2, l3 (+overrides).
- cat-harness-tools#1839 MERGED 01:35Z (8a81ffe); no who-iris re-pin needed (stored slot format unchanged).
- Q-ODD-1 = A (user 01:56Z): fix extraction (OCR quality, whole-book blocks, boundaries, 202203 lang) + errata notes for WHO errors; sensitive content untouched. Asked coordinator for a separate thread; re-derived blocks → redraft summaries in 6 langs.
- 02:00Z user merged #217 and #221 to main. Doc-language drafts (3,175) recorded on branch claude/iris-summaries-un → draft who-iris#222 (base main). UN translations go on the same PR. 7 wrong English drafts: ask user to reject in narratives (en-fixes.json in project folder); translations use l3-overrides.json.
- 02:14Z user said 'redraft': 7 wrong English drafts replaced in #222 (6b25988b) via a schema-validated script, old drafts under superseded. Translations of those 7 use l3-overrides.json.
- 02:40Z: 37,405 UN translations recorded → #222 (5ab40dfc); all 8,085 who-iris blocks have ar/zh/en/es/fr/ru. Process: skill core#730 (anchors #summaries-in-every-language, #translating-a-summary), tool tools#1847 (summaries:next --lang, owed per locale). IRIS extraction thread owns BPMN steps (branch claude/ingest-process-extraction-steps) and will send re-derived entry list → redraft stale summaries in 6 langs.
- 02:35Z tools#1847 merged (b67e319), core#730 merged (75427f4).
- Q-SUM-2 = A (user 02:47Z): who-iris#222 merged 02:47Z (d9978060). Other layers' libraries (cat-harness, core mounts) still owe 3,146 blocks per language — not started.
- 11:50Z round 4 (re-extraction, who-iris#239 branch claude/iris-rederive): 907 owed blocks (778 new, 129 stale) → 52 chunks, 18 agents write all 6 UN langs (+pt/fa) per block in /tmp/claude-0/sum4; work branch claude/iris-resummarise stacked on #239. Record en first (replaces stale slot), then one file per other language. Moved /home/user/folio-assistant-core to /home/user/litlfred/ (it broke bun workspaces in who-iris).
- 12:15Z round 4 recorded: 907 blocks × 6 UN langs (+pt 6, fa 68) → who-iris#241 (draft, base claude/iris-rederive = #239), issue #240. Backlog 0. Oddities: /mnt/project-files/iris-summaries-2026-11-11/round4/oddities.md (75211 mistitled sections, 94830-per acronym OCR, 192500 ar unreadable, possible WHO errata: 331525-rus p096 rifamycins "inhibitors"). Merge = content card after #239 merges.
- Q-SUM-3 = A (user 12:22Z): merge #241 right after #239 merges (retarget to main, release label before ready, full-tier green per folio-assistant-36f6). Subscribed to #239.
- 12:26Z source-fix thread: tools#1890 fixes 75211 titles, 94830-per acronyms, 192500 Arabic, caption titles; it will re-derive 75211, 94830-per, 192500, 353150, 353151, 329296, 43699, 344249-chi and send a list → round 5 redraft in 6 langs (same flow, /tmp/claude-0/sum4 scripts). 94830-per p47 'Annex 2' = our OCR, not WHO.
- 13:35Z round 5: #243 (claude/iris-extraction-round2, stacked on #239) merged into claude/iris-resummarise (e2e8f826f, took #243's summaries.json for 6 entries), re-recorded 88 surviving round-4 drafts (uncommitted), 292 blocks owed → /tmp/claude-0/sum5, 21 chunks, 11 agents. Then commit, push, retarget #241 base to claude/iris-extraction-round2.
- 14:00Z round 5 recorded → #241 head 4dcc11bac, base now claude/iris-extraction-round2 (#243); backlog 0. Merge order #239 → #243 → #241 (Q-SUM-3 A covers #241; full tier first). Oddities round5/ in project folder; sent to source-fix thread.
- 11-12 01:15Z round 6: #251 (claude/iris-extraction-round3, stacked on #243) merged into my branch (00a809150), took #251's summaries.json for 10 entries, re-recorded 271 surviving drafts (uncommitted), 128 owed → /tmp/claude-0/sum6, 9 chunks, 5 agents. Then commit, push, retarget #241 to claude/iris-extraction-round3. 192500 p1: no numbers (tools#1924 pending).
- 11-12 ~01:45Z round 6 recorded → #241 head bd2c24b44, base claude/iris-extraction-round3 (#251). Order #239 → #243 → #251 → #241. Backlog 0.
