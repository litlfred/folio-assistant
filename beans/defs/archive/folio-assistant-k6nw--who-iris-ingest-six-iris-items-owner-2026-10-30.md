---
# folio-assistant-k6nw
$schema: bean/1.0.0
title: 'who-iris: ingest six IRIS items the owner listed on 2026-10-30 (NHWA / health workforce)'
status: completed
type: task
priority: high
created_at: 2026-10-30T22:52:00Z
updated_at: 2026-10-31T00:29:00Z
---

For agy, because iris.who.int is blocked from the cloud sandbox (re-probed 2026-10-30T22:50Z: proxy refuses the connection; WebFetch fails too). The owner asked on 2026-10-30T22:48Z to ingest these six items into the litlfred/who-iris KG `library/`. Work in litlfred/who-iris only (a litlfred repo, not WHO's).

The HWR / National Health Workforce Accounts (NHWA) thread needs these, especially the NHWA handbook and guidance, to propose changes to the smart-ra DPI-H archimate view. So say in the PR which item is which.

| # | IRIS item |
|---|---|
| 1 | https://iris.who.int/items/9de774be-825d-4d81-8518-f87a64b58ea0 |
| 2 | https://iris.who.int/items/81b0f40b-5dbc-491d-a2ac-b63c7f3f9f27 |
| 3 | https://iris.who.int/items/c9312a35-1eeb-46be-8482-a5fd2a94ddb9 |
| 4 | https://iris.who.int/items/dc583bce-4e95-4e27-9b2e-7b98bbe8a144 |
| 5 | https://iris.who.int/items/c8db7b21-da29-4432-a6d7-61ffe3b2c1c1 |
| 6 | https://iris.who.int/items/bb4009bc-943c-4116-88e3-fe4f6cf1a400 |

None of the six UUIDs appears anywhere in who-iris main (checked 2026-10-30T22:50Z).

Process: cat-harness `library-ingestion` (materialize entry: `materialize-remote.bpmn`, then `Process_Ingestion`). Worked examples of a finished entry: `library/9789240093362-eng/` with `uploads/9789240093362-eng/intake.json`, and bean 5bkm / who-iris#131 for the catalogue keying.

## Do
- [x] Fetch each item: `bun run folio-assistant-core/scripts/fetch-dspace-item.ts <item URL> --out who-iris/uploads`. Record title, Handle, ISBN or WHO reference, collection, licence (`dc.rights`).
- [x] Add `catalogue/nodes/item-<slug>.json` keyed `item/<uuid>` with `handle`, `provenance.upstream`, `metadataRef: catalogue/records/<slug>.dc.json`, `parents` from the breadcrumb, ORIGINAL bitstream `fixity` (bytes, sha256), state `materialized`.
- [x] Write `uploads/<slug>/intake.json` (`folio-intake/v1`), as in the worked example.
- [x] Ingest: `bun run cat ingest uploads/<slug>/<file>.pdf` so `library/<slug>/` gets structure.json, sections, manifest and `cover.png`.
- [x] Run `bun run check:catalogue`, `dc:render`, `iris:covers` and `iris:pages` in who-iris.
- [x] Open ONE PR on litlfred/who-iris that lists each item (number, title, Handle, slug). Do not merge without the owner's OK. Put the PR link in this bean's notes.

## Done when
All six items have a `materialized` catalogue node with a Handle and a `library/<slug>/` entry, in one open PR.

_2026-10-30T22:52Z (thread "Ingest six WHO IRIS documents", https://claude.ai/code/session_01Qmmkt7TqgcsB7jGEqHL5QA)_. Ready-to-paste agy prompt: project files `who-iris-ingest-2026-10-30/agy-prompt.md`.

_2026-10-30T23:27:45Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`) to materialize and ingest the six WHO IRIS items in `litlfred/who-iris` and open one PR (do not merge).

_2026-10-31T00:08:00Z_ — All six WHO IRIS items materialized and ingested (L1-complete with 6-locale image narratives and vector figure inspections) in `litlfred/who-iris`, with ONE open PR awaiting owner review (not merged): https://github.com/litlfred/who-iris/pull/134 (`litlfred/who-iris#134`).

| # | IRIS UUID | Handle | Title | ISBN / WHO ref | Collection | Slug (`library/<slug>/`) |
|---|---|---|---|---|---|---|
| 1 | `9de774be-825d-4d81-8518-f87a64b58ea0` | `10665/205544` | *National health accounts* | `SEA-HSD-290` | `6. Regional Office for South-East Asia > Regional Publications > Technical Documents` (`collection/29e98ea0-6645-4b2d-ae90-3cb8769881b6`) | `b0426` |
| 2 | `81b0f40b-5dbc-491d-a2ac-b63c7f3f9f27` | `10665/275758` | *Understanding national health workforce accounts* | `WHO/HIS/HWF/NHWA/2017.1` | `1. Headquarters > Technical Documents` (`collection/43c3b8d5-432d-4e1b-a5bf-3cc6129d7266`) | `who-his-hwf-nhwa-20171-eng` |
| 3 | `c9312a35-1eeb-46be-8482-a5fd2a94ddb9` | `10665/374320` | *National health workforce accounts: a handbook* (2nd ed., 2023) | ISBN `9789240081291` (electronic), `9789240081307` (print) | `1. Headquarters > Publications` (`collection/hq-publications`) | `9789240081291-eng` |
| 4 | `dc583bce-4e95-4e27-9b2e-7b98bbe8a144` | `10665/275473` | *National health workforce accounts: implementation guide* (2018) | ISBN `9789241514446` | `1. Headquarters > Publications` (`collection/hq-publications`) | `9789241514446-eng` |
| 5 | `c8db7b21-da29-4432-a6d7-61ffe3b2c1c1` | `10665/259360` | *National health workforce accounts: a handbook* (1st ed., 2017) | ISBN `9789241513111` | `1. Headquarters > Publications` (`collection/hq-publications`) | `9789241513111-eng` |
| 6 | `bb4009bc-943c-4116-88e3-fe4f6cf1a400` | `10665/386519` | *National health workforce accounts: health workforce levels and trends 2026* | ISBN `9789240122925` (electronic), `9789240122932` (print) | `1. Headquarters > Publications` (`collection/hq-publications`) | `9789240122925-eng` |

_2026-10-31T00:29Z_ — who-iris#134 merged (54806ed) on the owner's card "A. Merge now".
