---
# folio-assistant-7dra
$schema: bean/1.0.0
title: 'Memory: Beans 6chd (PDF re-segmentation), cysv (dth init), lo3p (DMN QA): Q-S4-1..6 answers, threads and PRs, 2026-10-31/11-01'
status: completed
type: task
priority: low
created_at: 2026-11-01T08:01:54Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-platform-proposals.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Beans 6chd (PDF re-segmentation), cysv (dth init), lo3p (DMN QA): Q-S4-1..6 answers, threads and PRs, 2026-10-31/11-01


Doc: https://claude.ai/artifact/SwfuodbpXGxDvv3BCBohFW. Owner said "continue." 2026-11-01 07:35Z (read as Q-S4-1..4 all A) and "work ... re-segmentation, dth init" + "spawn siblings" 07:37Z.
- 6chd: thread "Put DTH proposal beans to the owner". Issue cat-harness-tools#1219, PR #1229 merged 2026-11-01 08:15Z as 2c53917 (labelled steps under contents chapters, flat-outline reorder, margin furniture stripping, toc-benchmark --gold with keys in scripts/tests/fixtures/dth-toc-gold.json). PC+PHC title F1 0.65 -> 0.93. Known gap: two steps on one page, text-stream order.
- cysv: sibling "Share DTH scripts and add dth init" (cmsg_017WNUkNK8kdDziPK58Pv6G95c3ry3kuypdeGq44g3KFZJ): core#462 shared coverage + glossary validator, core#465 dth init. Q-CYSV1 (7 L1 sign-offs, one-tap suggestions per smart-base#249).
- lo3p: sibling "Add checks for DTH decision tables" (cmsg_017WNUkNK8kdDziPK58Pv6G9RoeQEhypv6LFz5DvAGEfXx): cat-harness-tools#1224 merged 07:57Z (dmn checker src/workflow/dmn-qa.ts, standalone not kg-audit), #1228 renames to dmn:report. Dry run: dth-pc clean, dth-sc 4 errors, dth-sfp 7, dth-phc 11 warnings. Q-S4-5 A: warning step; content fixes dth-sc#7, dth-sfp#5 held for editors.
- Gotcha: CI gates every `*:check` script of a mounted layer, so a new check script turns every DTH re-pin red; name it `*:report` until the DTHs pass.
- cat-harness-tools Python tools need CAT_HARNESS_ROOT (a dir with cat-harness.json) when cat-harness isn't cloned beside it.
- Shared memory files are last-write-wins between threads: re-read before rewriting.
See folio-assistant-82df, folio-assistant-gdav.
- 2026-11-01 08:45Z: #1224 and #1228 merged (adbc884); the CLI is `dmn:report` because a `*:check` script in a mounted layer is gated in EVERY downstream repo. Q-S4-5 A: content fixes dth-sc#7 and dth-sfp#5 (into feat/dth-sfp-complete) held for editors. A DTH adds its own `check:dmn` once its tables pass and it re-pins tools (DTHs pin tools f62a1d9, ~150 commits behind).
