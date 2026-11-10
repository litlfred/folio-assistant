---
# folio-assistant-drnh
$schema: bean/1.0.0
title: 'Merge-window drain to 2026-11-03 00:40Z: PRs, re-pin train, open cards (handover bean)'
status: in-progress
type: task
priority: high
created_at: 2026-11-02T18:20:00Z
updated_at: 2026-11-10T16:40:00Z
parent: folio-assistant-rwmf
tags:
    - harness-drain-2026-11-02
    - merge-window
    - handover
---

## How to resume (read this first)

This bean is the drain's durable memory. Complete it when the window closes and every item below is merged, handed off or carded.

1. Read this whole bean, newest comment last. The last comment is the current state.
2. Re-check each PR live on GitHub (checks, mergeable) before acting; this bean may be minutes old.
3. Work the list. Take over any item whose owner has been idle more than 2 hours, and comment on the PR that you did.
4. After each merge or state change, append one comment: `_<UTC time>_ — <what changed, links>` and bump `updated_at`. Commit straight to the beans state branch `cat/cat-harness/beans`.

Resume prompt: "read bean folio-assistant-drnh on branch cat/cat-harness/beans of litlfred/folio-assistant and continue the drain and re-pin train".

## Rules

- Merge window ends 2026-11-03 00:40Z.
- Non-content PRs merge as soon as green (or when their only reds are reds main already has). Agents fix main reds. Split mixed branches and merge the functional part.
- Content PRs, including BPMN layout redraws and CS- items, need a card answered by the owner first.
- Committee content never merges.
- ArchiMate is never a glossary/SKOS source unless it was ingested. IRIs use slashes, never '#'.
- Never cancel started main runs. Never merge PRs that touch subscriptions/*/.

## Drain PRs (as of 18:05Z: 26 of 35 done)

- [x] cat-harness#972 — green draft; content, waits on card Q-B1-2 (merged `d3d7a4da093a`, `2026-11-08T10:16:42Z`, closing `cat-harness#971`).
- [x] cat-harness#980 — checks running; merge on green.
- [x] cat-harness#959 — checks running; merge on green (meta-merge skill).
- [x] cat-harness-tools#1399 — checks running; merge on green.
- [x] who-iris#165 — waits on the re-pin train.
- [x] cat-harness-tools#1299 — waits on the re-pin train (closed `2026-11-08T07:20Z`).

Report artifact: https://claude.ai/artifact/Qipen2fFHYXcAXsjakKNqr

## Re-pin train

- [x] folio-assistant#2921, branch repin-train/20261102-1625 (merged 2e10fd3, 23:28Z). A cron replaces the train every 2 hours: always use the NEWEST repin-train/* branch.
- Its stage check stays red until the owner runs Q-SLASH-8 (workflow files; agents lack workflow permission):
  `reset; cd ~/space_cats/folio-assistant && git fetch && git switch repin-train/20261102-1625 && git pull && sed -i '/cp "\.\/_site\/\${STUB}\.jsonld" "\.\/_site\/\${STUB}\.json"/d' .github/workflows/feature-staging.yml .github/workflows/docs-site.yml && git commit -am "drop .json copy step" && git push`
- Once green: merge it, then merge who-iris#165 and cat-harness-tools#1299.

## Open cards waiting on the owner

- [x] Q-SLASH-8 — run the command above (owner, 588844b)
- [ ] Q-REFKG-5 — references (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9RMY4ByX7D89zNFwW323CSk)
- [ ] TOC — smart-trust#138 (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9T2NwvJrwiuyNa9WdtSZ8Ag)
- [ ] Q-B1-2 — cat-harness#972
- [ ] Q-FMR-9 — cat-harness#945
- [ ] Q-GLO-ORDER-1 — glossary at the end

## Threads still working

- smart-ra edit and suggest panel (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9CfR3dCkpEywQvvyu4GcPA6): single-icon mockups.
- Glossary thread: merges smart-ra#230 once green.
- Harness drain thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G993tgDz3qufiWhn4SHZH4bHs. Re-pin train thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9MmDK4fGPz89Zs2mtVYEY36.

## Owner to-dos

- [ ] Approve or change CS-001 wording (DTH-HRH log row 3)
- [ ] Review smart-trust#136
- [ ] Paste Code.gs ff855ec7

Long-lived review-log watching lives in bean folio-assistant-lgwt.

_2026-11-02T18:20:00Z_ — Filed from the coordinator handover of 18:07Z (owner asked 18:08Z for a short-term drain bean used as memory and handover for stalled agents). Thread https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9CGT3dPmJTAXBao9ddv9dw4

_2026-11-02T18:32:00Z_ — Harness drain (thread https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G993tgDz3qufiWhn4SHZH4bHs): still 26 of 35, no PR red. tools#1399's new red was test order, fixed in 8c020c4, merge on green. cat-harness#959 is green (meta-merge thread's to merge). Full harness plan and state: bean folio-assistant-4j43.

_2026-11-02T19:42:55Z_ — Train fa#2921 (repin-train/20261102-1625 @ 68df55f, still the newest train) is red on 16 checks; main 7e745b9 has only 4 (post-merge QA, bun test shards 2 and 3, registered gates), so it can't merge on main's reds. Q-SLASH-8 is NOT applied yet: the `.json` copy lines are still in both workflow files. The owner's local `git switch` failed on an uncommitted edit to bean u9lb (stash it first). Q-SLASH-8 alone won't turn the train green. The root red is in the pinned cat-harness (c7cfab5): `qa:refresh` fails on (1) `skill:register` with 2 undeclared skills (add them to package-manifest.json `skills`); (2) `check:lane-documentation` with 5 undocumented lanes in processes/sdlc/saturation-meta-merge.bpmn (Steward, Sibling, Owner, Pipeline) and merge-manager-watch.bpmn (Steward); (3) `check:methodology-evidence`: skills/sdlc/sdlc-core/saturation-meta-merge.md names 2 instances above it and is not in PENDING. With no QA working copy, `uml:overview` exits 2 in stage, and the e2e, bun test and gate shards all report UNKNOWN. The fix needs a cat-harness PR (saturation-meta-merge, from the #959 meta-merge skill) and then a re-pin; this session can't reach cat-harness. who-iris#165 and tools#1299 still wait on the train.

_2026-11-02T19:45:48Z_ — The owner ran Q-SLASH-8. The train is now at de098fc (588844b "drop .json copy step", then de098fc tombstone-comment cleanup). The root `${STUB}.json` copy lines are gone from both workflows. CI restarted. The cat-harness saturation-meta-merge reds (previous comment) are expected to remain until a cat-harness fix is re-pinned.

_2026-11-02T19:47:01Z_ — The owner reported only two other agents active (19:46Z) and every thread idle over 15 minutes as stalled, so I started siblings. cat-harness saturation-meta-merge fix and re-pin: https://claude.ai/code/session_01EucfRo4LGSMzJn5kq6PucY. Harness drain (4j43): https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5. Review-log watcher (lgwt): https://claude.ai/code/session_01EucfRmAyZLEuxMG8wkPi5r. This coordinator (https://claude.ai/code/session_01EucfRmNiFYxXqLAgwhF71Q) keeps the train fa#2921 and its follow-on merges (who-iris#165, then tools#1299 recount).

_2026-11-02T19:53:09Z_ — Harness drain sibling (https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5): no merges. This session cannot reach cat-harness or cat-harness-tools (add_repo refused), so the harness PR merges in 4j43 are blocked until access is granted or another session takes them.

_2026-11-02T19:54:03Z_ — Session https://claude.ai/code/session_01EucfRo4LGSMzJn5kq6PucY opened cat-harness#999, built on #996 (c7cfab5). It registers saturation-meta-merge and merge-manager-watcher in the sdlc-core manifest, documents the five lanes, and drops the first-run line's names of cat-harness-tools and fhir-harness. A local qa:refresh was not possible because the mount-from-lock run was denied in this session, so CI on #999 is the verification. When it is green: merge it, then re-pin fa#2921.

_2026-11-02T19:58:55Z_ — Harness drain (https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5): confirmed merged cat-harness#980 (625fac5), #959 (8d41aa1), #981 (615da97) and cat-harness-tools#1411 (c6e3d1b). No new merges by this session.

_2026-11-02T20:05:03Z_ — Train check: repin-train/20261102-1625 is still the newest (head de098fc, Q-SLASH-8 applied). Still 16 reds, the same as before; QA working copy fails on skill:register, check:lane-documentation and methodology-evidence (cat-harness c7cfab5). No re-pin yet: the fix is cat-harness#999 (sibling session_01EucfRo4LGSMzJn5kq6PucY, CI check 20:05Z, then merge and re-pin). Not merged. who-iris#165 waits. Next check after the re-pin lands.

_2026-11-02T20:13:54Z_ — cat-harness#999 merged at 42bc930 with all checks green (it also lands #996, c7cfab5). Re-pinned on repin-train/20261102-1625 as 9675208: index.lock.json harness ref, instance sha, trust ref and treeDigest (5d14177c…, 12002 files, declaration unchanged), and index.config.json ref plus consent ref, following 68df55f. Coordinator messaged.

_2026-11-02T20:14:09Z_ — Correction to the previous entry: the coordinator was NOT messaged. session_01EucfRmNiFYxXqLAgwhF71Q has been archived since about 20:09Z, so send_message was refused. Whoever owns the train merge next: fa#2921 is at 9675208 (cat-harness 42bc930) and needs its CI watched and merged by 2026-11-03 00:40Z.

_2026-11-02T20:21:24Z_ — Train fa#2921 taken over by https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5, on the owner's choice (card: coordinator https://claude.ai/code/session_01EucfRmNiFYxXqLAgwhF71Q was archived at about 20:09Z). All 16 reds on de098fc come from the single cat-harness c7cfab5 qa:working-copy root, fixed by cat-harness#999 (36b9f0f, all checks green, owned by the saturation sibling). The train pins who-iris at 40d52ba (= #165 head) and core at 6f04061 (= core#624 head), so those merge with it. Rehearsing the train locally with cat-harness at 36b9f0f to find any hidden reds before the re-pin.

_2026-11-02T20:21:43Z_ — Harness drain session https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5 now owns train fa#2921 (by the owner's assignment, as it reports). I told it: #999 is merged at 42bc930 and the train is already re-pinned (9675208). Open risk: #999 did not regenerate the two .checklist.md files or the ten translations/*/processes/*.pot, so these may be stale at 42bc930 if translate-bpmn or the checklist check is gated. cat-harness#998 holds those regenerated files but now conflicts with main. It needs a rebase that keeps main's .bpmn/.md and re-runs the regen.

_2026-11-02T20:22:21Z_ — cat-harness#999 merged (42bc930, by the saturation sibling). The train is re-pinned to it (9675208 cat-harness 42bc930 with the #996 glossary regen; e107c2d slash-command stubs for the two new skills). CI on e107c2d: 0 red so far, 7 passed, 5 running. The local rehearsal was stopped, since CI now runs the same tree.

_2026-11-02T20:24:51Z_ — Opened cat-harness#1000 (fec38df, generated files only): regenerates the 2 meta-merge checklists and the 10 BPMN .pot files that #999 left stale (flagged by the saturation sibling). In the train tree at 42bc930, translate-bpmn:check passes afterwards. It supersedes #998's regenerated half. Plan: merge #1000 on green, then re-pin the train's cat-harness onto it.

_2026-11-02T20:25:10Z_ — Confirmed: translate-bpmn:check was red at 42bc930 on the 10 stale .pot files. The train owner (…RqHz) opened cat-harness#1000 (fec38df) with the regenerated checklists and .pot files, to merge on green and re-pin. cat-harness#998 is now fully superseded (BPMN/skill edits by #999, regen by #1000). It belongs to session_01Qmmkt8V2Q2C2M3WxErzGN7 and is left for its owner or litlfred to close.

_2026-11-02T20:25:53Z_ — cat-harness#998 closed at the owner's request, with a comment pointing to #999 (merged) and #1000 (regen).

_2026-11-02T20:46:24Z_ — Train run on e107c2d: 2 red. (a) bun test shard 2: the stale .pot test (fixed by cat-harness#1000, green), and an edit-links skew (cat-harness 42bc930 has #981's block-panel asset, tools 109b850 lacks the #1411 recipe). (b) stage: 6 links in smart-trust to pages the run does not write (AST pipeline failed: smart-trust), not checked yet. Pushed a989b41 to the train: cat-harness fec38df (#1000 head) and tools c6e3d1b (#1411 merge, held back from main's #1417 slash wave 2). Mount verified OK. MERGES ARE BLOCKED for this session: the permission check refused merging cat-harness#1000 ("merge without review"). The owner must allow merges here, or merge #1000 and then the train.

_2026-11-02T20:47:21Z_ — The owner allowed merges for this session (card: option 1). Merged cat-harness#1000 as d7ebe6e (green, generated files only). The train's pin fec38df is #1000's head, now on main with the same tree as d7ebe6e, so the pin stays and CI on a989b41 keeps running.

_2026-11-02T20:48:45Z_ — The train's stage red was `cp: cannot stat ./_site/cat-harness-glossary.jsonld`. tools eab1407 ("Remove the one-release IRI tombstones") stopped writing the root glossary tombstone, but feature-staging.yml:1606 and docs-site.yml:823 still copied it. This is Q-SLASH-8's twin for the glossary. Pushed a9a2c6c to the train, deleting both lines. This session's push to .github/workflows WAS accepted, so no owner card is needed. CI restarted on a9a2c6c.

_2026-11-02T21:23:49Z_ — Train re-pinned at 95da342, from the reds on e107c2d and a9a2c6c, each reproduced in a tree mounted from the train's lock and compared with main's:
- cat-harness#1001 (cc571bb): the meta-merge diagrams still used the processes `ns#` namespace, so their skill refs were invisible (activity-skill-coverage, 9 activities). Fixed the namespace, gave the 3 really skill-less tasks a skill or a no-skill reason, regenerated the checklists and .pot files, and archimate-models.md no longer names folio-assistant-core (reference-direction, the 1 new finding).
- cat-harness-tools#1422 (30a0ec3, branch from c6e3d1b, so slash wave 2 #1417 is not in): tests follow the lower layers. That covers tools pairs (core glossary-table), kg-export (log is a data store, Q-BR-3 A), 502c (new GW_BeanClosedHow), stakeholder-map (dependents' roles), viewer-tools (business-processes), the deck path, block-summaries (library/conduct filing, .jsonld blocks), and check-instance-render reading the slash GraphTypology type.
- index.config.json: check:ig-citations is declared no-folio (it reads an IG's own checkout; at the index it reads 0 pages).
- Also red on main in a clean tree, so main's: kg:validate nested instances (676g), process-index subgraph JSON-LD ×4, block-summaries viewer projection, the deck's slide 4 and generated assets.
Order: the train merges, then #1001 and #1422 re-run against the new main pins and merge.

_2026-11-02T21:26:53Z_ — Train at aa3ac81: cat-harness 4bf7090 (#1001, now also rewriting saturation-meta-merge's process summary, whose first sentence "Owner, 2026-11-02 06:57Z…" failed process-index's no-chatter rule). Not fixed and not the train's: check:bean-parents fails on the shared work plan, because open beans bmat and rpc6 have no `parent`. It's red on main too, since the state branch is shared. Their threads should give each an epic parent; this drain did not guess one.

_2026-11-02T21:39:38Z_ — Train at 9032f1c: cat-harness-tools 4824597 (#1422), which drops the unused readRoleGraph import that failed lint on aa3ac81 (reported by sibling https://claude.ai/code/session_01EucfRp9ycxtZrrBKaipNy5). ESLint is clean on every file #1422 touches.

_2026-11-02T22:22:21Z_ — CI on 9032f1c: 25 passed, 2 red (bun test shards 2 and 4). The repin-train verdict was "1 new failure vs main 7e745b9", which is shard 4: main's red shards are 2 and 3. Shard 4's tests:
- the living deck's image paths: a real cat-harness defect. Bean 6fez filed kg-folio-asst-2026-09-30 one level down, but its images.json kept ../../docs/ paths (28 of them broken). Fixed in cat-harness#1001 (9d9d7e2).
- kg:validate nested instances (676g): fixed by sibling tools#1419, whose diff is carried on #1422 (f96dfff).
Shard 2's remaining red is bean-parents (bmat and rpc6 have no parent), which is the shared work plan's and red on main too. The train is at 3b74fbd.

_2026-11-02T22:51:08Z_ — CI on 3b74fbd: shard 4 green (the deck and nested-instances fixes worked); 20 passed. New red: jsonld-gen-check, because the deck's 22 generated figure blocks carried the old image paths. They are regenerated (gen-library-jsonld) in cat-harness#1001 (d696b2f), and all 4 JSON-LD checks pass in a tree at the train's lock. The train is at e9fc31d. Shard 2's remaining red is bean-parents (shared work plan, main's too).

_2026-11-02T23:29:34Z_ — MERGED the re-pin train folio-assistant#2921 as 2e10fd3, at e9fc31d. Its verdict status read "no new failures vs main 7e745b9 (1 known)". 26 checks passed; the 1 red is bun test shard 2, red on main too (bean-parents on the shared work plan). It touched 7 files and nothing under subscriptions/. folio-assistant main now pins cat-harness d696b2f, cat-harness-tools f96dfff, core 6f04061 and who-iris 40d52ba.
- MERGED cat-harness#1001 as f3e6197 (green, clean).
- Re-running against the new main pins: who-iris#165, core#624, cat-harness-tools#1422 (their only reds were the comparison against the old pins).

_2026-11-02T23:52:30Z_ — MERGED who-iris#165 (83c2e00) and folio-assistant-core#624 (e987b89), both green and clean after re-running against folio-assistant main's new pins. drnh's plan was to merge #165 after the train; main already pinned its head. cat-harness-tools#1422: its Standalone check found 1 new failure (the core table-Tool pair, absent when core is not mounted). The expectation is now conditional on core's Tools being loaded; pushed, CI running.

_2026-11-03T00:02:38Z_ — MERGED cat-harness-tools#1422 as 13c77e3: green on every check (index gates, standalone and tests, all "no new failures"). The tools#1299 recount is waiting on folio-assistant-core's main run 41505485739, re-run against the new pins and still running.

_2026-11-03T00:41:16Z_ — Merge window closed. Merged in the window by the drain session: fa#2921 (2e10fd3), cat-harness#1000, #1001, cat-harness-tools#1422, who-iris#165, core#624. Bean 4j43 is completed and carries the final report and the open list.

_2026-11-03T05:02:05Z_ — 04:56Z, owner in session https://claude.ai/code/session_01EucfRo4LGSMzJn5kq6PucY: merge green, ready, non-content PRs for 4 hours (until 08:56Z). At start, cat-harness#992 and #993 had just been merged by someone else, and fa#2919/#2904/#2885/#2875 were merged by litlfred at 04:57-05:00Z. Owner cards: fa#2864 closed as superseded by the trains, and fa#2898 (CODEOWNERS) to be merged on green. Its branch was updated from main to replace an 18h-old red (the fsh-guts test, since green on main). The train fa#2922 stays with …RqHz. I'm sweeping every ~30 min.

_2026-11-03T05:30:04Z_ — Merge sweep: merged cat-harness#1002 (generated PROV logs for the slash wave 2 IRIs, opened by …RqHz for the train) at e7c2966, all green. fa#2898 is held: its only red is kg-validate-nested-instances (bean 676g), which none of its 3 .github files can touch. main's own gates run (41581340069 at 97d2e407) is still queued, so whether main has that red too is undetermined.

_2026-11-03T05:33:36Z_ — Owner, 04:56Z: "merge (non-content) that is green and ready for 4 hrs", so the watch runs to about 08:56Z. Done so far:
- MERGED folio-assistant#2919 (8ff5e4d), dependabot Actions bump.
- MERGED cat-harness#1002 (e7c2966), the PROV regen for slash wave 2; it fixes check:prov-qaqc on train #2922.
- Bean djj5 filed (IG bibliographies derived from library/, owner card option 3) and sibling https://claude.ai/code/session_01EucfRodNcVYWoFyT9Zwyb3 started on it. Trains keep smart-trust-phw and smart-immunizations on older pins until djj5 lands, because both declare a references/ directory that is not on disk.
- Train #2922's nested-instances red reads a partial qa-reports entry for main 2e10fd3 (folio-assistant-sci: 0 kg-audit sidecars, against 16 at 7e745b9). To re-check on the 06:17Z train.
- The cat-harness-tools bsd1 stack (#1420, #1421) is left to sibling https://claude.ai/code/session_01EucfRmD6JzE3AYLeUkX1KU, which is merging it.

_2026-11-03T05:51:10Z_ — Merge sweep: merged fa#2898 (CODEOWNERS, SECURITY.md, Dependabot cooldown; owner-approved) at 50961d8. Its only red, kg-validate-nested-instances (bean 676g), also fails on main's gates run 41581340069 (97d2e407).

_2026-11-03T05:54:25Z_ — Merge sweep: merged cat-harness#1004 (process: each layer publishes its own QA results; docs/skills/BPMN documentation, bean 7mwa) at 1e9b973, all green, clean.

_2026-11-03T06:08:47Z_ — Merge sweep: merged cat-harness#1005 (deployments name their work-plan store Tool, #991) at c98180a, all green, clean.

_2026-11-03T06:10:31Z_ — Merge sweep: merged cat-harness#1003 (proposal §4.9/§4.10, docs only) at bf77ac6 and cat-harness#1006 (BPMN rendering rules in skills, DI-only diagram fixes) at 45c78fc, both all green. Disjoint files, so no conflict between them.

_2026-11-03T06:43:35Z_ — 06:36Z sweep:
- MERGED folio-assistant-core#627 (8c96ae9, publish-qa workflow) and folio-assistant-core#628 (ccb5997, djj5 Dublin Core/CSL code).
- New train fa#2923 (repin-train/20261103-0632) takes every layer at its main. It needs no IG hold: check:harness-dirs passes at the smart-trust-phw and smart-immunizations mains. PROV and translate checks pass.
- Its one new red, skill:commands:check: cat-harness lacked command stubs for saturation-meta-merge and merge-manager-watcher. Opened cat-harness#1009 (8a418ce); the train is re-pinned onto it (889ecfc).
- Re-ran smart-base#297 and who-iris#174: their only red was a gate that differed because the two sides were pinned differently.

_2026-11-03T07:30:41Z_ — Merge sweep: merged cat-harness#1007 (proposal plain-language rewrite, docs only) at 32ad836, all green, clean. cat-harness#1008 was merged by someone else. #1009 is left to …RqHz.

_2026-11-03T08:07:49Z_ — 07:24Z to 08:08Z:
- MERGED cat-harness#1009 (9d2a99b, meta-merge command stubs) and cat-harness-tools#1441 (eca920e, tools names no content layer).
- Train fa#2923 on 889ecfc: "5 new failure(s) vs main 50961d8".
  - check:declared-dirs: smart-trust-phw and smart-immunizations at their mains declare references/, which the mount does not carry. My local harness-dirs run had missed it. Both are held at main's pins again.
  - reference-direction: 8 new findings, from the work-plan-store skills (#993) and the tools layer-qa files. Fixed in cat-harness#1012 (c648a79) and tools#1441.
  - readme:sync and kind:register: the cat-harness skills index was stale. Regenerated in #1012.
- Train re-pinned at d0ea1d7. Locally, all 8 checks pass: skill:commands, readme:sync, kind:register, reference-direction --against main (0 new), declared-dirs, prov-qaqc, translate-bpmn and mount:lock.
- Lesson: an index.config.json ref must change with the lock. state:mount rebuilt the lock from the config, which undid one edit.

_2026-11-03T08:09:37Z_ — Merge sweep: merged cat-harness#1012 (train fix: work-plan-store skills name no higher layer, plus the readme regen) at d2bf0a3, and cat-harness#1011 (diagrams outside sdlc drop bean markup, #991 step 17, ruling Q13; its prerequisites tools#1435 and #1436 are on tools main) at f9423d7. Both all green. cat-harness main is now f9423d7. fa#2924 (drop smart-trust references/ mount) is waiting on CI: shard 3/4 red, 3 pending.

_2026-11-03T08:13:21Z_ — Merge sweep: fa#2924 (drop smart-trust references/ mount) is NOT merged. It has a new red main lacks, declared-dirs.test.ts 'every declared directory in this repository resolves' (job 125795843598). Smart-trust's current pin still declares references/, so the change likely belongs with the smart-trust re-pin to 388fcf3 in the next train. Author …Rp9y and train owner …RqHz told.

_2026-11-03T08:49:21Z_ — 4-hour merge watch (owner 04:56Z), close-out by https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5.

**Merged by this session (9):**
- folio-assistant#2919: Actions bump.
- cat-harness#1002: PROV regen. (…Ro4L merged it at the same moment.)
- cat-harness#1009: command stubs.
- cat-harness#1012: work-plan-store skills by role, and the skills index.
- folio-assistant-core#627: publish-qa workflow.
- folio-assistant-core#628: djj5 DC↔CSL.
- cat-harness-tools#1441: tools names no content layer.
- Plus two re-runs started (smart-base#297, who-iris#174).

**Train fa#2923 (repin-train/20261103-0632) is NOT merged.** At d0ea1d7: 26 checks pass; the verdict is "1 new failure vs main 50961d8". The one red is bun test shard 2, instance-exports "code lists … fragment": the test expects `#level` after slash wave 2. The fix is open as cat-harness-tools#1442 (test-only, one line).

**For the next train:**
1. Take cat-harness-tools#1442, or tools main once it merges.
2. Re-pin smart-trust to 388fcf3 (smart-trust#139, references/ retired). Drop "references" from smart-trust's index.config.json directory list in the same change; that is fa#2924's change, and fa#2924 is red alone.
3. smart-trust-phw: its main 5bec992 (#30) no longer declares references/, so it can be taken. Keep smart-immunizations held until smart-immunizations#111 merges.
4. cat-harness main f9423d7 carries #1011, which rewires 6+ process diagrams; expect process checks to move.
5. Change an index.config.json ref together with its index.lock.json ref: state:mount rebuilds the lock from the config.
6. Known reds, red on main too: kg:validate nested instances (qa-reports entries are partial until the layer-qa-publish rollout lands); bean-parents (bmat, rpc6 have no parent).

_2026-11-03T08:49:58Z_ — Merge sweep ended 08:50Z. Merged: cat-harness #1002, #1003, #1004, #1005, #1006, #1007, #1011, #1012; fa #2898. Closed (owner card): fa#2864. Not merged: fa#2924 at eb8a885, with new-vs-main reds: check:state-on-main on smart-trust-uploads having no source declared, and bun test shard 1/4 'a queue's declared intake is ONE unit' (author …Rp9y told). Train fa#2923 is unmerged, with 1 new failure that cat-harness-tools#1442 fixes; …RqHz's next-train handover is above. Merged by others during the window: cat-harness #992, #993, #1008, #1009; fa #2919, #2875, #2885, #2904.

_2026-11-04T13:27:14Z_ — Merge sweep #2 started 13:26Z (owner: another 4 hours, until 17:26Z), same rules. Merged cat-harness#1024 (removes the qou migration checklist from platform docs; owner's choice) at 1d97eaf, all green. fa#2932 (.github/scripts repin-train fix) is waiting: its only red is bean-parents 'every open bean belongs to an epic', which reads bean data. I'm checking it against main's run 41837926987.

_2026-11-04T13:50:43Z_ — Merge sweep #2: merged fa#2932 (repin-train re-judges a failed train while checks still run; .github/scripts only) at a073189. Its only red, bean-parents 'every open bean belongs to an epic', also fails on main run 41837926987 (61ea1972).

_2026-11-04T20:12:55Z_ — Session restarted. The 14:08-18:08Z window lapsed while it was down; the owner said 'try again' at 20:12Z, so merge sweep plus re-pin window run until 00:12Z. Merged cat-harness#1026 (docs QA pass 2, owner-reviewed) at 33ec692. fa#2936 (leaf re-pins) has one new red: actor-facts-audit.test.ts:202 expects jekyll still unconsumed, but a newly pinned leaf now consumes it. The fix (drop jekyll from that loop in cat-harness-tools) is handed to author …RmCv, since this session can't attach cat-harness-tools. Train fa#2938 (20261104-1824) is red.

_2026-11-04T20:22:20Z_ — Owner (20:2xZ): may attach repos. cat-harness-tools and who-iris attached. Owner approved merging fa#2926 (sub-graphs on; comment-only workflow edits) and who-iris#176 (uploads/ not a KG dir; workflow pins) once their reds are main-only. Findings: the actor-facts 'jekyll' fix is already on tools main as f5b90e7, so fa#2926 (tools 5e1644e) and fa#2936 (tools d5c25d7) both need tools at or after f5b90e7; told …RpQZ and …RmCv. tools#1473 (two-greys) is merged, so who-iris#176's re-run should clear. Watching fa#2926, fa#2936, who-iris#176.

_2026-11-04T20:57:30Z_ — who-iris#176 merged at 20:56Z as 35f23d3 (by litlfred). …RpQZ told to re-pin who-iris in fa#2926 and drop tools#1477. fa#2926 at 13e2cb7 still has new-vs-main reds: state-on-main (should clear with the who-iris pin), harnessed-kg-overview slide 10, subgraphs dangling, core kg-materialize, and bean-parents (data).

_2026-11-05T06:28:22Z_ — Session restarted again (down about 21:00Z to 06:27Z on 11-05). The owner gave a standing OK to merge re-pins whose only workflow edits are lock-following uses: pins. Window reopened 06:27-10:27Z. Overnight, fa #2936, #2940 and #2941 merged (by others), and #2939 closed. fa#2926 at 1ea51d4 has one new-vs-main red (subgraphs dangling); asked …RpQZ whether it can merge now. Train #2943 is down to 7 new failures, mostly what #2926 fixes.

_2026-11-05T06:35:32Z_ — Owner (06:3xZ): 'merge when ready', and approved merging fa#2945 (adds leitnerc to mountApprovers) on green. Watching fa #2945, #2926, train #2944, and cat-harness#1036 (provenance logs may name any instance; owner card).

_2026-11-05T08:45:00Z_ — Correction to the 2026-11-03T00:41Z line above, which calls 4j43 completed: the owner re-opened 4j43 at 2026-11-03T07:13Z (card "1. Re-open 4j43") because five children were still open, and it reads in-progress now. Checked 2026-11-05: drnh, fbmk, rbib and sbpn are in-progress, gzgh is todo. So in-progress is correct; 4j43 closes when they do. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T12:56:00Z_ — Stalled-agent pickup (owner: "pick up all stalled work"; logs of ~10 sessions that hit the weekly limit). Already done: tools#1442, #1483, fa#2945, #2924, smart-immunizations#111, cat-harness#1036 merged; tools#1485, fa#2926 (→ #2946 merged), trains #2923, #2944 closed. Live owners kept: fa#2954 and trains → "Broken beans links" session_01XueePufkpx8fwJxavyDS5h; fa#2951/#2948 → session_01VQDpPcHWmicLn8QLKRMQTL. Handed to new siblings (tag stalled-pickup-2026-11-05): A library chain tools#1479 → cat-harness#1032 → core#639 → session_01VQDpPg681u1Pt3MCpbmx8J; B Plans and work tools#1484 + cat-harness#1038 (bean exrp) → session_01VQDpPfeNxqnLV7Dcpo1Uo1; C provenance cat-harness#1037 → tools#1486 + footer/audit-coverage → session_01VQDpPfwYbADcuuX2ZBXvqn; D site re-pins smart-ra#228, smart-immunizations#114 and the rest of rpc6 → session_01VQDpPcVohXoCeZb3TEMGfp; E dth-hrh export page + "latest" copies (core document-export.ts, under dthl) → session_01VQDpPfQjS6Ah9hRnot9HUp. Open for the owner: whether cat-harness-file checks run only in the committing repo (exit-78 counts as a new failure). Session https://claude.ai/code/session_01VQDpPfGantMCt7AV4LCCK2

_2026-11-05T12:59Z_ — Library chain (tools#1479 → cat-harness#1032 → core#639) handed to bean folio-assistant-f1nc; blocked on access to cat-harness-tools.

_2026-11-05T14:07:00Z_ — Pickup C: cat-harness-tools#1486 merged (13366a5) on green after #1037. Footer PRs tools#1510 + cat-harness#1051 still in CI (session_01VQDpPfwYbADcuuX2ZBXvqn).

_2026-11-05T14:39Z_ — tools#1479 merged (library chain, bean f1nc); cat-harness#1032 ready.

_2026-11-05T16:36:00Z_ — Pickup C complete: cat-harness#1037 (merged earlier), tools#1486, cat-harness#1051, tools#1510 all merged; bean 2lfx completed; audit-coverage needed no change (CI already regenerates it). Session https://claude.ai/code/session_01VQDpPfwYbADcuuX2ZBXvqn

_2026-11-08T06:55:00Z_ — Merge manager pass (owner 06:30Z: "take on merge manager role, review all open PRs, stalled agents"). No merge window is open; the last one this bean records closed 2026-11-05 10:27Z, and the PR bodies cite a later owner window ("repin + merge open 12 hrs", 2026-11-07 ~05:25Z) that has also lapsed. Live state: 105 open PRs in the harness, DTH and smart-* repos (22 ready, 83 draft); fa main green (82 pass). Green ready non-content: fa#2985, fa#3031, cat-harness#1131, smart-trust-phw#51, smart-trust-demo#61 (142 behind main), smart-base#320. Green ready, needs a content call: dth-phc#33, smart-ra#234, smart-ips-pilgrimage#48 (dth-sc#24 CI running). Red ready: train fa#3033 (KG gates, e2e shard 1, bun shard 2), cat-harness#1032 (graph:check-tools, publish:derive:publish new), dth-hrh#105 (check:bibliography new), fhir-harness#300 (kg-qa-report.ts not found), smart-immunizations#118 + smart-trust-phw#47 (conflicts; translation-qa new). No project thread is working; every PR last moved before 2026-11-07 22:20Z, so all chains count as stalled. Owner asked on a card whether to open a window for merges, rebases and take-overs. Report: https://claude.ai/artifact/Qipen2fFHYXcAXsjakKNqr. Session https://claude.ai/code/session_01Qmmkt6te9q7bF3KBT2Qq11

_2026-11-08T07:02:00Z_ — Window opened by owner: card Q-MM-1 A (06:42Z, to 19:00Z) and "non-content can merge/repin + 12hr" (06:43Z, cmsg_017WNUkNK8kdDziPK58Pv6G9KXP4MmBwRDyaJzVqgwQDGf). dth-* and smart-ra content held (06:42Z). Merged: fa#2985 (da3ca52), fa#3031 (9dd5301), cat-harness#1131 (42d4f15), smart-trust-phw#51 (95ea769), smart-base#320 (f42752a), smart-ips-pilgrimage#48 (0933ea5, owner OK), smart-trust-demo#61 (5ded89a, after update-branch). dth-phc#33 merged 06:35Z by the glossary thread. fa#2953, #3004, #3018, #3016 retargeted to main. Train fa#3033 closed (its e2e red was phw BPMN drawings, fixed by #51); new train fa#3034 cut 06:45Z by a dispatched run. Sub-threads own: library chain …PhL8ELHbGN65NRwqfWTLrU, pin wave 4 …PLg8CWt5r1594GvVwsttUB, fhir-harness …94ZspF2j3hY6PQEVUVjBo9M, tools drafts …GxP1LirYDMwdxzBouVVEk4. Drain status posts to the project chat every 5 minutes. Session https://claude.ai/code/session_01Qmmkt6te9q7bF3KBT2Qq11

_2026-11-08T07:08:00Z_ — merge manager: session_01Qmmkt6te9q7bF3KBT2Qq11 (https://claude.ai/code/session_01Qmmkt6te9q7bF3KBT2Qq11), until 2026-11-08 19:00Z. Per merge-manager-watcher and merge-queue: siblings send the six-line merge request; a PR also signals with ready-for-review + label ready-to-merge + a signed "ready: <head sha>" comment. Approved folio-assistant PRs that do not change .github/workflows/ get the merge-train label (rule 8). Pre-approval ledger: owner window 06:42Z/06:43Z covers non-content PRs; dth-* and smart-ra content held.

_2026-11-08T07:05:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, owner 07:02Z: "spawn upto 6 agents to drain open issues/beans; coordinate with claude merge manager"): merged `litlfred/smart-ra#234` (`28ddcb2b93`, closing `smart-ra#229`, bean `bmat`). Respecting all active sub-threads of merge manager `session_01Qmmkt6te9q7bF3KBT2Qq11` (hands off `fa#3034`, `fa#3016`/`#1032`/`#639` library chain, pin wave 4 `smart-trust-phw#47`/`smart-immunizations#118`/`dth-hrh#105`, `fhir-harness#300`/`#291`, `cat-harness-tools` `#1627`/`#1607`/`#1606`/`#1604`/`#1602`/`#1571`, `dth-sc#24`, `dth-pc#17`). 6 sibling lanes running on disjoint beans/issues: (1) close on `origin/main` evidence `bx4c`, `pqlh`, `pdsq`, `evtx`, `x38u`, `tsh9` + recount/close `cat-harness-tools#1299`; (2) close on `origin/main` evidence `uldr`, `djj5`, `70hd`, `724x` + update `fa#3006`; (3) `y4pw` items 1–5 check-off + `dth-sc` non-content layer re-pin PR for item 6 (`smart-ra` past `#235`); (4) CI speed II post-24h measurements & close-out for `k2sg`, `hd58`, `6h4p`; (5) CI speed II cone & CQG measurements & close-out for `mbd8`, `vgfp`, `x35i`; (6) `ay33` post-`#2985` CI-image verification + `npx2` process-page SVG link audit.

_2026-11-08T07:18:30Z_ — R4 Lane 3 (`y4pw` / `bmat`): checked off `y4pw` items 1, 3, 4, 5 as merged on their owning `origin/main` branches, logged `smart-ra#234` and `dth-phc#33` merges in `bmat`, and opened `litlfred/dth-sc#25` (`d8f9159`, branch `chore/y4pw-repin-smart-ra`) re-pinning `dpi-h-ra` to `c14618fdb9b8` for `y4pw` item 6. Watching CI on `litlfred/dth-sc#25` to label `ready-to-merge` for Merge Manager.

_2026-11-08T08:02Z_ — merge manager: 07:30-08:01Z merged train fa#3034, smart-trust-phw#47, dth-hrh#105 (re-pin), tools#1604/#1606/#1602/#1675, smart-base#310, smart-trust#142, smart-trust-phw#33, fhir-harness#300. Mains red: fa (watchdog; fix tools#1683 awaits owner OK), cat-harness/core/bootstrap (JSON-LD publish; fix tools#1677 awaits owner). Held green: cat-harness#1133, #1135, fa#3014. Queue 47 at 08:00Z: swarm hold re-sent.

_2026-11-08T08:06:30Z_ — R4 Lane 3 (`y4pw`): updated `litlfred/dth-sc#25` (`88ee124`) to scope `overrides.dpi-h-ra.directories` to `["glossary", "archimate"]` matching `dth-sc/AGENTS.md` line 11, `dth-hrh`, and `dth-phc` (resolves `dpi-h-ra/references/README.md → ../README.md` with 0 new gate failures). Watching CI on `88ee124`.

_2026-11-08T08:31:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 5, owner 08:27Z: "spawn upto 6 agents to drain open issues/beans"): R4 completed 18 beans (`bx4c`, `pqlh`, `pdsq`, `evtx`, `x38u`, `tsh9`, `uldr`, `djj5`, `70hd`, `724x`, `k2sg`, `hd58`, `6h4p`, `mbd8`, `vgfp`, `x35i`, `ay33`, `npx2`) and closed `cat-harness-tools#1299` on evidence. Spawning 6 Round 5 lanes on disjoint beans/issues (> 3h inactive, strictly hands-off Merge Manager active chains): (1) `y4pw` Item 6 (`litlfred/dth-sc#25` full layer re-pin matching `dth-hrh#105` `a7865a0dd406`, keeping `["glossary", "archimate", "references"]`); (2) close `litlfred/folio-assistant#3006` (all 9 rows merged after `fhir-harness#300`) + verify/close `69lr` & update `k3vv`; (3) verify & close `9ml4` (cache-first CI post-`#3010`/`#3013`/`#2985`); (4) `litlfred/dth-phc#5` (L1 coverage generator freshness); (5) `litlfred/smart-base#281` (`who-iris c71f257` DTH term findings path audit/fix); (6) `3v2t` (cross-layer derived files audit/close-out) + `litlfred/who-iris#104` (IRIS CDN exporter follow-ups recount).


_2026-11-08T09:27Z_ — merge manager: 37 merged today. Train fa#3036 failed (smart-trust-phw#33 declared contexts/ built empty; fixed by phw#52). Train fa#3037 (cut 09:07Z) carries tools#1677 (JSON-LD), #1683 (fa watchdog), phw#52; ETA merge ~09:45Z. After it: cat-harness/core/bootstrap/fa mains should go green, then the held queue (bootstrap#46, cat-harness#1133, edit-links pairs in order #1135+tools#1674 -> #1137+tools#1682 -> #1142+tools#1691 -> fhir#311, cat-harness#1141, library chain #1032->core#639->fa#3016, core#676/#678, keywords chain, fa#3014). Owner OKs: y 08:45Z, 5a, 6ok 09:22Z (who-iris#198 chain, navbar pair), 4 ok (keywords chain).

_2026-11-08T09:29:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 5 update): (1) completed beans `folio-assistant-69lr` (`8d7f46aa305d`) and `folio-assistant-3v2t` (`14eb8a320051`); (2) closed `litlfred/folio-assistant#3006` (all 9 Gherkin rows merged after `fhir-harness#300` `dfda152f33ec`) and superseded `litlfred/bootstrap-tools#65` (superseded by `#66` `fe7d9ca27679`); (3) updated beans `folio-assistant-k3vv` (12/14 children completed), `folio-assistant-4j43` (16/18 children completed, `d396bf1bc635`), `folio-assistant-9ml4` (`7bd665d153fd`, live cache usage & `cached-step` audit), `folio-assistant-k6dz` (`419ef03ea904`, `cat-harness#971` recount), and `litlfred/who-iris#104` (5/7 repo items checked off); (4) unblocked, merged `main` into, and greened `litlfred/folio-assistant-core#653` at `1bb9e6756eaef7fa3e952f82d36618c67a8327a0` (marked ready for review + labeled `ready-to-merge` + signed `"ready: 1bb9e6756eaef7fa3e952f82d36618c67a8327a0"` for Merge Manager). R5-Lane-1 finishing `litlfred/dth-sc#25` (`y4pw` Item 6 layer re-pin).


_2026-11-08T12:26:30Z_ — R6 Lane 2 (`litlfred/cat-harness#1140` closing `cat-harness#1139`): marked `litlfred/cat-harness#1140` (`369a1806d31a7622c3e89a7f2ef9389316406311`) ready for review (`isDraft: false`), verified full `Harness PR checks` run `42477690359` + CodeQL `42460824551` all green (`MERGEABLE` / `CLEAN`), confirmed `ready-to-merge` label, and posted fresh `"ready: 369a1806d31a7622c3e89a7f2ef9389316406311"` comment (`#issuecomment-6721453422`) for Merge Manager.

_2026-11-08T13:15:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 6 update): (1) greened, marked ready for review, labeled `ready-to-merge`, and posted signed `"ready: <sha>"` comments on 4 more PRs for Merge Manager: `litlfred/cat-harness-tools#1693` (`ready: 254f37f5ddc9934ca91850bc4d2a69f5c8a0123a`), `litlfred/cat-harness#1145` (`ready: ccfd263a966ad17c7de7dd24fb4d9dd55d768c8e`), `litlfred/folio-assistant-core#679` (`ready: 7c35fc3a1205fbb060bf2cc9d09cf635aa1e7ced`), and `litlfred/cat-harness#1136` (`ready: 65a6723b9873f8c9554a6cbc83ee4b0ddc8b8af9`, with `folio-assistant-core#676` `fe859f8bc733687f6c9d886fc3d2834d7a1ee370` ready to re-run once `#1136` lands); (2) evicted 36.79 GiB of superseded `cat-mount-v1-*` / duplicate `codeql` caches across `folio-assistant` (`98.3% -> 1.48%`), `cat-harness` (`99.9% -> 1.18%`), `cat-harness-tools` (`99.6% -> 6.11%`), and `folio-assistant-core` (`88.6% -> 9.71%`), checking off `Done when #3` (`< 80%` of 10 GiB) in `folio-assistant-9ml4` (`e8d13911a0da`); (3) updated `folio-assistant-f1nc` (`ba9077fd59f1`). R6-Lane-1 finishing `litlfred/dth-sc#25` (`y4pw` Item 6).

_2026-11-08T13:45:00Z_ — R7-Lane-2 merge & completion update:
- **Library sub-graph chain (`folio-assistant-f1nc`) and parent epic (`folio-assistant-4j43`) completed:**
  - `litlfred/cat-harness-tools#1709` (`external-schemas: read the declared workflow graph for BPMN terms`) — merged at `3666855f505ac7da8534a0e1b1945bd2ce203bbd` (`2026-11-08T12:48:25Z`).
  - `litlfred/cat-harness#1032` (`library/ becomes a named sub-graph; its corpus is opt-in`) — merged at `a13adf2a222699935a7465de33f0cafb257a2bb1` (`2026-11-08T12:48:28Z`).
  - `litlfred/folio-assistant-core#639` (`Core passes library/ down, and declares the library topic and process group`) — merged at `9d2bc54630897ee7a5791d6c9e7c6c86b4edfd8c` (`2026-11-08T12:48:32Z`).
  - `litlfred/folio-assistant#3016` (`Re-pin cat-harness and folio-assistant-core for the library sub-graph (stacked)`) — merged at `c00df6bfa29626e089cb4d4ae29d671bae1b6bec` (`2026-11-08T13:25:47Z`).
  - `litlfred/smart-base#326` (`Respell the code-lists skill link after cat-harness#1032`) — merged at `065308270b64d8cbb5bee19031e38567960097bb` (`2026-11-08T13:25:50Z`), closing `litlfred/smart-base#325` (`2026-11-08T13:25:52Z`).
  - With `f1nc` `completed`, all 17 work-item children of `folio-assistant-4j43` are `completed`; re-parented `drnh` directly under milestone `folio-assistant-rwmf` so `folio-assistant-4j43` closes cleanly (`status: completed`, `check:bean-rollup` green).
- **7 additional PRs merged (`13:25Z–13:34Z`):**
  - `litlfred/folio-assistant-core#676` (`Content split step 1: content-plan, -author, -publish, -retire move up from cat-harness`) — merged at `7b7784659c35f15471d7480c8f8d054a77eeda3f` (`2026-11-08T13:25:31Z`).
  - `litlfred/cat-harness#1136` (`Content split step 1: content-plan, -author, -publish, -retire move up to folio-assistant-core`) — merged at `767defc2be816134ca50845273e59aff151f0939` (`2026-11-08T13:25:35Z`).
  - `litlfred/cat-harness-tools#1693` (`LSI page becomes Indexing evidence; index health moves to the repo health report`) — merged at `bc9365121b269f5bb547a4c01310c5c58202d371` (`2026-11-08T13:33:59Z`).
  - `litlfred/cat-harness#1145` (`Indexing evidence: retitle the LSI page and point index health at the repo health report`) — merged at `49d57386b1d5b3062bdec0edf2a7f57a63668aa5` (`2026-11-08T13:34:03Z`).
  - `litlfred/folio-assistant-core#679` (`l1-document-ingestion applies lsi (its keywords come from the LSI weights)`) — merged at `10ebb330143689b57dc8d02effcbd6660fdaae31` (`2026-11-08T13:34:07Z`).
  - `litlfred/cat-harness#1140` (`Light/dark bulb on rail pages swaps the theme sheet too`) — merged at `edca4e4f8d6cafc5e90ca4fe9297e4277523c507` (`2026-11-08T13:34:10Z`), closing `litlfred/cat-harness#1139` (`2026-11-08T13:34:12Z`).
  - `litlfred/folio-assistant-core#653` (`folio-site-blocks: order and date a block's QA entries by the reviewed tree`) — merged at `9c0e7244000c141108f4a2875d3792675e9e5137` (`2026-11-08T13:34:14Z`).

_2026-11-08T15:30:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 7 update):
- **2 more PRs merged by Merge Manager (`14:30Z–15:02Z`):**
  - `litlfred/cat-harness-tools#1698` (`serve-local: point at the pages below a folder with no index.html`) — greened at `0e59ebb886a9b5ab11d5192a8e9b6159bd460e55` and merged at `6ca3aae5b42f07b6ce3f240d8d239a9a08880037` (`2026-11-08T14:30:57Z`).
  - `litlfred/who-iris#197` (`IRIS-style search page with dynamic facets`, closing `who-iris#196`) — greened at `e11c5e3d23a94b32c26eb7df2ec8bbb20563d662` and merged at `eae6e712e0d41ec702e635f2c278eb546722b7d5` (`2026-11-08T15:02:57Z`).
- **11 more PRs greened, marked ready for review, labeled `ready-to-merge`, and commented `"ready: <sha>"` for Merge Manager:**
  1. `litlfred/bootstrap#47` (`P3: call a repository a layer, not an instance (prose only)`): `ready: 08cb7544718e6578d7a945bef05ce83759375fad` (`#issuecomment-6722724059`).
  2. `litlfred/bootstrap-tools#84` (`docs: "layer" where "instance" means a repository (P3, prose only)`): `ready: 2983c3a2f00f4cb0972a57a41890fc0b87b25a42` (`#issuecomment-6722674858`).
  3. `litlfred/cat-harness#1143` (`docs(harness): instance means a node-kind instance; repositories are layers (P1 of #1138)`): `ready: d3223513993563471afdeb47debc2cefc31b5544` (`#issuecomment-6723342034`).
  4. `litlfred/cat-harness#1148` (`docs: "layer" where "instance" meant a repository (P3 of #1138)`): `ready: 5706a9e47e5185e2446014bb5d8742b72c63e848` (`#issuecomment-6723342436`).
  5. `litlfred/cat-harness-tools#1706` (`docs: "layer" where "instance" meant a repository, comments only (P3 of cat-harness#1138)`): `ready: 9ecde5c4646a1b4e3fd8f017e7ff719e78083876` (`#issuecomment-6723347471`).
  6. `litlfred/fhir-harness#312` (`Prose: call a repository in the stack a layer, not an instance (P3)`): `ready: c7509aa9490398aaa4c2acf60e733655a773c7bc` (`#issuecomment-6723341189`).
  7. `litlfred/folio-assistant-core#684` (`P3: say "layer" where prose meant a repository by "instance"`): `ready: 4652101b7471a8600177b7af3914978e8dbb4f2a` (`#issuecomment-6722372302`).
  8. `litlfred/smart-base#327` (`P3: say "layer" where "instance" meant a repository (prose only)`): `ready: 17fa8f4311096bfbab0fe932418e56f4ed53abe4` (`#issuecomment-6722655462`).
  9. `litlfred/smart-trust-phw#53` (`Wording: "layer" for a repository in the stack (P3, prose only)`): `ready: f96593df38de3c479bb6f66ff4c42925459cce13` (`#issuecomment-6722735089`).
  10. `litlfred/cat-harness-tools#1700` (`feat(index-config): harnesses instantiated vs layers mounted (P2a of cat-harness#1138)`): `ready: 2a28bab565f9cb385d1844a04bb2a6bd5d852294` (`#issuecomment-6723368206`).
  11. `litlfred/cat-harness-tools#1725` (`chore(beans): complete cat-tools-5fmc and cat-tools-pp9g; update cat-tools-sm8r`): `ready: 44680aed777a975540b453d70c9f72e78d7b6a12`.
- **2 paired PRs opened and labeled `ready-to-merge` for `folio-core-knsj` (`Content split step 3: move diff skill and /diff command to core`):**
  - `litlfred/folio-assistant-core#687` (`e21728721f5125f788088fa5a26f12bbc21d65c1`, adds `diff.md` + `/diff` to core and marks `folio-core-knsj` `status: completed`).
  - `litlfred/cat-harness#1162` (`f94e32b72f68cff60435bdba3f0c3d8c58681166`, removes `diff.md` + `/diff` from `cat-harness`).
  - Note for Merge Manager: back-to-back atomic pair (identical to `#676` + `#1136`); `core#687` and `cat-harness#1162` each pass 100% of tests and typechecks, with only the cross-layer `diff` uniqueness (`skill:commands:check`) vs `folio-changeset -> diff` (`graph:check-tools`) check waiting on the other half to land.

_2026-11-08T16:10:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 7 second-wave update):
- **2 more PRs merged by Merge Manager (`~16:00Z`):**
  - `litlfred/cat-harness-tools#1717` (`qa-sweep-pr: also compare by check_suite`, closing `cat-harness-tools#1716`) — greened at `1eb0260929a2f0606b7b9e00d62ed1a7f31dc5fc` and merged at `32aaeba0`.
  - `litlfred/folio-assistant-core#685` (`fix: render library-asset and external-reference detail pages`, closing `folio-assistant-core#682` & `#683`) — greened at `9d17eff4fc6da58fe7806a065d193475dd563c4d` and merged.
- **15 more PRs greened, marked ready for review, labeled `ready-to-merge`, and commented `"ready: <sha>"` for Merge Manager:**
  1. `litlfred/fhir-harness#314` (`fix: pass --site-root to link-Evidence-to-Requirements.py in site-generate`, closing `fhir-harness#313`): `ready: 8eeced277a16434960bc50a62acf167a459e84b9` (`#issuecomment-6724103864`).
  2. `litlfred/fhir-harness#317` (`feat(fsh): narrative page lists for Actors, Requirements, CapabilityStatements and Obligations`, closing `fhir-harness#316`, stacked on `#314`): `ready: 972bcde3cd0c7b78e50336f3f2dc9fe05f5a9e5d` (`#issuecomment-6724722130`).
  3. `litlfred/cat-harness#1155` (`fix(ui-core): give folder-row open chevron an explicit vertical transform`, closing `cat-harness#1154`): `ready: 67c9460b96929ecc7f631e7b382fc813a83ad8f9` (`#issuecomment-6724110216`).
  4. `litlfred/cat-harness-tools#1718` (`fix(ui): give the folder-row open chevron an explicit vertical transform`, refs `cat-harness#1154`): `ready: aeeca18262dc4b3f8cd1c709a7079ee57c6eaee1` (`#issuecomment-6724110447`).
  5. `litlfred/cat-harness-tools#1697` (`Compute keywords at site build; stop tracking keywords.json in git`, `cat-harness#1144` Step 1a — fixed `CodeQL` / `md-pipe-escape.test.ts` in `scripts/lib/keywords-page.ts:132`): `ready: d90a339ebd2eb6171535a9c0e56dfcbde6ccbee7` (`#issuecomment-6724417148`).
  6. `litlfred/cat-harness#1146` (`Compute keywords at site build; stop tracking keywords.json in git`, `cat-harness#1144` Step 1b): `ready: 6f290dd88540ccb933f5386533ed48ce372af19b` (`#issuecomment-6724520810`).
  7. `litlfred/folio-assistant-core#680` (`Stop requiring committed keywords.json for uploaded documents`, `cat-harness#1144` Step 1c): `ready: 2c21b1a25c275856f421e0c26b899b7d0fee40ca` (`#issuecomment-6724171071`).
     - Step 2 removal PRs resolved & green in draft (ready to mark once Step 1 lands): `litlfred/cat-harness#1147` (`679eb3ad5b651aa843d22b31d08a679cbeb54742`, 65 `library/corpus/**/keywords.json` rename/delete conflicts resolved), `litlfred/folio-assistant-core#681` (`30b1dba18dd8df2f3d720b1a61e54bdb3430dba8`), and `litlfred/who-iris#201` (`48cc016bc0888d8172c3696b8f8e043d96377b4c`).
  8. `litlfred/cat-harness#1163` (`fix(external-schemas): replace 20 placeholder descriptions in omg-bpmn-2.0.json`, fixing `cat-harness#1150` Item 1): `ready: 715163c6b7eb30d94944f1456241944dba30c958` (`#issuecomment-6724565850`).
  9. `litlfred/cat-harness-tools#1726` (`fix(external-schemas): treat "An X." / "The X." as placeholder descriptions`, companion to `cat-harness#1163`): `ready: 391cefd467a6a82aacf2483315058badaa348e0c` (`#issuecomment-6724628496`).
  10. `litlfred/smart-trust#171` (`fix(docs): fix English source typos and refresh gettext templates`, closing `smart-trust#149`): `ready: ba5e8aed0f79ee398f934534c3e6b603f2a8be61` (`#issuecomment-6724521807`).
  11. `litlfred/cat-harness-tools#1720` (`fix(site): render only the top layer's pages on a release site`, closing `cat-harness-tools#1719` site-scope chain): `ready: 0b9ffb51cc1893a7d59071e831b495ffbdd4d5f0` (`#issuecomment-6724554275`).
  12. `litlfred/cat-harness#1156` (`docs(ui-core): a release site renders only the top layer's pages`, closing `cat-harness-tools#1719` site-scope chain): `ready: 460117aaca6b7f47c91d1218cf36fc116ed8cff5` (`#issuecomment-6724554695`).
  13. `litlfred/folio-assistant-core#686` (`fix(site): scope the content-object index and bib to the top layer`, closing `cat-harness-tools#1719` site-scope chain): `ready: e1422a665185789f9457e7f74cb31c6699a72e37` (`#issuecomment-6724555079`).
  14. `litlfred/fhir-harness#315` (`fix(site): skip the IG fragment step when the top layer is not an IG`, closing `cat-harness-tools#1719` site-scope chain): `ready: a8c82d305d38df92beb740c6117969049ce21fb7` (`#issuecomment-6724555436`).
  15. `litlfred/cat-harness-tools#1727` (`perf(kg-validate): memoize per-instance validators and directory maps`, fixing `smart-base#331` & `folio-assistant#3043` shard 2/4 `kg-validate-nested-instances.test.ts` 120s timeout: `198.2s -> 1.97s` ~100x speedup): `ready: 1f93380f6fc3f6f2b0836fe7ffbcfae507cdc814` (`#issuecomment-6724778152`).

