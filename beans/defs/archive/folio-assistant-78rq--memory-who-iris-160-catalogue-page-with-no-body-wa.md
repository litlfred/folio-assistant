---
# folio-assistant-78rq
$schema: bean/1.0.0
title: 'Memory: who-iris#160 (catalogue page with no <body>) was already fixed in who-iris#133; the cause was smart-trust''s stale who-iris pin, fixed by re-pin smart...'
status: completed
type: task
priority: low
created_at: 2026-11-01T19:54:58Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-iris-body-repin.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: who-iris#160 (catalogue page with no <body>) was already fixed in who-iris#133; the cause was smart-trust's stale who-iris pin, fixed by re-pin smart-trust#125

2026-11-01 ~19:55Z, thread "Fix who-iris redirect page breaking previews" (cmsg_017WNUkNK8kdDziPK58Pv6G94icbGtks899jCWeK3Tv91P).

- who-iris main gave the catalogue forwarding stub a `<body>` in #133 (bdadee3, 2026-10-30). The failure "stage-local: 1 page(s) have no <body>… who-iris/catalogue/index.html" means the consumer pins who-iris BEFORE bdadee3. Re-pin; don't patch who-iris.
- smart-trust pinned f524a7e; smart-trust#125 re-pinned to 9ce0140, MERGED 2026-11-01 20:35Z (fc64f2b, Q-WIR-2 A tap). who-iris#160 closed.
- smart-base pins who-iris 04472dc separately (pins may differ across layers).
- Re-pin recipe without mount-from-lock.sh: clone each lock mount at its ref into its path, `bun install`, then `echo <evidence> | bun run cat-harness-tools/scripts/remote-mount.ts --seed who-iris=litlfred/who-iris@<sha> --consent-by litlfred --whole --no-install --fresh`, then `remote-mount.ts --no-install --fresh`.
Related: folio-assistant-sgz9 folio-assistant-9y9s.
