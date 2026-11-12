---
# folio-assistant-h4fi
$schema: bean/1.0.0
title: 'Memory: Thread "Make remaining DPI-H RA figures computable" (2026-11-01 17:49Z) - figure inventory, skips, branch, Q-RAFIG cards'
status: completed
type: task
priority: low
created_at: 2026-11-01T17:54:47Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-remaining-figures.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Make remaining DPI-H RA figures computable" (2026-11-01 17:49Z) - figure inventory, skips, branch, Q-RAFIG cards

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9UepaMqGRybGWQGzxmMg5KD. User 17:49Z: "make the rest of the figures computable (unless sourced externally)". This explicit ask authorises smart-ra figure content work. Still ask before merging.

The Integrated view thread owns blocks f-3-3-8f9618 (image19) and f-3-5-3-93e90c (image26). Leave them alone.

Branch litlfred/smart-ra claude/remaining-figures-computable, built on claude/poster-theme-preview (tools pinned to cat-harness-tools claude/poster-theme-views, preview only).
- From existing views: f-3-3 (img21), f-3-3-5aba0f (img20), f-3-3-9fbe49 (img22) come from model 0.2.0-draft.3. f-3-7-2-* (img28/29) come from 0.2.0. f-f-1cea81 (Fig A.1, img30) is view "Metadata Registry Governance" in 0.3.0-draft.1, which needs its <MD>/????? names fixed.
- New views needed: Fig 3.1 (img18) and Fig 3.4.1 (img23).
- Skipped as external: Fig 1 (img1, WHO DIIG map), Fig 3.4.2 (img24) and Fig 3.4.3 (img25), both adapted from OpenHIE.
- Q-RAFIG-1 is open, about Figs 2.2/2.3/3.6 (infographics): A = ArchiMate Principle/Goal plus a data file for 3.6 (recommended), B = data files only, C = leave.
Local build: siblings cloned at /home/claude/{bootstrap-tools,cat-harness}, then run bun archimate-blocks.ts --instance .
18:15Z: issue smart-ra#217, draft PR smart-ra#218 (base claude/poster-theme-preview; rebase to main after tools#1294), subscribed. Done: Figs 2.3, 3.1, 3.3, 3.4, 3.4.1, Q&CC, 3.7.1, 3.7.2, A.1 (spec tools/archimate-dth/dpi_h_figures.py). Q-RAFIG-2 is open (Fig 2.2: A = text-defined parts only plus a committee issue, recommended). Staging: https://litlfred.github.io/smart-ra/STAGING/claude-remaining-figures-computable/en/dpi-h-ra/index.html (github.io is blocked from the sandbox; check the pages run via gh api actions/runs).
18:45Z: Q-RAFIG-1 A and Q-RAFIG-2 A are answered. Fig 2.2 (text parts) and Fig 3.6 are done: Fig 3.6 comes from tools/figures/exchange-patterns.json via draw_patterns.py. Committee issue #219 covers Fig 2.2's extra statements. The key-overflow fix is in tools 92790d6 (on the poster branch). gh-pages deploys cancel each other, so publish one at a time and coordinate with the Integrated view thread. The PR base ref must be fetched as refs/remotes/origin/claude/poster-theme-preview, or the changeset step fails.
19:16Z: staging is live (gh-pages 0bbd375). Q-RAFIG-3 is open (merge plan: A = after tools#1294, retarget to main and merge on green before 20:27Z).
19:33Z: Q-RAFIG-3 A. #218 force-pushed onto main as 446b761 (tools pinned to main 07c14d4), base set to main, marked ready, full CI running. Merge on green before 20:27Z. The 3.4.1/A.1 layout fixes are in. The Integrated view thread has no main PR for 3.2/3.5 yet.
20:15Z: CI red on 446b761 (8 gates from the tools re-pin skew, plus corpus-gate). Q-RAFIG-4 A (20:05:33Z): dropped the re-pin (d76f25c, tools back to main's 6d02c6a). The corpus-gate needs an editing-hci-validation instance per changed block: `bun run cat-harness-tools/scripts/state-mount.ts`, then `workflow-cli.ts start editing-hci-validation fig:<block>`. Instances are stored on branch cat/dpi-h-ra/beans. The safety check refused auto-recording the editor steps as litlfred, so I asked Q-RAFIG-5 (A = record in their name). One partial instance, editing--fig-f-2-3-7da398, sits locally at Open_Exists and is not pushed.
20:35Z: the review page showed figures as broken images, and there was no visible change in side-by-side. Fix: cat-harness-tools#1327 (issue #1325, branch claude/review-figure-diff) resolves img src per side and adds a Before/After pair. Merge it on green under the window, then re-pin smart-ra tools (separately from #218, to avoid skew) and republish. The local stage-local failed because the cat-harness-tools mount still hashes to 07c14d4: delete the mount dir and re-mount first. Review page URL: <staging root>/en/review/.
21:42Z: tools#1327 merged (90f0bd7, Q-RAFIG-6 A). The smart-ra re-pin is handled by #223 (thread …AiBgGtk6KpnZqLDwrW6TDi); I asked it to include tools ≥ 90f0bd7. After #223 merges, restore the figures' svg keys in cat-archimate.config.json and republish staging. #218 is red only on the corpus-gate, waiting on Q-RAFIG-5.
22:40Z: smart-ra#207 (owner OK 22:37Z) also edits the Fig 3.7.1/3.7.2 blocks, SVGs and svg keys. If it lands first, merge main into #218 and rerun archimate-blocks to regenerate through the conflicts. #223 is still open.