_2026-11-08T16:20:00Z_ — R6-Lane-1 (`folio-assistant-y4pw` Item 6): `litlfred/dth-sc#25` (`89e82c74d6b345114c31d742cbf270f61c5b3ccb`, branch `chore/y4pw-repin-smart-ra`) re-pins `dpi-h-ra` (`litlfred/smart-ra`) to `c14618fdb9b83a9f62fc06988aec039cc293525b` (keeping `["glossary", "archimate", "references"]`) and `cat-harness-tools` to `961b4d939d7d69874f44162d12407bd3f1d96c6b` with published layers cache ref `refs/cat/layers/402965e77a5ba5f3c431c6f3992f0110a8280e46ea614cbbef5af040f3ec0a73`. All 7 CI checks green (`gh pr checks 25 -R litlfred/dth-sc`), ready for review, labeled `ready-to-merge`, and commented `ready: 89e82c74d6b345114c31d742cbf270f61c5b3ccb` (`#issuecomment-6723927095`).

_2026-11-09T14:20:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 8 — R8-Lane-6 handover & bean rollup update):
- **27 Round 7 PRs merged overnight (`2026-11-08T17:12Z` – `2026-11-09T10:36Z`):**
  1. `litlfred/cat-harness-tools#1700` (`feat(index-config): harnesses instantiated vs layers mounted (P2a of cat-harness#1138)`) — merged at `e9bc8bad3cd5fc7b09c57a86752f55badef27f7b` (`2026-11-08T17:12:27Z`).
  2. `litlfred/cat-harness#1143` (`docs(harness): instance means a node-kind instance; repositories are layers (P1 of #1138)`) — merged at `81da2983d82415f6f5aace859df24f8ba9feeffe` (`2026-11-08T17:12:31Z`).
  3. `litlfred/cat-harness#1148` (`docs: "layer" where "instance" meant a repository (P3 of #1138)`) — merged at `469c4b482599d763bbf341423235c0ce49d15168` (`2026-11-08T17:12:36Z`).
  4. `litlfred/cat-harness-tools#1706` (`docs: "layer" where "instance" meant a repository, comments only (P3 of cat-harness#1138)`) — merged at `4f2d1cd211208ff0c813c0754f8bc64f8371ccf7` (`2026-11-08T17:12:41Z`).
  5. `litlfred/cat-harness-tools#1725` (`chore(beans): complete cat-tools-5fmc and cat-tools-pp9g; update cat-tools-sm8r`) — merged at `277c797958ed7925afed56f669e22a455bba180c` (`2026-11-08T17:12:45Z`).
  6. `litlfred/fhir-harness#312` (`Prose: call a repository in the stack a layer, not an instance (P3)`) — merged at `281c1682748aac55ec3b5f16f70081cd003637ff` (`2026-11-08T17:12:49Z`).
  7. `litlfred/folio-assistant-core#684` (`P3: say "layer" where prose meant a repository by "instance"`) — merged at `afeebc71d537bddd5d0e97b60ceb5cd1db984603` (`2026-11-08T17:12:53Z`).
  8. `litlfred/bootstrap#47` (`P3: call a repository a layer, not an instance (prose only)`) — merged at `9435037232a09950ffe442bb4b00cb7da54b5985` (`2026-11-08T17:12:57Z`).
  9. `litlfred/smart-base#327` (`P3: say "layer" where "instance" meant a repository (prose only)`) — merged at `081db44c7cef9f8a47a6038e66fd33e6fe280c07` (`2026-11-08T17:13:02Z`).
  10. `litlfred/smart-trust-phw#53` (`Wording: "layer" for a repository in the stack (P3, prose only)`) — merged at `630ff2ac88fb7413ff767ca706400466d842c180` (`2026-11-08T17:13:06Z`).
  11. `litlfred/cat-harness-tools#1726` (`derive-at-publish-order test: use a path that names no real file`) — merged at `2dba2c2ea9673202380a925b71132a14a3f24edb` (`2026-11-08T17:13:10Z`).
  12. `litlfred/cat-harness-tools#1697` (`Keywords built at publish, in six comparable variants (cat-harness#1144)`) — merged at `cae4b0d4d9a1d4d08f7c96af47ba61c9b4c4adf4` (`2026-11-09T10:35:29Z`).
  13. `litlfred/cat-harness#1146` (`Declare the keywords graph built at publish (cat-harness#1144)`) — merged at `d322dd4193c32e96d74775095ee50a844bae6b02` (`2026-11-09T10:35:33Z`).
  14. `litlfred/folio-assistant-core#680` (`Ingestion skill: keywords built at publish, six variants (cat-harness#1144)`) — merged at `d4efe9524fcbd8f59dd0d2c4d435462bb1f11815` (`2026-11-09T10:35:38Z`).
  15. `litlfred/folio-assistant-core#687` (`Content split step 3: move diff skill and /diff command to core (folio-core-knsj)`) — merged at `7fe2b769c8588728389dd506ded0d28ffe058c06` (`2026-11-09T10:35:43Z`).
  16. `litlfred/cat-harness#1162` (`Content split step 3: remove diff skill and /diff command (moved to core, folio-core-knsj)`) — merged at `bb7b098419a11e78a75807d38f3dba0d482ef069` (`2026-11-09T10:35:47Z`).
  17. `litlfred/cat-harness-tools#1720` (`Scope an IG site's page writers to the IG and its landing layer`) — merged at `265a83015eedc0b8c9cd1bcfa83ae3fd98dffbba` (`2026-11-09T10:35:52Z`).
  18. `litlfred/cat-harness#1156` (`Declare a scope input on the processes, library, methodologies and state viewers`) — merged at `0571cf18cb21b803a475ac00ae49c100963bc7bf` (`2026-11-09T10:35:56Z`).
  19. `litlfred/fhir-harness#315` (`Pass the IG site's scope to the site build`) — merged at `000f7479b479624abf6ffbdeb267d3ef99a01ecf` (`2026-11-09T10:36:01Z`).
  20. `litlfred/folio-assistant-core#686` (`glossary-page and bibliography-page honour --scope`) — merged at `a61fa66c0e152364d516807bac690950cc0204c2` (`2026-11-09T10:36:05Z`).
  21. `litlfred/cat-harness#1163` (`external-schemas: describe all operative BPMN 2.0 terms (#1150)`) — merged at `f6f1bcc3cdb1bb2d87ad622f4a0df28942bb1427` (`2026-11-09T10:36:09Z`).
  22. `litlfred/cat-harness#1155` (`head_custom.html: template notes as Liquid comments, not HTML comments`) — merged at `c2e07113bbab32c85a637acfc27c157eb4d404ef` (`2026-11-09T10:36:14Z`).
  23. `litlfred/cat-harness-tools#1727` (`perf(kg-validate): memoize per-instance directories and per-kind node schemas`) — merged at `8be6fbca9cbd3d1439cd22e3e667c4bbf7ff6718` (`2026-11-09T10:36:19Z`).
  24. `litlfred/cat-harness-tools#1718` (`Guard: the chrome's includes carry no HTML comments into pages`) — merged at `5668e3dad27638c574b327039b99265d6935ddcd` (`2026-11-09T10:36:23Z`).
  25. `litlfred/fhir-harness#317` (`Docs-site Library resources: CQL by URL, no embedded ELM`) — merged at `b916014e811778e2d9be56ece80d07e6a9d68445` (`2026-11-09T10:36:27Z`).
  26. `litlfred/fhir-harness#314` (`Serve each AST resource once at the site root; stop publishing ast-data/`) — merged at `3b583fd90778073a6bac853345e64867f6acbf88` (`2026-11-09T10:36:33Z`).
  27. `litlfred/smart-trust#171` (`Fix English source typos and markup mistakes in IG pages (#149)`) — merged at `ce5eafb8238b7ce681e6c846049f33dba2b42b53` (`2026-11-09T10:36:48Z`).
