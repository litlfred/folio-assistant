---
# folio-assistant-vj2p
title: 'Separation stage 1d: cat-harness is self-contained — each instance hosts its own outputs; prose cites code by repository'
status: todo
type: task
priority: normal
tags:
    - mvp
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-04T09:56:45Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-y9r6
    - folio-assistant-p9bu
---

Stage 1d of the split plan: `cat-harness` is self-contained.

- **Hosted outputs about higher instances (≈560 files)** — owner D3 (2026-10-01), **option 2**: each instance hosts the generated outputs about ITSELF (`<instance>/uml/`, `<instance>/docs/`), not the checkout root. Main sets: `uml/overview/<instance>` 188, `docs/uml/overview` 94, `docs/assets/img/uml/*` ≈211, `docs/cat-harness/{catalogue,library,voices}/<instance>` 27. The ≈10 generator targets learn a per-instance output root.
- **Authored prose** naming code paths (skills 438 mentions, processes 11, scenarios 9, docs ≈250; 23 code links, 38 outbound links) → repository-qualified references (`litlfred/cat-harness-tools:scripts/x.ts`) or URLs.
- **Blocker 2**: `scripts/tests/remote-packages-honest-docs.test.ts` reads `../fsh-guts/…` — move to a root-level test or report "could not determine" when absent.

Waits on placement PR9 too: the harness docs pages about moved processes are upward references until they follow their subject. Related: `iwtn` (the same problem for bootstrap).

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] a link audit over `cat-harness/` alone reports 0 links leaving the directory, except declared cross-repository URLs
- [ ] no `uml/overview/<higher instance>` or `docs/cat-harness/*/<higher instance>` path remains under `cat-harness/`; each instance's generated outputs live in its own directory and `uml:overview:check` is green
- [ ] `readme:audit`, `check:stale-paths`, `kg:audit:check`, `docs:harness:check` green
