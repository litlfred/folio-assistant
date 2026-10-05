---
# folio-assistant-he8h
title: 'QA-REPORTS: don''t record a result when neither content nor result changed'
status: todo
type: task
created_at: 2026-10-05T18:45:22Z
updated_at: 2026-10-05T18:45:22Z
---

## Why

The owner saw the same mechanical QA results repeated on the `cat/cat-harness/qa-reports`
branch (2026-10-05). Measured that day: `main/` holds 140 per-commit snapshots, and its
`cat-harness/test/results/translation-qa` subtree has only **2 distinct trees** across
them (89 + 51 identical copies). 142 `pr/<n>` refs add more. Prune keeps everything on
main for 90 days, so nothing has gone yet.

## Owner's rule (2026-10-05)

> if content didnt change, and result didnt change, dont need to record.

So a publish must not write a new entry for a subject whose content hashes
(`field_hash` / `source_hashes`) AND result are both unchanged from the newest
recorded entry. A reader at a later sha must still resolve the result — e.g. by
falling back to the newest earlier entry (like `MOVED_QA_SUBJECTS`/`movedFrom` falls
back on a miss), not by reporting `miss`/unknown.

## Done when

- [ ] `qa-store` publish skips unchanged subjects (or entire unchanged snapshots).
- [ ] `readBaseline`/`readQa` resolve a skipped sha to the last recorded result; a
      test shows a skipped commit is not read as "never audited".
- [ ] Measured again on qa-reports after a few pushes: no identical repeats added.
