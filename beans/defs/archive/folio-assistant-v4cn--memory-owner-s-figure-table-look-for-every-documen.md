---
# folio-assistant-v4cn
$schema: bean/1.0.0
title: 'Memory: Owner''s figure/table look for every document site (hover controls, centred, titles <=66%), where it lives, and dth-pc staging gotchas'
status: completed
type: task
priority: low
created_at: 2026-11-01T17:57:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `figure-table-layout-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner's figure/table look for every document site (hover controls, centred, titles <=66%), where it lives, and dth-pc staging gotchas


Owner 2026-11-01 15:59-16:00Z: figures pan on drag, never rescale; on a laptop the figure controls show only on hover; tight padding; figures, tables and their titles centred, titles at most 66% wide; the same style on every document site.

Done (merged 2026-11-01): cat-harness#917 (drag pans), cat-harness-tools#1282 (render-markdown wraps every figure, diagram and table block in `<div class="fa-numbered fa-numbered-<kind>" markdown="1">`), cat-harness#923 (site-chrome CSS/JS: `.fa-figure-host`, hover-only controls under `(hover:hover) and (pointer:fine)`, `.fa-numbered > p` max-width 66%). Issue cat-harness#922. Change the look in those two files, not per folio.

dth-pc staging gotchas: a CI preview does not publish; run `bun run cat-harness-tools/scripts/stage-local.ts --repo .` from a dth-pc clone that has `origin/main` fetched (a single-branch clone fails in changeset.ts). Re-pin with `remote-mount.ts --seed name=owner/repo@sha --consent-by litlfred` (consent text on stdin, `--fresh` if the mount was edited locally), then run `remote-mount.ts` again to rewrite the lock digests. Changing a ref in the lock by hand leaves the old treeDigest and breaks the mount.

See folio-assistant-wmmg.

Poster look (owner Q-POSTER1 A, 2026-11-01 22:13Z): every dth-* ArchiMate figure uses the shared poster renderer (cat-harness-tools archimate/scripts/render-poster.ts), extended for framed views in tools#1349 (issue #1348). Fix layout there, never per folio.
