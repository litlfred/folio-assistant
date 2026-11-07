---
name: iris-rest-feed
description: >
  How to read changes from the WHO IRIS DSpace 7 REST API: the nightly
  "changed since" walk over Discovery, the weekly reconciliation that stands in
  for the deletions REST does not report, and the guard that stops a short
  listing from reading as a mass withdrawal.
graph-typologies:
  - catalogue
---

# Reading IRIS changes over DSpace REST

Changes are read from the **DSpace REST API only**. REST has no change feed
with deletions, so a nightly walk is paired with a weekly reconciliation. The
code is `scripts/iris-cdn/rest-feed.ts`; its tests run on fixtures in
`scripts/tests/iris-cdn.test.ts`.

## What live IRIS accepts

- Discovery offers only five `sortOptions`: `score`, `dc.title`,
  `dc.date.issued`, `dc.date.accessioned`, `dc.date.available`.
  `sort=lastModified,DESC` returns **HTTP 422**.
- Changes are found with a Solr range query instead:
  `query=lastModified:[<isoZ> TO *]`.
- The bound must be a `Z`-suffixed UTC timestamp. A `+00:00` offset returns
  `totalElements: 0`.

## Endpoints

| Use | Request |
|---|---|
| Changed items since cursor | `GET /server/api/discover/search/objects?dsoType=ITEM&query=lastModified:[{isoZ} TO *]&sort=dc.date.accessioned,DESC&page=N&size=100` |
| Weekly full item listing | `GET /server/api/discover/search/objects?dsoType=ITEM&sort=dc.date.accessioned,DESC&page=N&size=100` |
| Collection-scoped batch (initial load) | `GET /server/api/discover/search/objects?dsoType=ITEM&scope={collectionUuid}&sort=dc.date.accessioned,DESC&page=N&size=100` |
| Communities / collections with parent | `GET /server/api/core/{communities|collections}?page=N&size=100&embed=parentCommunity` |
| One item with its files and collection | `GET /server/api/core/items/{uuid}?embed=bundles/bitstreams&embed=owningCollection` |
| Bundle bitstreams beyond page 0 | `GET /server/api/core/bundles/{bundleUuid}/bitstreams?page=N&size=100` |
| A file's bytes | `GET /server/api/core/bitstreams/{uuid}/content` |

## Nightly: `changedSince(cursor)`

1. Normalise `cursor` to UTC `Z` (`new Date(Date.parse(cursor)).toISOString()`)
   and run the range query above.
2. Page through the matching result set.
3. The cursor is **inclusive**: an item modified at that instant is read again,
   not missed. Re-reading an unchanged item writes the same bytes.
4. Return the items oldest first, de-duplicated by UUID.

The cursor is the newest `lastModified` read, kept in `state/cursor.json`. A
failed night does not advance it.

## Metadata changes without the PDF changing

A PDF may stay the same while its Dublin Core changes. Records and files are
handled separately:

- A record is re-read whenever its item appears in the walk. A PDF is
  re-fetched only if its DSpace MD5 changed.
- **Communities and collections** are re-read in full every night
  (`allContainers`). A renamed collection changes no item, and DSpace 7 does
  not expose `lastModified` for these. An unchanged one serializes to the same
  bytes.
- **The weekly metadata check.** The weekly listing pages carry each item's
  metadata. `metadataSha` hashes it canonically, and any item whose hash
  differs from the one last ingested is re-read. That catches edits that did
  not move `lastModified`, without one fetch per item.

## Weekly: `allItems` and `withdrawnOrHidden`

1. List every item ID Discovery returns.
2. Compare that list with the IDs the library holds.
3. **Guard.** If more than 1% of held items are missing, the listing is
   treated as faulty and nothing is marked. Possible causes are a paging fault,
   an outage or a Solr reindex.
4. Re-fetch each missing item by ID. Mark it withdrawn only if IRIS confirms
   it: `withdrawn: true`, or a 404 (gone), 401 or 403 (private).

## Fixity

DSpace reports an MD5 `checkSum` for each bitstream. Downloaded bytes must match
it before their SHA-256 is recorded. A mismatch quarantines the bitstream and
reports it. It is never retried silently.

## Politeness

Requests are made one at a time, with a User-Agent that names the project and
its repository, and back off on 429 and 503. The initial load is paced to the budget stated in
`Task_StateBudget` (`processes/iris-cdn-initial-load.bpmn`), including
`maxRequestsPerSecond`.