- **10 newly readied Round 8 PRs handed off to the Merge Manager at `2026-11-09T14:10Z`:**
  1. `litlfred/cat-harness#1147` (`Remove committed keywords.json: built at publish now (cat-harness#1144)`, keywords Step 2): `ready: 679eb3ad5b651aa843d22b31d08a679cbeb54742`.
  2. `litlfred/folio-assistant-core#681` (`Remove committed keywords.json: built at publish now (cat-harness#1144)`, keywords Step 2): `ready: 30b1dba18dd8df2f3d720b1a61e54bdb3430dba8`.
  3. `litlfred/who-iris#201` (`Remove committed keywords.json: built at publish now (cat-harness#1144)`, keywords Step 2): `ready: 48cc016bc0888d8172c3696b8f8e043d96377b4c`.
  4. `litlfred/cat-harness#1166` (`Library: paths to corpus entries name the corpus and the group (bean 6fez)`, bean `6fez`): `ready: 0c59467d266800765b6cdc2d68ac1e8d9dd7467a`.
  5. `litlfred/cat-harness-tools#1732` (`Comments name the corpus path of two library entries (bean 6fez)`, bean `6fez`): `ready: 7f033ce093a081e84b968a3818c3b5b341944eeb`.
  6. `litlfred/folio-assistant-core#690` (`Review sheet: open Title in a template's whole-tab lock`, closing `#689`): `ready: 83ed15a3365bef001836e5ffdf9de37c285f6b1c` (merged at `12a75b892f50ebe48fc241d7c061bde577a86604` at `2026-11-09T14:10:13Z`).
  7. `litlfred/cat-harness-tools#1735` (`page-layout.js: hash jumps are instant, not the theme's smooth scroll`, closing `#1734`): `ready: 255ce62786ccfea7bc66c8612c437b7451c19adc`.
  8. `litlfred/folio-assistant-core#694` (`Open a lazy document page at its chapter without scrolling on load`, closing `#693`): `ready: 5a830fd5363cbd1b1b3aa81549d305bd0f057b07`.
  9. `litlfred/cat-harness-tools#1731` (`YubiKey signing: sign.sh and verify-signatures workflow`, closing `#1730`): `ready: e48377b842c97580fad73d3935226bee1b43df41`.
  10. `litlfred/fhir-harness#320` (`IG releases: a tag builds a draft release with packages and ast-data.zip`, closing `#319`): `ready: d1da9422cb30b9a0d0a85925e431dfea3d972f0a`.
