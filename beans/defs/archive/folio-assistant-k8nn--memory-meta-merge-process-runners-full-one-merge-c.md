---
# folio-assistant-k8nn
$schema: bean/1.0.0
title: 'Memory: Meta-merge process (runners full): one merge-commit branch per repo, merged without CI; first run 11-02 07:03Z on 3 harness repos'
status: completed
type: task
priority: low
created_at: 2026-11-02T07:04:42Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `meta-merge-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Meta-merge process (runners full): one merge-commit branch per repo, merged without CI; first run 11-02 07:03Z on 3 harness repos


Thread "Consolidate queued PRs into one meta-merge" (cmsg_017WNUkNK8kdDziPK58Pv6G9KFRqmaNst8GCREzncWoicQ). User 06:57Z: when runners are full, cancel queued CI, pause new pushes, merge all ready PRs on one meta-merge branch, skip CI, merge. User wants this as a repeatable skill/process across repos, coordinated with swarm siblings, plus a formal merge-manager agent role/skills/process (bits are in the KG already).
Script: /mnt/project-files/meta-merge/meta-merge.sh (skips conflicts, .github/workflows/, subscriptions/).
Q-META-1 = A then the user added B (red ones too). Merged 07:03Z: tools#1385 (#1376 #1359 #1129 #1357), cat-harness#956 (#955 #954 #953 #951 #934 #932 #896), fhir#274 (#273). GitHub marks the included PRs merged automatically.
Merging the meta PR via the API was allowed after the card. A PR not named on the card (tools#1384) was refused by the safety check, so name every PR on the card.
Kept started main push runs (Q-CIS-1). Left out: cat-harness#885 (conflict on translations .pot), tools#1384 (card Q-META-2), drafts #1383 #1381, #1354 (security).
Related: folio-assistant-6pek, folio-assistant-90xf.
07:12Z: skill PR cat-harness#959 (draft, issue #958, subscribed). The SKILLS.md row was written by hand (readme:sync needs bootstrap-tools). Q-META-2 card (merge tools#1384) and Q-MGR-1 card (merge manager formalization: A text/JSON PR then BPMN PR) are open. Inventory: /mnt/project-files/meta-merge/merge-manager-inventory.md. Main check scheduled for 07:25Z.
07:30Z Q-MGR-1 = B: one PR #959 now holds actor scenarios/actors/merge-manager.json, skill merge-manager-watcher, processes merge-manager-watch.bpmn and saturation-meta-merge.bpmn (+SVG, checklists, .pot). Generator script: scratchpad gen2.py. Local tooling: render/checklist/readme need sibling bootstrap-tools clone + /home/claude/node_modules -> cat-harness-tools/node_modules, and fhir-harness moved out of /home/claude (its glossary kind breaks the scan). fhir main gate run 41403829696 re-run (cancelled by #1384 bug).
07:40Z Round 2: Q-META-3 = B (user "B A" relayed by coordinator; A was Q-IND-2). Merge API DENIED by safety check because the answer was relayed, not tapped in this thread. Re-asked as Q-META-4. Open meta PRs: cat-harness#965, tools#1395, core#601, sci#170, smart-base#289 (branch claude/meta-merge-2026-11-02b). who-iris#169 already merged. Cancelled PR runs log: scratchpad cancelled-round2.tsv (includes non-member PRs: core slash-iris/human-change-sets/#600, tools #1392 #1394 etc.).
LESSON: the merge card must be tapped in the thread that merges; a relayed answer is refused.
07:55Z Round 2 MERGED on Q-META-4 A (tap in this thread worked): cat-harness#965, tools#1395, core#601, sci#170, smart-base#289; stacked cat-harness#962 #964, core#597 closed as landed. Hold lifted. Open: Q-META-2 (tools#1384), #959 draft (lessons pushed a9cb526). Recheck of main gates at 08:24Z.
09:20Z final main check: NEW reds after round 2: cat-harness 6d0d5a4 main-qa (kg-export, declaration-resolution, publish:derive, root:lint); core 24c64bd main-qa (check:voices + 6 tests glossary-skos-automated, library-ref). fhir red pre-existing. Asked coordinator who fixes.
09:35Z diagnosis: both new reds are pin skew (gates use fa pins tools f92092e / cat-harness 1b22283). cat-harness#961 tracked-watch needs tools 24a51d05 process inputs; core voices needs cat-harness library/conduct/ (6d0d5a4). Fix = re-pin train fa#2908 (tools 67df948, ch 6d0d5a4, core 971e66b). Told train thread; recheck after #2908 merges. LESSON: meta-merge members that need newer sibling layers go red until the fa re-pin lands.
09:33Z Fa reds thread (…BbaFk6c5F5NCsTkzWpJ1eZ) wants a ping when the cat-harness kg-export red clears (it blocks tools#1399 via subgraph-node-checkout.test ENOENT todos.jsonld). Q-META-5 card posted (5 fixes unblocking fa#2908).
10:05Z Q-META-5 = A (tap here, cmsg_017WNUkNK8kdDziPK58Pv6G97v1EcM3Y4uL3NngucgzBk6): tools#1394 #1397, cat-harness#968 #970, core#603 marked ready, subscribed; merge each on green (merge commit), then tell re-pin train thread …MmDK4f and Fa reds thread …BbaFk6.
10:26Z fa#2908 replaced by fa#2911 (repin-train/20261102-1022). tools#1394 merged main in (3e84aae, comment-only conflicts with #1401). #1397/#970 belong to train thread (Q-TRAIN-17 A). When tools#1394, cat-harness#968, core#603 land: tell train thread …MmDK4f to move #2911 pins; then ping Fa reds thread …BbaFk6 when kg-export red clears.
10:46Z MERGED tools#1394 2c6a9bd, cat-harness#968 b42f692, core#603 12e68b3 (Q-META-5 A). Train thread told to move fa#2911 pins.
17:58Z freeze lifted (user 'ungreeze... keep going' via coordinator). #959 merged main (d58e64d), marked ready, subscribed; card Q-META-6 (merge on green) cmsg_017WNUkNK8kdDziPK58Pv6G9Cc8ZPuBswbCQd5Eas3CURd. fa#2911 closed unmerged (newer train?).
18:00Z Q-META-6 = A (tap): merge cat-harness#959 on green.
18:44Z cat-harness#959 MERGED 8d41aa1 (issue #958 closed). Skills saturation-meta-merge + merge-manager-watcher, actor merge-manager, 2 BPMN now on cat-harness main. Open: Q-META-2 (tools#1384); main-red recheck after the re-pin train lands.
19:30Z #959 follow-up: cat-harness#998 (issue #997, branch claude/meta-merge-lane-docs 56eb0d2) adds lane docs + drops higher-layer names (re-pin prep thread session 01Qmmkt5oYY58 asked; forwarded via coordinator). Card Q-META-7 cmsg_017WNUkNK8kdDziPK58Pv6G9EMKiiqLZxm61mkxQqtULGc. LESSON: new BPMN lanes need bpmn:documentation; skills in cat-harness must not name higher layers (cat-harness-tools, fhir-harness...).
19:26Z Q-META-7 = A: #998 marked ready, merge on green.
11-07: #998 closed by owner, superseded by cat-harness#999 (lane docs+wording, 42bc930) and #1000 (checklists/.pot), both merged. tools#1384 merged (Q-META-2 moot). core main green be01d0f; cat-harness main last decided run a038e6b red (11-07, not investigated here). Thread wrapped up.
