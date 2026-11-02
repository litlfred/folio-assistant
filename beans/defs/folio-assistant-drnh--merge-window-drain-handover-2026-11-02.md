---
# folio-assistant-drnh
$schema: bean/1.0.0
title: 'Merge-window drain to 2026-11-03 00:40Z: PRs, re-pin train, open cards (handover bean)'
status: in-progress
type: task
priority: high
created_at: 2026-11-02T18:20:00Z
updated_at: 2026-11-02T19:42:55Z
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

- [ ] Q-SLASH-8 — run the command above
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