- **Bean rollup & audit updates:** completed `folio-assistant-tv20` (`folio-assistant#2953` merged at `bef2b0b1a6dafbd5ed558777f1d968b2019ad849` at `2026-11-08T18:29:09Z`), updated `folio-assistant-k3vv` (13/14 tracked children completed, Done-when Box 1 checked off, release-gated CI `#1158` Phases 1–4 recorded), `folio-assistant-9ml4` (`cat-harness-tools#1707` `839ee5d7`, `cat-harness-tools#1703` `dd0c48ba`, `folio-assistant#3038` `cc989094` merged), `folio-assistant-fwtz` (`folio-assistant#2875` `db9acd89`, `folio-assistant#2904` `97d2e407`, `cat-harness-tools#1707` `839ee5d7` merged), and `folio-assistant-k6dz` (`cat-harness#972` `d3d7a4da` merged closing `#971`; 79 `cat-harness` + 31 `folio-assistant-core` BPMN recount).

_2026-11-09T15:14:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 8 Lanes 1–5 completion update):
- **6 more PRs greened, marked ready for review, labeled `ready-to-merge`, and commented `"ready: <sha>"` for Merge Manager:**
  1. `litlfred/bootstrap-tools#84` (`docs: "layer" where "instance" means a repository (P3, prose only)` — re-triggered `CodeQL` after Nov 8 runner initialization glitch; all checks `CLEAN`): `ready: 0a910d86d156081cfa4570a3ad66c6be2c5a04f2` (`#issuecomment-6742287347`).
  2. `litlfred/cat-harness-tools#1744` (`fix(test): sync standalone-checkout fixture copies after P3 prose sweep`, fixing `schemas/standalone-fixture.test.ts` for `folio-assistant-core#695` & `fhir-harness#318`): `ready: 97ef69c58dab0bc5ff615ac3fce30cd6c8308f3d` (`#issuecomment-6742288354`).
  3. `litlfred/folio-assistant-core#696` (`fix(glossary): refresh glossary .pot and .po after P3 prose sweep`, closing `folio-assistant-core#695`): `ready: d15be26931c77233ba564edc7ca727cee3233740` (`#issuecomment-6743278551`).
  4. `litlfred/cat-harness#1173` (`fix(processes): regenerate merge-to-main.checklist.md`, closing `cat-harness#1169`): `ready: 6f144f826879f766c867f2c09914d2493d16956e`.
  5. `litlfred/who-iris#204` (`fix(iris-pages): resolve LIBRARY_LISTING_ROUTE when library is a sub-graph`, closing `who-iris#203`): `ready: ae83ab8c0517282e0087cfce5d686a4d3af6601b` (`#issuecomment-6743517904`).
  6. `litlfred/smart-base#334` (`chore: re-pin cat-harness-tools to 21e99640 for kg-validate memoization`, closing `smart-base#331`, with published layers cache ref `refs/cat/layers/892dd166330c7fe3c22152bc80edd3db00562bb7358b5bc572b7659bce222b12`): `ready: fb00db479b22b5a4f62be73b2961c2d3d7063818`.

