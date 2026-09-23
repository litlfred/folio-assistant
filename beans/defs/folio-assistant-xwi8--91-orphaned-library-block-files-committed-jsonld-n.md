---
# folio-assistant-xwi8
title: '91 ORPHANED LIBRARY BLOCK FILES: committed .jsonld no section references — keep or prune?'
status: todo
type: task
priority: normal
created_at: 2026-09-23T07:30:19Z
updated_at: 2026-09-23T07:34:11Z
parent: folio-assistant-slw1
---

Found by bean `zaqn`. `gen-library-jsonld` reports 91 orphaned block files ("referenced by no section … Remove with --prune, once you have looked"):

| document | files |
|---|---|
| smart-base/library/9789240093362-eng | 47 |
| agent-skills/library/arxiv-2608.08453v1 | 20 |
| agent-skills/library/arxiv-2607.25032v1 | 12 |
| cat-harness/library/arxiv-2508.05192v2 | 12 |

About 364 KB total; last touched 2026-09-22/23.

`zaqn` REWROTE their `folio:` terms in place (owner's choice, 2026-09-23) so the prefix gate passes — it did not delete them. Deleting is a person's decision (deletion-requires-confirmation).

## Todo

- [ ] find why each document's sections stopped referencing them (re-ingest? section split changed?)
- [ ] owner decides: prune, or restore the references

## Done when

`gen-library-jsonld` reports 0 orphaned block files.
