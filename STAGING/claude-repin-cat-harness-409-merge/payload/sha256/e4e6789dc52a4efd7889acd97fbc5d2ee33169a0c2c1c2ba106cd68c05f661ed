---
# folio-assistant-kx6i
$schema: bean/1.0.0
title: 'PAPER SITE in the harness rendering (yj32): math, Lean links and notation macros, blocking qou''s legacy-render retirement'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T15:10:09Z
updated_at: 2026-10-21T21:32:00Z
parent: folio-assistant-yj32
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. qou cannot retire its legacy renderer until the harness-as-interface rendering handles a paper: KaTeX/MathJax with the folio's notation macros, block -> Lean declaration links, and the paper's block kinds.

## Owner ruling 2026-10-20 (from rehomed copy `cat-tools-og5t`): option 1, the declaration's source on GitHub

Asked in the drain coordinator's session (https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6): the owner chose **"GitHub source"**. A block's Lean declaration link goes to the declaration's line in its `.lean` file on GitHub, resolved from the block's `lean.ref` at the pinned commit. Built in `litlfred/cat-harness-tools#494` (`feat/og5t-lean-source-link`).

## Render check against qou in Chromium, 2026-10-21 (`cat-tools-og5t`)

- [x] Block → Lean declaration links resolved to GitHub source at the pinned commit (`cat-harness-tools#494`)
- [x] Paper block kinds render (`remark`, `proposition`, `example`, `definition`, `theorem`, `conjecture`, `corollary`, `lemma`, `diagram`, `simulator`, `prose`, `proof`, `table`, `algorithm` — viewer bugs fixed in `cat-harness-tools#527` and `#532`)
- [ ] Math typesetting verified in a browser with CDN access (`cdn.jsdelivr.net` KaTeX) and folio notation macros
- [ ] Lean badge rendering verified in browser (`.lb, .sb-badge`)
