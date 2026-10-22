---
# folio-assistant-792f
$schema: bean/1.0.0
title: state:mount --id <one> drops /merge-reviews/** from the .gitignore state-mounts block
status: in-progress
type: bug
priority: normal
created_at: 2026-10-22T15:00:02Z
updated_at: 2026-10-22T15:00:02Z
parent: folio-assistant-fs43
---

`bun run cat state:mount -- --id beans` rewrites the `# BEGIN/END state mounts` block of the root `.gitignore` and drops `/merge-reviews/**`. This was seen twice on 2026-10-22, both times in a checkout at main `6be6532`'s ancestors. The diff each time was:

```
-/merge-reviews/**
```

Every agent that mounts beans then has a dirty tree it did not mean to make, and the stop hook asks it to commit. Committing would un-ignore a state mount on `main`.

Likely cause, not yet read in code: the block is regenerated from the graphs this mount resolved (here only `--id beans`, or the declarations in this checkout) rather than from every declared state graph, so `merge-reviews` (bean 30jr's merge queue) falls out.

## Done when

- [ ] `state:mount -- --id <one graph>` leaves `.gitignore` byte-identical when the declared set did not change
- [ ] a test mounts one graph and asserts the block still lists every declared state mount

_2026-10-22T16:05Z_ — Claimed by lane B2 (session_01Kymnx79TxWvxVoLzcAjBRr); fix in `cat-harness-tools/scripts/state-mount.ts`, PR on cat-harness-tools.