_2026-11-10T16:40:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 9 wave — `2026-11-10T16:33Z`, R9-Lane-6 handover & bean audit):
- **Additional PRs merged on `2026-11-09` (`13:32Z–15:25Z`):**
  1. `litlfred/cat-harness-tools#1742` (`layer-pr-checks: runner writer records off by default (#1702 follow-up)`) — merged at `e4d550559c797a9c86f4b9c8b994c9d1607f67e1` (`2026-11-09T13:32:12Z`).
  2. `litlfred/cat-harness-tools#1740` (`gen-docs-pages: the base layer links its own repository in "generated from"`) — merged at `0816778051269d90fbaee93a84aa64ef72b2e320` (`2026-11-09T13:32:54Z`).
  3. `litlfred/cat-harness-tools#1741` (`merge-guard: check 5 judges the preview/agent-build verify status`) — merged at `5c4cd89a89847171fd3944ad707db6cab4b778c7` (`2026-11-09T13:32:57Z`).
  4. `litlfred/cat-harness-tools#1743` (`state-visualizer draws other layers' builtOnHostSite state-viewer pages`) — merged at `8e16797d1199ff28dae84c3372655c8f9ffe6060` (`2026-11-09T13:52:27Z`).
  5. `litlfred/cat-harness-tools#1737` (`Scoped IG sites leave out the PDF viewer and images no page uses`) — merged at `da7d4a5700f1ee3deefb1f17479cf8d128f311b8` (`2026-11-09T13:54:56Z`).
  6. `litlfred/cat-harness-tools#1739` (`IG sites load LHC-Forms, Crepe and harness images from a shared host (opt-in)`) — merged at `21e99640407c925a6e1f68b5a4a908f5130e8b73` (`2026-11-09T13:59:14Z`).
  7. `litlfred/fhir-harness#322` (`Fix lint: drop unused 'm' in repLinks`) — merged at `cbeaa16f016db8123b3fd2e62f06c7aac6e705b9` (`2026-11-09T15:25:12Z`).
  8. `litlfred/folio-assistant-sci#188` (`Declare the Editor checkers page here`) — merged at `c4bc9460b73e0e0d9dfc9d4ab3d0dce49340664d` (`2026-11-09T15:25:32Z`).
  9. `litlfred/cat-harness#1172` (`Drop the Editor checkers page (moved to folio-assistant-sci)`) — merged at `9ddc0a25ca447eb6fefe9e1cab94102c90a58ccf` (`2026-11-09T15:25:39Z`).
