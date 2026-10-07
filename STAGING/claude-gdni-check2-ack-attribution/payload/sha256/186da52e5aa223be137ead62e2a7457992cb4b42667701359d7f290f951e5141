---
# folio-assistant-7jkp
title: 'cat-openapi: two ingest tools — OpenAPI into the KG from SOURCE (a repo) or from RENDERED (a published spec/site); smart-trust''s example comes from WHO smart-trust-network-gateway'
status: todo
type: feature
priority: normal
created_at: 2026-10-04T18:50:39Z
updated_at: 2026-10-04T18:50:43Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-04, verbatim: *"note for openapi bean: source code for openapi in example for smart-trust is from here. should be bale to ingest either https://github.com/WorldHealthOrganization/smart-trust-network-gateway"* and *"(two different tools for openapi... ingest into KG from source or from rendered)"*.

## What this asks
- smart-trust's OpenAPI example has its source in WorldHealthOrganization/smart-trust-network-gateway.
- cat-openapi should ingest an OpenAPI spec into the KG by EITHER of two tools:
  1. **from source**: a repository (e.g. the gateway's spec files, or the code they are generated from);
  2. **from rendered**: an already-published spec or rendered documentation site.
- Two tools, not one tool with a mode: they read different inputs and can fail differently.

## Context
- The OpenAPI harness (bean s4ta, completed) gives the `openapi` graph kind (now `cat-openapi/kinds/openapi.json`, bean dmx1), its validator node (bean riit), and a rendering sub-pipeline.
- The owner's ruling on remote ingest (same day, lehh): *"you might not materialize an IG's semi-static KG - it could be remote. but you still want to ingest its ast into the folio"*. The same shape applies here: the source repository may stay remote while its parsed spec is ingested.

## Done when
- [ ] the owner confirms the two tools' names and inputs (Tool nodes in cat-openapi/tools/)
- [ ] ingest-from-source reads the gateway repository's spec into `openapi` nodes
- [ ] ingest-from-rendered reads a published spec or site into the same node shape
- [ ] smart-trust's example records which source it came from
