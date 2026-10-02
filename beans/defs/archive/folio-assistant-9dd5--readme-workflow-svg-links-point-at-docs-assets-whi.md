---
# folio-assistant-9dd5
title: README workflow-SVG links point at docs/assets/, which the docs/folio-assistant/ move emptied
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:19:05Z
updated_at: 2026-09-19T10:47:40Z
---


_2026-09-19T10:19:14Z_ — Measured on origin/main at 2b2a1bc5, 2026-09-19, from a clean tree: 0 files match docs/assets/img/workflows/*.svg, 32 match docs/folio-assistant/assets/img/workflows/*.svg, and README.md still references the old path 7 times. 'bun run readme:audit' reports 5 dead of 20 checked and exits 1. NOT caused by the docs/folio-assistant move being wrong - the move is fine and the README simply did not come with it. Found while merging main into claude/wonderful-bohr-6kxh7b for bean 1hsf; deliberately not fixed there, because widening an AGENTS.md migration PR into a sibling's incomplete relocation is how both become hard to review. readme:audit is not a CI gate today, so nothing is red on main because of it - which is the reason it went unnoticed. Fix is a path rewrite in README.md plus a re-run of readme:audit; check first whether the sibling is still mid-move.

_2026-09-19T10:47:36Z_ — Already fixed by a sibling in 8628be64 ('Repoint eight dead README paths, and open t373 for why nothing caught them'), which arrived in the 13 commits merged at 10:46. Verified on this branch: README now references docs/folio-assistant/assets/img/workflows 7 times, 0 references to the old path, and 'bun run readme:audit' reports 20/20 resolved, 0 dead, exit 0. They also opened t373 for the gap I named — that readme:audit is not a CI gate, which is why nothing caught it. Nothing left here; resolving as done by a sibling rather than duplicating their work.