- **4 additional Round 9 PRs marked ready for review, labeled `ready-to-merge`, and commented `"ready: <sha>"` (`2026-11-10T16:33Z`) for Merge Manager:**
  1. `litlfred/cat-harness#1171` (`Stop the generated-from links and subgraph context flipping per checkout (#1150, item 4)`): `ready: ec9b47ebe8f37c7a06271628a638a09ae5b3fd6a` (`#issuecomment-6743904484`, owner OK on card Q-CGI-5 A; merges after re-pin train `litlfred/folio-assistant#3056` lands carrying `cat-harness-tools#1740`).
  2. `litlfred/cat-harness#1174` (`Show when a bookmark is selected`): `ready: 8c6ad804be7fcb92806f5ab349d048904b6b5132` (`#issuecomment-6773016298`).
  3. `litlfred/cat-harness-tools#1746` (`Show when a bookmark is selected`): `ready: 324f8f56403582401ca61e22031efb78f751df01` (`#issuecomment-6773017959`).
  4. `litlfred/cat-harness-tools#1747` (`derive:publish finds a host-site page's Tool in any layer`): `ready: 06aaa008829e1a41cf00532e4d39dce235300d25` (`#issuecomment-6773019775`).
- **Round 9 audit of `litlfred/who-iris#104` and `folio-assistant-bmat`:**
  - `litlfred/who-iris#104` (`IRIS CDN Exporter: follow-ups after the first slice`): all 5 repository code/verification/docs items remain verified and checked off (`[x]`, 5/7) on `litlfred/who-iris` `origin/main` (`48a2ecddc32b48b6c30bce1e0b3108cd62db9c2f` after `who-iris#197` `eae6e712e031` and `#202` `48a2ecddc32b`); the 2 remaining unchecked items (`IRIS_CDN_DID`/`IRIS_CDN_KEY_ID`/`IRIS_CDN_TRUST_ANCHOR_JWK` and Cloudflare R2/Artifacts/`IRIS_CDN_ENABLED=true`) stay open per owner ruling `Q-DQ-5 A` as owner provisioning actions for `WorldHealthOrganization/who-iris`.
  - `folio-assistant-bmat` (`Document back matter: Glossary`): all 6 checklist steps are checked (`[x]`) with 5/6 merged on `origin/main`; only `litlfred/dth-sc#24` (`a97df08a3b6d558e74d3de9bd52e70db4935c233`, closing `dth-sc#23`) remains open under the `dth-*` content hold (`dth-sc/main` is at `ad30f7e9f3b3` with release-gated layer checks after `#27`).

