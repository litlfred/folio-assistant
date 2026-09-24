---
# folio-assistant-cw35
title: 'GATES DECIDE PUBLICATION: a held bitstream whose copyright or restrictions gate is not permitted is not redistributed'
status: in-progress
type: task
priority: high
created_at: 2026-09-24T18:01:44Z
updated_at: 2026-09-24T18:01:44Z
parent: folio-assistant-kupb
---

From the `v048` roast, objections 3 + 4. The owner placed this under `kupb` on 2026-09-24, knowing it keeps GOAL 3 open.

**Measured:** every held bitstream carries `copyright: unknown` and `restrictions: unknown`, yet the public who-iris pages link the PDFs via raw.githubusercontent and jsDelivr. `gen-iris-pages.ts` reads gates only to COUNT them (l.1062). `refusedGates` / `unansweredGates` (`folio-assistant-core/schemas/materialization.ts`) are called only from `remote-content.test.ts`. `materialize-remote.bpmn:45` says "`unknown` on any single gate is enough to keep the node `referenced`", yet all 3 items are `materialized`.

## Done when
- [x] the page generator links a held bitstream only when its copyright and restrictions gates are `permitted`; otherwise it shows the item as referenced, and says why
- [x] a check fails when a node is `materialized` with any gate `unknown` or `refused` (the process's own rule, now enforced) — **as built: fails on an UNANSWERED publication gate; a `refused` one on a held copy is listed by name, not failed**, because the owner chose to keep those bytes (see below)
- [x] the three items' gates are answered from the source (the WHO licence on each record), or the items revert to `referenced`; whichever, it is a decision with its evidence, not a default
- [ ] **the site stops SERVING what it no longer links.** `mount-instance-docs.ts:974` copies `who-iris/library/` wholesale, so the two refused items' cover PNGs, extracted section text and images stay reachable BY URL. That is bean `2b5s`'s open question to the owner — *"Should a mount copy a directory wholesale?"* — and is not decided here.

## Work log — 2026-09-24

**The owner's ruling (option 1 of four):** record each gate as the publication's own copyright page states it.

| item | copyright page says | copyright / restrictions |
|---|---|---|
| `wpr-rdo-2020-003-eng` | "© WHO 2020. Some rights reserved. … CC BY-NC-SA 3.0 IGO licence" | **permitted** / **permitted** (the licence's own conditions) |
| `9789241548960-eng` | "© WHO 2014. All rights reserved. … Requests for permission to reproduce … should be addressed to WHO Press" | **refused** / **refused** |
| `who-pub-tps-931` | "… Universal Copyright Convention. All rights reserved." | **refused** / **refused** |

Each verdict quotes its page and line, and carries `decidedAt` / `decidedBy`. The bytes stay in git (the owner's option 1). Removing them was offered as a separate, destructive step and not taken.

**Mechanism.**
- `publicationBlockers(gates)` (`folio-assistant-core/schemas/materialization.ts`) decides: only `copyright` and `restrictions` count, and anything short of `permitted` blocks.
- `gen-iris-pages.ts` routes every download link through one function, `linkOrWithheld`, and gates covers the same way, with a third state *"cover withheld"* alongside *"no cover"*.
- `check:catalogue` fails on an unanswered publication gate and lists held-but-refused copies by name.

**Measured after regeneration** (`who-iris/library/*.html`):
- the refused PDFs and covers have **0** `href` / `src`;
- the permitted PDF keeps **8** links;
- 8 *"held here, not published"* notes.

**Falsified both ways:**
- one gate set back to `unknown` makes `check:catalogue` exit 1;
- a generator that ignores the gates makes the new page test fail with *"9789241548960_eng.pdf is not publishable but is linked from 4 page(s)"*.
