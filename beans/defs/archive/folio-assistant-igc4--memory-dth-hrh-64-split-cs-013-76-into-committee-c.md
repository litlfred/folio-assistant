---
# folio-assistant-igc4
$schema: bean/1.0.0
title: 'Memory: dth-hrh #64 split (CS-013/#76) into committee change sets #78/#81 BPMN, #79/#82 personas, #80/#83 DMN, #84/#85 glossary; checks in core#515'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `cs-013-hrh-split.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: dth-hrh #64 split (CS-013/#76) into committee change sets #78/#81 BPMN, #79/#82 personas, #80/#83 DMN, #84/#85 glossary; checks in core#515

Thread "Split the HRH processes, personas and decision tables" (cmsg_017WNUkNK8kdDziPK58Pv6G9P2GGAjGMvE2u8HqJwVqJE8), 2026-11-01.
- #64 split off main 746894d, block files byte-identical; review-anchors.json composed per set.
  - BPMN: issue #78, draft PR #81 (branch claude/hrh-bpmn-processes; includes Ch5 scen reorder)
  - Personas: issue #79, draft PR #82 (claude/hrh-persona-links)
  - DMN: issue #80, draft PR #83 (claude/hrh-dmn-tables)
- Sets cross-link (meta relatedBlocks, BP-06 lanes -> new Ch6 personas): soft refs, resolve once all land.
- Committee content: NEVER merge; issues stay open. Watcher thread got all numbers.
- Q-SPLIT-1 A (owner tap 19:22Z): glossary acronyms = 4th change set #84 / draft PR #85 (claude/hrh-glossary-acronyms); validate.ts checks -> folio-assistant-core#515; docs/l2-wiring.md update WAITS until #78-#80 are decided (todo for this thread).
- Remote-mount script run was blocked in-session, so checks were not run locally.
Related: folio-assistant-wyqi, folio-assistant-8nm4.
- 2026-11-01 19:40Z (owner A on CS-007, via CS-007 thread): dth-hrh#69 moved onto main by merge commit d256eee (no rewrite), base=main, draft. Kept: 41 council focus, members, build script, dpi-h-ra 7aaec92. Focus on 11 org terms + MoH scopeNote WAIT for #85 (terms come from acronyms). Watching #69.
- 20:02Z Q-DMN-1 A: render DMN tables from .dmn in the platform -> cat-harness-tools#1323 (coordinator asked for a separate thread). After it lands + re-pin, remove hand-written rule tables from dt-*.md in #83. DT-01 separator fixed (12945aa). Site-publish runs cancel each other: dispatch one at a time.
- #64 closed as superseded (19:55Z); #76 closed by watcher. #70 (CS-014) merged main 3b375eb.
- 20:05Z owner "+6hr window" (19:36Z, cmsg_017WNUkNK8kdDziPK58Pv6G9QALW4qBbwo6x1G62v5wc87, to 01:36Z); coordinator: merge #87 (glance links, issue #86) when green. Marked ready.
- DT-02 audit (20:06Z): FR-LC-02 in text = renewals/CPD/reminders, but DT-02 uses it as "history preservation"; revocation, reinstatement, emergency deployment and evidenceStatus values are not in the text. Reported to owner.

## 2026-11-01 ~20:30Z
- Raw-id scan of all DTHs: /mnt/project-files/dth-id-scan/scan.md (hrh clean; sc/phc/sfp/pc 21-95 files each). DTH voice = smart-base who-digital-transformation-handbook (9 rules, none on references). Card Q-IDS-1 (A voice rule + QA check recommended) open.
- #87 conflicted with CS-001 revert (#74); merged main at f70e531 keeping "Minimum Data Set" titles. Merge when green (window to 01:36Z).
- Q-IDS-1 A tapped 20:28Z: core#521 issue; core#522 (check-reader-ids.ts, report-only, --strict fails) and smart-base#273 (voice rule refer-by-number-and-title-not-by-id, 10 rules), both draft + watched. Handbook text fixes are separate work.
- HOLD: don't touch #69's ArchiMate links (CDE-HWR, NHWA Dataset) until Q-L2P-5 answered in L2 plan thread.
- #85 publish failed: check:dth-glossary refuses 'iHRIS'. Fix core#523 (draft, watched). After merge + re-pin, republish #85 preview.
- Log CS map: CS-014 #70/#77, CS-015 #81/#78, CS-016 #82/#79, CS-017 #83/#80, CS-018 #85/#84, CS-019 #87/#86, CS-007 #69/#47. #87 is logged as change set CS-019, so owner tapped Q-GLN-1 A (20:35Z): merge when green.
- 20:40Z: #69 dropped NHWA/CDE link swaps on 6 blocks (4b35299); NHWA overlay PR (claude/dth-hrh-nhwa-overlay, L2 plan thread) owns them. HOLD lifted.
- 20:48Z #83 f8baace: tools re-pin f5c959d (#1324), dt tables -> <!-- dmn:table -->. chain3 (bg) republishes dmn-tables + org-focus after chain2. Then send watcher preview links.
- 21:02Z #87 MERGED ea40122 (Q-GLN-2 A).
- Preview links: only send after pages-build-deployment (gh api repos/litlfred/dth-hrh/actions/workflows/384224689/runs) succeeds for a gh-pages commit at/after the publish (core#565). Raw gh-pages != live.
- 22:34Z #83 f8baace publish FAILS: tools f5c959d expects l1-extraction-pages/iris-pages Tool nodes (pin skew with smart-base/who-iris). Asked DMN-renderer thread which pins go together. PR checks unaffected.
- 22:43Z core#523 marked ready (full tier). Merge when green under owner's 20:40Z 'merge all green and ready (not content) + 6hrs' (cmsg_017WNUkNK8kdDziPK58Pv6G9NdqkvnprnzAj2kus7uVRD1), to 02:40Z. Then re-pin core in dth-hrh #85 and republish.
- Re-pin lesson: editing index.config.json alone leaves index.lock.json stale -> publish mixes tools versions and fails. Lock must be regenerated (remote-mount.ts; I can't run it, ask DMN-renderer thread). #83 lock fixed 88e548a; chain4 (bg) republishes.
- #69 preview blocked until #88 (NHWA overlay) lands; then merge main into #69 and republish.
- 23:37Z core#523 MERGED. Asked coordinator to route a dth-hrh core re-pin (needs lock regen); then merge main into #85 and republish.
- 04:30Z #85 merged main (core re-pin #90, 22c2861) at d9ed7c8; chain5 (bg) republishes. Also check #88 status for #69.
- 04:51Z previews live: #85 glossary, #83 DMN (deploy 810de35). Sent to watcher + user. Remaining: #69 waits #88; core#522/smart-base#273 drafts watched; #81/#82/#83/#85 committee drafts (never merge).
- 11-07 16:05Z: core#522 MERGED (owner fixed CodeQL + reference-direction). #88 merged; #69 merged main 354fbea (main's pins), chain6 republishes. smart-base#273 still draft.
- 11-12 06:50Z: #70 fixed jsonld ns (d324485). #69 red external-schemas:check (ORG/FOAF) -> cat-harness#1261 draft watched; then dth-hrh re-pin cat-harness. Owner marked #69/#70/#85 ready 06:05Z (their call; still never merge content myself).
- 11-12 07:10Z: owner merged #85 (CS-018); issue #84 stays open (committee). #70 green at d324485. cat-harness#1261 green, owner marked ready, handed to merge manager (coordinator: merge window covers it); then dth-hrh cat-harness re-pin + merge main into #69.
- 07:10Z owner merged #70 (CS-014); issue #77 stays open.
- 08:15Z dth-hrh#119 (cat-harness re-pin, branch claude/repin-cat-harness-org-foaf) red: cat-harness main needs newer tools (web-app kind) + layer locks disagree. Needs bottom-up cascade core -> smart-base -> smart-ra/who-iris -> dth-hrh; coordinator handed it to merge manager (smart-ra needs owner OK). #69 waits on that.
