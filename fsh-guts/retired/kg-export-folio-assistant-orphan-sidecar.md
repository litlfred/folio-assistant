---
$schema: folio-fsh-guts/v1
title: "kg-export sidecar for @litlfred/folio-assistant — an orphan no producer writes"
kind: orphaned-sidecar
movedOn: 2026-09-30
movedFrom: "cat-harness/test/results/kg-export.@litlfred/folio-assistant.qa-results.json"
bean: folio-assistant-y7b3
summary: >-
  A qa-results/v1 sidecar last written at commit 9b6e540d9 (2026-09-23), by the
  pre-split producer path scripts/kg-export.ts. The exporter now names the host
  instance's sidecar plain "kg-export" (kg-export.ts, qaStem), so nothing has
  written this file since and nothing reads it. Found while removing
  updated_at from every produced sidecar (#1714, #1707): it was the only one
  left carrying a stamp. Owner, 2026-09-30: "ok move to fsh-guts". Kept inside
  this manifest rather than as a loose .json so no scanner mistakes it for a
  live sidecar.
---

# The orphaned `kg-export.@litlfred/folio-assistant` sidecar

The file as it stood at `9b6e540d9`. Do not restore it: the live sidecar for
the host instance is `cat-harness/test/results/kg-export.qa-results.json`.

```json
{
  "$schema": "qa-results/v1",
  "producer": {
    "script": "scripts/kg-export.ts",
    "script_hash": "c88d684ce169"
  },
  "subject": {
    "kind": "graph",
    "id": "@litlfred/folio-assistant.jsonld"
  },
  "updated_at": "2026-09-21T18:21:29.282Z",
  "families": {
    "danglingLinks": {
      "summary": "Internal links whose target node is not in `@graph`. A DATA defect, not an export failure.",
      "count": 0,
      "entries": []
    },
    "problems": {
      "summary": "Sources that could not be read. Never empty-by-omission.",
      "count": 0,
      "entries": []
    },
    "undeclaredSchemaModules": {
      "summary": "Modules in the declared schemas/ directory that do not say what they are, so they are absent from the graph.",
      "count": 0,
      "entries": []
    },
    "undeclaredTerms": {
      "summary": "Property names used in `@graph` that the `@context` does not declare. Dropped outright by a JSON-LD processor.",
      "count": 0,
      "entries": []
    }
  },
  "total": 0
}
```
