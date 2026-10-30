---
# folio-assistant-5bkm
$schema: bean/1.0.0
title: 'who-iris: look up IRIS UUIDs, handles, records and PDFs for the 11 items moved from smart-base'
status: completed
type: task
priority: high
created_at: 2026-10-30T17:45:00Z
updated_at: 2026-10-30T21:24:00Z
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
- [x] For each item, find the IRIS item (UUID and Handle). Fetch it with `bun run folio-assistant-core/scripts/fetch-dspace-item.ts <handle URL> --out who-iris/uploads`.
- [x] Check that the PDF's sha256 equals the one in the node's ORIGINAL bitstream `fixity`. If it differs, record both and do not overwrite.
- [x] Re-key each node: `id: item/<uuid>`, `handle`, `provenance.upstream`, `metadataRef: catalogue/records/<slug>.dc.json`, and `parents` from the breadcrumb. Keep `libraryId` and the filename slug.
- [x] For an annex or supplement that is a bitstream of 10665/250796, merge it into that item's node as a bitstream, not a separate item.
- [x] Run `bun run check:catalogue`, `dc:render` and `iris:pages` in who-iris, then open a PR that references #107.

## Done when
No who-iris node is keyed `item/isbn:` or `item/govdoc:`, and every node has a Handle.

_2026-10-30T19:45Z (thread "Drain ingest beans", https://claude.ai/code/session_01Qmmkt7JwQ9cqR2roBLdqKQ)_. iris.who.int re-probed: still refused here. Ready-to-paste agy prompt: project files `ingest-drain-2026-10-30/agy-prompts.md` §1.

_2026-10-30T20:13:30Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-30T21:24:00Z_ — Completed and merged in [litlfred/who-iris#131](https://github.com/litlfred/who-iris/pull/131):
- Looked up all 11 items via `iris.who.int` and fetched their Dublin Core records and bitstreams via `fetch-dspace-item.ts`.
- Verified that all 11 PDFs match the recorded byte count and `sha256` fixity digest 100%:
  - `item-9789240010567-eng.json`: `item/1dc5ea7b-7de5-4814-876c-1ee302538f84`, Handle `10665/334306`, `collection/hq-publications` (`10665/26724`), `9789240010567-eng.pdf` (`4,500,531` B, sha256 `a4804f85ebb5c223f8e25442b4fa7b8bbbf6536ff1f8c281460423a764589157`).
  - `item-9789240081949-eng.json`: `item/08c17880-005f-41a2-87f0-14f2bc1761bb`, Handle `10665/373581`, `collection/hq-publications` (`10665/26724`), `9789240081949-eng.pdf` (`1,611,431` B, sha256 `af6fd10ed03d5ee370499eb555d769d287e64f0f935dc9f0ea63f3af973e060a`).
  - `item-9789240093362-eng.json`: `item/32a98265-3e71-42fa-afdc-e7f62cc2622c`, Handle `10665/379452`, `collection/hq-publications` (`10665/26724`), `9789240093362-eng.pdf` (`2,787,054` B, sha256 `0d47d98390b1451d01fafd27b017a6edcccf6effda4830d531b685b4cc85114a`).
  - `item-9789240101197-eng.json`: `item/ceaeb260-196c-4589-9b19-f3ec436819e6`, Handle `10665/379506`, `collection/hq-publications` (`10665/26724`), `9789240101197-eng.pdf` (`2,111,579` B, sha256 `cd157b40eef513c13129ea10b286db75a7fbcda405716a44cc06775f75aa9ad2`).
  - `item-9789240116191-eng.json`: `item/fd2019bb-dd79-4c1f-ac5d-9b5fadf35383`, Handle `10665/383309`, `collection/hq-publications` (`10665/26724`), `9789240116191-eng.pdf` (`1,365,113` B, sha256 `9cc9ca42d30db9ebef25509f05cfbd69fcb51bc86f9add653aa54f2a94a1a021`).
  - `item-9789240120747-eng.json`: `item/187cabc7-3e82-412e-8cbb-1502a9da36ad`, Handle `10665/386358`, `collection/hq-publications` (`10665/26724`), `9789240120747-eng.pdf` (`1,585,035` B, sha256 `c710f7cf4a432221b30d7db9272f10e17250c59b14ed33c5405e86695b2edec8`).
  - `item-9789241509510-eng.json`: `item/1469660e-9540-46b6-9401-510f4e4b8a35`, Handle `10665/185238`, `collection/hq-publications` (`10665/26724`), `9789241509510_eng.pdf` (`3,337,054` B, sha256 `26aa12fbae4eafb2982a6e19efa9bb692adb4aa5bf74274c609f1a9c61852b11`).
  - `item-9789241511766-eng.json`: `item/53de8b1c-5a9a-40b7-8a48-9d1717de4cb7`, Handle `10665/252183`, `collection/hq-publications` (`10665/26724`), `9789241511766-eng.pdf` (`3,428,746` B, sha256 `934bdf1193c16ee539a90dd4a8c3e98e004b4a01680902b3401b5acf829a52c5`).
  - `item-9789241549912-webannexes-eng.json` and `item-9789241549912-websupplement-eng.json`: merged into `item-9789241549912-eng.json` (`item/9a90617b-f771-4d4d-a538-a51f87c51685`, Handle `10665/250796`) as `ORIGINAL` bitstreams (`9789241549912-webannexes-eng.pdf`, `229,714` B, sha256 `2be50b7493beb2bcced1f533aabc11123d40931381a6b449a6ecacc60deb2a0a`; `9789241549912-websupplement-eng.pdf`, `7,281,711` B, sha256 `e7b751d90bc6b0ea4aed09718de979dea272241c89300082454c39a0ee73908c`).
  - `item-who-rhr-1806-eng.json`: `item/98c528f1-48f0-4803-9a11-c83cd2e52c17`, Handle `10665/260480`, `collection/43c3b8d5-432d-4e1b-a5bf-3cc6129d7266` (`10665/26723`, Technical Documents), `WHO-RHR-18.06-eng.pdf` (`403,774` B, sha256 `44be3640bb1730da309256d74090968e757bb10371b4367e97b75248c49998e6`).
