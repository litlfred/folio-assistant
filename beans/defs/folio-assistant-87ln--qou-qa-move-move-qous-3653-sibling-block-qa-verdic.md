---
# folio-assistant-87ln
title: 'QOU QA MOVE: move qou''s 3,653 sibling block-QA verdicts into test/results/block-qa/ (s3p2 option 2)'
status: todo
type: task
created_at: 2026-09-23T13:29:00Z
updated_at: 2026-09-23T13:29:00Z
parent: folio-assistant-q4jm
---

Owner ruling 2026-09-23 on s3p2: "1 + 2=bean". Option 1 (fix the sweep's anchor) is done in s3p2. This is option 2.

**What:** move qou's block QA verdicts from the legacy sibling layout (`content/…/<block>.qa.json`, beside each block) into the results tree `test/results/block-qa/content/…/<block>.qa.json`, which `blockQaPath` documents.

**Measured 2026-09-23 (qou `7aafd8dbe`):** 3,653 `*.qa.json`, all siblings under `content/`. None in the results tree.

**Why it is safe to do and safe not to do:**
- `existingBlockQaPath` reads the results tree first and the sibling second, so nothing is lost either way.
- The sweep WRITES only the results tree. So the first sweep after this move finds its verdicts, while without the move a block briefly has a fresh verdict in the tree and an old one beside it. Readers take the tree's.
- Freshness is keyed on content hashes (`source_hashes`, `field_hash`), not on paths, so a move marks nothing stale.

**Why a separate bean:** it is a 3,653-file change in the author's math repository. qou's AGENTS.md requires `/prepare-merge` plus an explicit "merge it" from the author for every merge to main.

## Done when
- [ ] a qou PR moves the files with `git mv`, so history follows
- [ ] a qou sweep afterwards reports the same pass/fail/stale counts as before the move
- [ ] the author says "merge it"
