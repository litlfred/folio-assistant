---
# folio-assistant-q2aj
$schema: bean/1.0.0
title: Recheck Beads (gastownhall/beads) maturity against beans
status: completed
type: task
created_at: 2026-09-23T22:32:13Z
updated_at: 2026-10-29T07:40:00Z
parent: folio-assistant-8jt6
---

Follow-up to b91x (owner decision 2026-09-23: keep beans, recheck in ~3 months, i.e. on or after 2026-12-23). Evidence baseline: cat-harness/docs/research-and-analysis/prior-art.md.

## Done when
- [x] Beads' storage-layer issues re-measured (retractions, data-loss / dolt-pull issues since 2026-09-23) and hmans/beans activity re-measured
- [x] findings added to the prior-art page's health table with the new date, and the keep/move question put back to the owner

## Summary of Changes

Re-measured `hmans/beans` and `gastownhall/beads` on 2026-10-24 via GitHub API and updated `cat-harness/docs/research-and-analysis/prior-art.md` (and `index.md`) in [`litlfred/cat-harness#555`](https://github.com/litlfred/cat-harness/pull/555) (`a9985a706`):

- **`hmans/beans` (2026-10-24):** still at `v0.4.2` (2026-03-10) and commit `99260bf` (2026-04-06) — zero commits or releases since 2026-09-23; 955 stars, 72 forks, 39 open / 21 closed issues; no storage or corruption instability in our usage.
- **`gastownhall/beads` (2026-10-24):** 592 commits since 2026-09-23 (~19/day), shipping `v1.3.1` (2026-09-30) and fix-only `v1.3.2` (2026-10-24) across 5 RCs; 28,166 stars, 1,897 forks, 1,071 open / 1,807 closed issues; no new `go.mod` retractions beyond `v1.1.1`/`v1.2.0`/`v1.2.1`. While `#6547` and `#6575` closed, `#4356` remains open, `v1.3.2` had to fix three `v1.3.1` data-loss/write-reversion regressions (`#7030`/`#7146`, `#7031`/`#7041`, `#7032`/`#7044`), migration `0059` corrupted `is_blocked` flags on embedded Dolt 2.2.0 (`#7037`), and ten new multi-clone migration and `bd dolt pull`/`bd sync` conflict/data-loss issues opened (`#6727`, `#7037`, `#7039`, `#7073`, `#7294`, `#7757`, `#7781`, `#7783`, `#7795`, `#7811`).
- **Owner question framed on page:** (a) keep `beans` (and close watch or recheck on/after 2026-12-23 per `b91x`), (b) trial `Beads` `v1.3.2` alongside `beans` in an isolated workspace, (c) fork/maintain `beans` or lean on in-tree TypeScript tooling, or (d) plan a migration to `Beads`.

## Log
- 2026-10-24T13:28:00+02:00 — Claimed (`status: in-progress`) by Antigravity (`44190586-6f7e-4f91-bace-14f09541fa6a`). Re-measuring `gastownhall/beads` and `hmans/beans` via GitHub API and updating `cat-harness/docs/research-and-analysis/prior-art.md`.
- 2026-10-24T13:37:30+02:00 — Opened [`litlfred/cat-harness#555`](https://github.com/litlfred/cat-harness/pull/555) (`a9985a706`) with the 2026-10-24 re-measurement and keep/move question for the owner.

## Closed 2026-10-29

All done-when boxes met. cat-harness#555 merged 2026-10-29. (Lane B drain thread.)