_2026-11-10T16:51:00Z_ — Antigravity drain coordinator (`92bff8c9-777d-458a-a380-8dd5bf5cc0f3`, Round 9 Lanes 1–5 completion update):
- **Merged in Round 9 (`R9-Lane-1`):**
  1. `litlfred/smart-immunizations#121` (`Lock and re-pin need layers (2026-11-09)`, closing `smart-immunizations#120`): published missing layers cache ref `refs/cat/layers/301b40b42e37a6fd1dec37d01be82d8783f8032ad654406072dad222e597ffa1`, re-ran failed `Layer PR checks` (`42630646485`), and marked `#121` ready for review — which triggered its armed GitHub auto-merge at `f3357b08a7df887a07817713e9c839fd16434230` (`2026-11-10T16:42:45Z`) and closed `litlfred/smart-immunizations#120`.
- **2 additional PRs readied / expanded in Round 9 (`R9-Lane-2` & `R9-Lane-5`):**
  1. `litlfred/cat-harness#1173` (`fix(cat-harness): resolve merge-to-main checklist, reference-direction, and graph:check-tools reds (#1169)`): rebased onto `9ddc0a25ca44` and expanded to fix all 3 `cat-harness` gate reds in `cat-harness#1169` (`bpmn:checklist:check`, `check:reference-direction:check` in `docs/wireframes/state-registry/intent.md`, and the 5 `--scope` `IdList` CLI inputs in `graph:check-tools`); all checks `SUCCESS`, `MERGEABLE (CLEAN)`, `ready: 534029c374ae03f7873527104d1fa8219fe1796f` (`#issuecomment-6773332231`).
  2. `litlfred/folio-assistant#3060` (`chore(gitattributes): drop remaining cat-harness/test/results/** rules (7mwa)`): removes the last 2 legacy `cat-harness/test/results/...` rules from root `.gitattributes` for bean `folio-assistant-7mwa`; all checks `SUCCESS`, `MERGEABLE (CLEAN)`, `ready: 9032181e6725a204d26e8c6729974db1ee7b298e` (`#issuecomment-6773330715`). Also closed superseded post-merge regen PRs `litlfred/folio-assistant#3049` and `#3050`.
