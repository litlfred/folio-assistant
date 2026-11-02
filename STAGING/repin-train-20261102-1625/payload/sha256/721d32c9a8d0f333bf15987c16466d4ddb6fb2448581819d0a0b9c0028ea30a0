---
# folio-assistant-drnh
$schema: bean/1.0.0
title: 'Merge-window drain to 2026-11-03 00:40Z: PRs, re-pin train, open cards (handover bean)'
status: in-progress
type: task
priority: high
created_at: 2026-11-02T18:20:00Z
updated_at: 2026-11-02T22:51:08Z
parent: folio-assistant-4j43
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

- [ ] cat-harness#972 — green draft; content, waits on card Q-B1-2.
- [ ] cat-harness#980 — checks running; merge on green.
- [ ] cat-harness#959 — checks running; merge on green (meta-merge skill).
- [ ] cat-harness-tools#1399 — checks running; merge on green.
- [ ] who-iris#165 — waits on the re-pin train.
- [ ] cat-harness-tools#1299 — waits on the re-pin train.

Report artifact: https://claude.ai/artifact/Qipen2fFHYXcAXsjakKNqr

## Re-pin train

- [ ] folio-assistant#2921, branch repin-train/20261102-1625. A cron replaces the train every 2 hours: always use the NEWEST repin-train/* branch.
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
