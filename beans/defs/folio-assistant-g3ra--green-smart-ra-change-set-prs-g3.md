---
# folio-assistant-g3ra
$schema: bean/1.0.0
title: 'Green smart-ra change-set PRs (backlog group G3)'
status: completed
type: task
priority: normal
created_at: 2026-11-15T07:40:00Z
updated_at: 2026-11-15T18:02:00Z
parent: folio-assistant-v8bg
tags:
    - smart-ra
    - content
---

Thread "Rebase smart-ra change set PRs" https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9MQL6jtkEQtcg1HUwUwioBc, session https://claude.ai/code/session_01Qmmkt8JHV6bzSp4tPmwei3.

smart-ra #151 #152 #156 #158 #189 #193 #194 #196 #197 #199 #203 #218 #221 were red since 11-11 (corpus-gate / upstream-pins NEW against a 4-day-old main; #221 also crashed in site:archimate).

- [x] 2026-11-15 ~07:35Z: merged main 0440edc into all 13 (merge commits, no force-push). Heads: #151 1d8b20d7, #152 207f2929, #156 89fde658, #158 5dd90652, #189 7fa01c07, #193 5d4b7e81, #194 d389fbe2, #196 dc96f61e, #197 d6f8491e, #199 e5608772, #203 c1749fba, #218 4b645793, #221 4e4139be.
- [x] Conflicts (5): #156 p-3-5-3-f22754 (main's text + PR's Figure 3.9; also main's new p-2-1-2-a219ab refs renumbered to the PR's scheme); #189 three product-registry blocks (PR wording + main's CS-194 casing); #197 p-1-3-3-ada3f2 (PR's Patients bullet + PR clause on main's Health workers bullet + main's new bullet); #193 2f494f (main + PR parenthetical) and e359e0 (PR's Terminology Service bullet replaces main's revision of it — owner should check); #199 glossary (PR's EA/POS notations; no duplicate notations).
- [x] #221 crash root cause: one @hpcc-js/wasm-graphviz instance fails ("Out of bounds memory access") on the 11th layout. Fix cat-harness-tools#2275 (issue #2274), merged on `main` at `103bd471fe` (`2026-11-15T12:04:08Z`), and re-pinned into `smart-ra` via `smart-ra#249` (`b19e74b5e8`, merged `2026-11-15T13:10:02Z`).
- [x] #218 coordinated with the "Make smart-ra figures and tables computable" thread (cmsg_017WNUkNK8kdDziPK58Pv6G9LjtwMVTwtApxpQ2SdWyj3T); told it the new head.
- [x] Owner 07:59Z: #152 #156 #158 #199 #218 #221 to merge manager (merging on the corpus-gate waiver); #189 #193 #194 #196 held for committee; #151 #197 #203 not yet placed.
- [x] #156 re-merged main after #185 (head 65e94e95).
- [x] Owner card Q-RA-G3-3 A (08:32:01Z): 40 editing-hci-validation records (editor steps actor litlfred, agent steps Claude) pushed to smart-ra cat/dpi-h-ra/beans; corpus-gate passes locally on #152 (2/2) #156 (25/25) #158 (2/2) #218 (11/11).
- [x] Owner 08:48Z (coordinator card, confirmed to merge manager 08:49Z): #151 #197 #203 merge on green. #197 re-merged main (head a9e7d250). Card Q-RA-G3-4 A (08:48:50Z): 23 review records for #197 pushed to cat/dpi-h-ra/beans; corpus-gate 23/23 locally.
- [x] Merged on `litlfred/smart-ra` `main`: `#185` (`b8883738e0`, `07:54:51Z`), `#152` (`33d2623889`, `10:34:47Z`), `#158` (`98d367cab4`, `10:34:54Z`), `#199` (`9fa1e5695f`, `10:35:01Z`), `#218` (`4041fd5033`, `10:35:08Z`), `#221` (`13e9d3f298`, `10:35:15Z`), `#156` (`37add8ee2b`, `10:42:07Z`), `#151` (`26f4d9aad6`, `11:21:44Z`), `#197` (`d16a7ad5a5`, `11:22:08Z`), `#203` (`9503db9686`, `11:22:15Z`), plus `cat-harness-tools#2275` (`103bd471fe`, `12:04:08Z`) and `smart-ra#249` (`b19e74b5e8`, `13:10:02Z`).
- Waivers: Q-RA-VAL-2 A covered only #97 #154 #185 #190 #191 #192 #195, and php1 "FUNCTIONAL ONLY FOR smart-ra / dth-*" (11-12 09:57Z) supersedes it: these content PRs are not merged by agents. corpus-gate cannot go green without a fabricated editing-hci-validation history, so it stays red and is not a reason to push again.

_2026-11-15T07:40:00Z_ — Filed.

_2026-11-15T09:05:00Z_ — Owner placements, #156 re-merge, review records pushed.

_2026-11-15T09:30:00Z_ — #151 #197 #203 placed; #197 records pushed.

_2026-11-15T18:02:00Z_ — All 9 placed G3 change-set PRs (`#151`, `#152`, `#156`, `#158`, `#197`, `#199`, `#203`, `#218`, `#221`), `#185`, `cat-harness-tools#2275`, and `smart-ra#249` are merged on `main`; `#189`, `#193`, `#194`, `#196` remain parked as drafts held for committee per owner 07:59Z ruling. Marked `completed`.
