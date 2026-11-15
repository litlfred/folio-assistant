---
# folio-assistant-8iag
$schema: bean/1.0.0
title: 'Memory: Bean cysv stages 1-2 (2026-11-01): core shared DTH checks (core#462), dth init (core#465), DTH switch branches, Q-CYSV1 sign-offs'
status: completed
type: task
priority: low
created_at: 2026-11-01T08:00:04Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-shared-checks-cysv.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Bean cysv stages 1-2 (2026-11-01): core shared DTH checks (core#462), dth init (core#465), DTH switch branches, Q-CYSV1 sign-offs


Thread "Share DTH scripts and add dth init" (cmsg_017WNUkNK8kdDziPK58Pv6G95c3ry3kuypdeGq44g3KFZJ), parent "Put DTH proposal beans to the owner". Issue folio-assistant-core#461.

- core#462 (branch claude/dth-shared-checks): `scripts/folio-l1-coverage.ts` (one L1 coverage runner: captured = every .md/.ts under folio/<name>; per-folio `l1-coverage.exclusions.json` keyed by text and `l1-coverage.quotes.json`), plus `glossary-validate.ts` from core#377 (supersedes it; I could not edit #377's branch, the safety check refused). Fix: glossary-page.ts reads --instance only when run itself.
- core#465 (claude/dth-init, stacked on #462): `bun run dth:init`, templates in `templates/dth/`.
- DTH branches `claude/dth-shared-checks` committed locally in dth-hrh, dth-sc (main) and dth-sfp, dth-pc, dth-phc (on top of their scaffold PR branches). They need a core repin after #462 merges. sc/pc/phc keep their block checks as `check:dth-blocks` (scripts/folio/check-dth-blocks.ts) until lo3p moves them to kg-audit.
- Q-CYSV1 (asked 08:00Z): 7 L1 sentences (pc 2, phc 5) need the owner's sign-off. Agents may not write the owner's name in signedOffBy, so option A = GitHub suggested change on each PR; the owner commits it. List: /mnt/project-files/dth-shared-checks-2026-11-01/signoffs.md.

- 2026-11-01 09:26Z owner tapped Q-CYSV2 A; core#462 merged as d95399b. Core repinned to d95399b in dth-hrh#72, dth-sc#8 (marked ready), dth-pc#8, dth-phc#7 (drafts; phc rebased by owner to 0928d86 first). dth-sfp not repinned: its base feat/dth-sfp-complete has a stray `ref` key on the who-iris instance source, so remote-mount refuses the config. core#465 rebased on main, ready. The safety check refused the merge under the window; each merge batch needs the owner's tap.
- 10:09Z Q-CYSV4 A: sc/sfp cat-harness d9223fb + tools 6417b9d (dth-hrh's). Remount with the NEW tools (run dth-hrh's remote-mount.ts from the repo) since old tools crash on core d95399b; use --fresh if the mount has edits or the lock keeps old shas. 10:20Z Q-CYSV5 A: merge core#465, dth-hrh#72 (merged a27f97b), dth-sc#8 each when green. Open: dth-phc 5 + dth-sfp 3 L1 sentences need owner's call; dth-pc 2 carried over (Q-CYSV3).

Related: folio-assistant-7dra, folio-assistant-gdav, folio-assistant-wmmg.