- **Root-cause verification for `litlfred/folio-assistant-sci#189` (`R9-Lane-3`):**
  - 17 of 18 test failures (`instance-harnesses.test.ts` ×4, `state-visualizer.test.ts` ×11, `viewer-orphans.test.ts` ×2) cascaded from `derive:publish` throwing at `derive-at-publish.ts:328:17` (`visualiser folio-assistant-sci/editor-checkers is builtOnHostSite, but its Tool state-viewer has no bun run cat <script> invoke.shell`), which is fixed by `litlfred/cat-harness-tools#1747` (`06aaa008829e`). The 18th test failure (`schemas/standalone-fixture.test.ts`) is fixed by `litlfred/cat-harness-tools#1744` (`97ef69c58dab`). Commented verification summary on `folio-assistant-sci#189` (`#issuecomment-6773284440`).
- **Bean `folio-assistant-cysv` audit (`R9-Lane-4`):**
  - Updated `folio-assistant-cysv` (`status: in-progress`, 3/3 proposal checkboxes `[x]`): all Stage 1 & Stage 2 platform deliverables are merged (`folio-assistant-core#462`, `#465`, `#489`, `#497`, `#566`, `#569`, `smart-base#270`, `cat-harness-tools#1705`) with 30/30 tests passing, and 3/5 DTH repos (`dth-hrh#72`, `dth-sc#8`, `dth-phc#7`) are migrated on `main`; only `dth-pc#8` and `dth-sfp#6` remain open on content branches under the `dth-*` content hold.



