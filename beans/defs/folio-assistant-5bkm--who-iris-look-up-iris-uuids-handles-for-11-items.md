---
# folio-assistant-5bkm
$schema: bean/1.0.0
title: 'who-iris: look up IRIS UUIDs, handles, records and PDFs for the 11 items moved from smart-base'
status: todo
type: task
priority: high
created_at: 2026-10-30T17:45:00Z
updated_at: 2026-10-30T17:45:00Z
---

For agy, because iris.who.int is blocked from the cloud sandbox. Part of litlfred/who-iris#107 and #108. The owner asked on 2026-10-30 for agy to retrieve these.

On 2026-10-30, 11 IRIS publications moved from smart-base into who-iris. None of them recorded a DSpace UUID, Handle, collection or Dublin Core record, so their catalogue nodes are keyed by ISBN or govdoc number:

| who-iris node file | id now | who.int page |
|---|---|---|
| catalogue/nodes/item-9789240010567-eng.json | item/isbn:9789240010567 | https://www.who.int/publications/i/item/9789240010567 |
| catalogue/nodes/item-9789240081949-eng.json | item/isbn:9789240081949 | https://www.who.int/publications/i/item/9789240081949 (likely IRIS item 08c17880-005f-41a2-87f0-14f2bc1761bb; unconfirmed) |
| catalogue/nodes/item-9789240093362-eng.json | item/isbn:9789240093362 | https://www.who.int/publications/i/item/9789240093362 |
| catalogue/nodes/item-9789240101197-eng.json | item/isbn:9789240101197 | https://www.who.int/publications/i/item/9789240101197 |
| catalogue/nodes/item-9789240116191-eng.json | item/isbn:9789240116191 | https://www.who.int/publications/i/item/9789240116191 |
| catalogue/nodes/item-9789240120747-eng.json | item/isbn:9789240120747 | https://www.who.int/publications/i/item/9789240120747 |
| catalogue/nodes/item-9789241509510-eng.json | item/isbn:9789241509510 | https://www.who.int/publications/i/item/9789241509510 |
| catalogue/nodes/item-9789241511766-eng.json | item/isbn:9789241511766 | https://www.who.int/publications/i/item/9789241511766 |
| catalogue/nodes/item-9789241549912-webannexes-eng.json | item/isbn:9789241549912:webannexes | ANC 2016 web annexes (may be a bitstream of IRIS item 9a90617b-f771-4d4d-a538-a51f87c51685, 10665/250796) |
| catalogue/nodes/item-9789241549912-websupplement-eng.json | item/isbn:9789241549912:websupplement | ANC 2016 web supplement (same question) |
| catalogue/nodes/item-who-rhr-1806-eng.json | item/govdoc:WHO-RHR-18.06 | https://www.who.int/publications/i/item/WHO-RHR-18.06 |

## Do
- [ ] For each item, find the IRIS item (UUID and Handle). Fetch it with `bun run folio-assistant-core/scripts/fetch-dspace-item.ts <handle URL> --out who-iris/uploads`.
- [ ] Check that the PDF's sha256 equals the one in the node's ORIGINAL bitstream `fixity`. If it differs, record both and do not overwrite.
- [ ] Re-key each node: `id: item/<uuid>`, `handle`, `provenance.upstream`, `metadataRef: catalogue/records/<slug>.dc.json`, and `parents` from the breadcrumb. Keep `libraryId` and the filename slug.
- [ ] For an annex or supplement that is a bitstream of 10665/250796, merge it into that item's node as a bitstream, not a separate item.
- [ ] Run `bun run check:catalogue`, `dc:render` and `iris:pages` in who-iris, then open a PR that references #107.

## Done when
No who-iris node is keyed `item/isbn:` or `item/govdoc:`, and every node has a Handle.

_2026-10-30T19:45Z (thread "Drain ingest beans", https://claude.ai/code/session_01Qmmkt7JwQ9cqR2roBLdqKQ)_. iris.who.int re-probed: still refused here. Ready-to-paste agy prompt: project files `ingest-drain-2026-10-30/agy-prompts.md` §1.
