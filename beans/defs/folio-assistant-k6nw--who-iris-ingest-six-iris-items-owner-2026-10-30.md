---
# folio-assistant-k6nw
$schema: bean/1.0.0
title: 'who-iris: ingest six IRIS items the owner listed on 2026-10-30 (NHWA / health workforce)'
status: in-progress
type: task
priority: high
created_at: 2026-10-30T22:52:00Z
updated_at: 2026-10-30T23:27:45Z
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
- [ ] Fetch each item: `bun run folio-assistant-core/scripts/fetch-dspace-item.ts <item URL> --out who-iris/uploads`. Record title, Handle, ISBN or WHO reference, collection, licence (`dc.rights`).
- [ ] Add `catalogue/nodes/item-<slug>.json` keyed `item/<uuid>` with `handle`, `provenance.upstream`, `metadataRef: catalogue/records/<slug>.dc.json`, `parents` from the breadcrumb, ORIGINAL bitstream `fixity` (bytes, sha256), state `materialized`.
- [ ] Write `uploads/<slug>/intake.json` (`folio-intake/v1`), as in the worked example.
- [ ] Ingest: `bun run cat ingest uploads/<slug>/<file>.pdf` so `library/<slug>/` gets structure.json, sections, manifest and `cover.png`.
- [ ] Run `bun run check:catalogue`, `dc:render`, `iris:covers` and `iris:pages` in who-iris.
- [ ] Open ONE PR on litlfred/who-iris that lists each item (number, title, Handle, slug). Do not merge without the owner's OK. Put the PR link in this bean's notes.

## Done when
All six items have a `materialized` catalogue node with a Handle and a `library/<slug>/` entry, in one open PR.

_2026-10-30T22:52Z (thread "Ingest six WHO IRIS documents", https://claude.ai/code/session_01Qmmkt7TqgcsB7jGEqHL5QA)_. Ready-to-paste agy prompt: project files `who-iris-ingest-2026-10-30/agy-prompt.md`.

_2026-10-30T23:27:45Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`) to materialize and ingest the six WHO IRIS items in `litlfred/who-iris` and open one PR (do not merge).
