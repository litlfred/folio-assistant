---
# folio-assistant-o7nv
$schema: bean/1.0.0
title: 'Memory: Rail Pages tree folds "Bibliography: …"/"Tools — …" rows (cat-harness-tools#1262); smart-ra#213 re-pin saga and the 6 red gates follow-up, 2026-11-01'
status: completed
type: task
priority: low
created_at: 2026-11-01T20:26:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `rail-fold-families.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Rail Pages tree folds "Bibliography: …"/"Tools — …" rows (cat-harness-tools#1262); smart-ra#213 re-pin saga and the 6 red gates follow-up, 2026-11-01


Fix: `foldTitlePrefixes` in cat-harness-tools `scripts/lib/jekyll-pages-nav.ts`. Sibling rows sharing `<Head>: ` or `<Head> — ` (2+) fold under one `<Head>` row; children drop the prefix. MERGED 16:47Z as 3c2d2ed (owner Q-NAV-2 A). Bibliography pages come from folio-assistant-core scripts/bibliography-page.ts.

smart-ra live site: smart-ra#213 (thread "Collapse bibliography entries in left navbar", cmsg_017WNUkNK8kdDziPK58Pv6G943GkW9XQoC4zXJtaxuHrwu) re-pinned EVERY layer to main, smart-base included (Q-NAV-3 A, Q-NAV-6 A, Q-NAV-7 A). The staging preview showed Bibliography folding 101 entries. MERGED 20:25Z as 73b6d04 with 6 platform gates red (owner Q-NAV-8 B). Live publish run 41346789088.

Lesson: re-pinning one layer of a folio a day ahead exposes skew. Moving all layers to main exposes each lower layer's own main drift (stale generated files, standalone baselines). Expect several rounds.

The 6 red gates on smart-ra main (owner 20:25Z: "fix 6 red"):
- check:cat-harness-tools-standalone #1-4: the tools#1320 skip only covers layer mode, not a folio index. The "Fix core main record runs" thread (cmsg_017WNUkNK8kdDziPK58Pv6G93hPPrepUo5bjTf4aT8PZGd) is extending it.
- kind:json-schemas archimate.schema.json: stale again on newer tools main. The same thread is regenerating it.
- smart-base:processes:render:check (7 SVGs): CAUSE = runner fontconfig hints (hinting True, hintstyle 1), so text lands on whole pixels. Measured on a runner: `--font-render-hinting=none` gives 0 stale; a no-hint FONTCONFIG_FILE alone gives 7 (bootstrap-tools#67). bootstrap-tools#66 (another thread, cmsg_017WNUkNK8kdDziPK58Pv6G92Ks2zmXKa7h2gejXkCWjqg) uses a fontconfig approach; I told it. The scratch branch smart-ra claude/render-diag could not be deleted (proxy refused), so the owner can delete it. bootstrap-tools render-kg-to-github-pages.svg is also stale on main and needs a redraw.
- tools#1326 merged 21:10Z. cat-harness#933 in CI.
After the fixes merge, re-pin smart-ra (merge window to 2026-11-02 01:36Z).
