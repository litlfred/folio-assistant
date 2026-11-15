---
# folio-assistant-g3ra
$schema: bean/1.0.0
title: 'Green smart-ra change-set PRs (backlog group G3)'
status: in-progress
type: task
priority: normal
created_at: 2026-11-15T07:40:00Z
updated_at: 2026-11-15T07:40:00Z
parent: folio-assistant-v8bg
tags:
    - smart-ra
    - content
---

Thread "Rebase smart-ra change set PRs" https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9MQL6jtkEQtcg1HUwUwioBc, session https://claude.ai/code/session_01Qmmkt8JHV6bzSp4tPmwei3.

smart-ra #151 #152 #156 #158 #189 #193 #194 #196 #197 #199 #203 #218 #221 were red since 11-11 (corpus-gate / upstream-pins NEW against a 4-day-old main; #221 also crashed in site:archimate).

- [x] 2026-11-15 ~07:35Z: merged main 0440edc into all 13 (merge commits, no force-push). Heads: #151 1d8b20d7, #152 207f2929, #156 89fde658, #158 5dd90652, #189 7fa01c07, #193 5d4b7e81, #194 d389fbe2, #196 dc96f61e, #197 d6f8491e, #199 e5608772, #203 c1749fba, #218 4b645793, #221 4e4139be.
- [x] Conflicts (5): #156 p-3-5-3-f22754 (main's text + PR's Figure 3.9; also main's new p-2-1-2-a219ab refs renumbered to the PR's scheme); #189 three product-registry blocks (PR wording + main's CS-194 casing); #197 p-1-3-3-ada3f2 (PR's Patients bullet + PR clause on main's Health workers bullet + main's new bullet); #193 2f494f (main + PR parenthetical) and e359e0 (PR's Terminology Service bullet replaces main's revision of it — owner should check); #199 glossary (PR's EA/POS notations; no duplicate notations).
- [x] #221 crash root cause: one @hpcc-js/wasm-graphviz instance fails ("Out of bounds memory access") on the 11th layout. Fix cat-harness-tools#2275 (issue #2274), draft. smart-ra picks it up on its next cat-harness-tools re-pin; #221 stays red on publish until then.
- [x] #218 coordinated with the "Make smart-ra figures and tables computable" thread (cmsg_017WNUkNK8kdDziPK58Pv6G9LjtwMVTwtApxpQ2SdWyj3T); told it the new head.
- [ ] CI on the 13 heads.
- Waivers: Q-RA-VAL-2 A covered only #97 #154 #185 #190 #191 #192 #195, and php1 "FUNCTIONAL ONLY FOR smart-ra / dth-*" (11-12 09:57Z) supersedes it: these content PRs are not merged by agents. corpus-gate cannot go green without a fabricated editing-hci-validation history, so it stays red and is not a reason to push again.

_2026-11-15T07:40:00Z_ — Filed.
