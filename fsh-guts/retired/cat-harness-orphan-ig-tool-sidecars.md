---
$schema: folio-fsh-guts/v1
title: "kg-qa sidecars for three IG tools, orphaned in cat-harness when the tools moved to fhir-harness"
kind: orphaned-sidecar
movedOn: 2026-10-03
movedFrom: "cat-harness/test/results/kg-qa/tools/{ig-ast-jsonld,ig-binary-audit,ingest-ig-releases}.kg-qa.json"
issue: 1766
summary: >-
  Three kg-qa/v1 sidecars written by #1766 (last at 8c15ff3, a754acb and 6a57250) while the tools
  ig-ast-jsonld, ig-binary-audit and ingest-ig-releases were declared in
  cat-harness. main's placement work moved them to fhir-harness/tools, whose
  current sidecars are under fhir-harness/test/results/kg-qa/tools/. Merging
  main into #1766 left these three auditing a subject no report covers, which
  failed kg:audit:check. Owner, 2026-10-03: delete, to fsh-guts. Kept inside
  this manifest rather than as loose .json so no scanner mistakes them for
  live sidecars.
---

# Three orphaned IG-tool sidecars

Each file as it stood when removed (`c2d54678e40`), byte for byte; the commit
that last wrote it is named in its heading. Do not restore them: the live sidecars
are the same file names under `fhir-harness/test/results/kg-qa/tools/`.

## `ig-ast-jsonld.kg-qa.json` — last written at `8c15ff3`

```json
{
  "$schema": "kg-qa/v1",
  "subject": {
    "kind": "tool",
    "id": "ig-ast-jsonld",
    "path": null
  },
  "source_hash": "7a6731f1ffb5",
  "criteria": {
    "tool-invoke-path-resolves": {
      "result": "pass",
      "findings": []
    },
    "tool-satisfies-resolves": {
      "result": "pass",
      "findings": []
    },
    "tool-satisfies-contract-met": {
      "result": "pass",
      "findings": []
    },
    "tool-io-types-declared": {
      "result": "pass",
      "findings": []
    },
    "tool-args-shell-safe": {
      "result": "pass",
      "findings": []
    },
    "tool-alternative-selectable": {
      "result": "n/a",
      "findings": []
    },
    "tool-downstream-fresh": {
      "result": "n/a",
      "findings": []
    },
    "tool-maintains-in-tree": {
      "result": "n/a",
      "findings": []
    }
  },
  "totals": {
    "pass": 5,
    "fail": 0,
    "n/a": 3,
    "unknown": 0
  }
}
```

## `ig-binary-audit.kg-qa.json` — last written at `a754acb`

```json
{
  "$schema": "kg-qa/v1",
  "subject": {
    "kind": "tool",
    "id": "ig-binary-audit",
    "path": null
  },
  "source_hash": "e91b1ff99dce",
  "criteria": {
    "tool-invoke-path-resolves": {
      "result": "pass",
      "findings": []
    },
    "tool-satisfies-resolves": {
      "result": "pass",
      "findings": []
    },
    "tool-satisfies-contract-met": {
      "result": "pass",
      "findings": []
    },
    "tool-io-types-declared": {
      "result": "pass",
      "findings": []
    },
    "tool-args-shell-safe": {
      "result": "pass",
      "findings": []
    },
    "tool-alternative-selectable": {
      "result": "n/a",
      "findings": []
    },
    "tool-downstream-fresh": {
      "result": "n/a",
      "findings": []
    },
    "tool-maintains-in-tree": {
      "result": "n/a",
      "findings": []
    }
  },
  "totals": {
    "pass": 5,
    "fail": 0,
    "n/a": 3,
    "unknown": 0
  }
}
```

## `ingest-ig-releases.kg-qa.json` — last written at `6a57250`

```json
{
  "$schema": "kg-qa/v1",
  "subject": {
    "kind": "tool",
    "id": "ingest-ig-releases",
    "path": null
  },
  "source_hash": "cf69968b9ef4",
  "criteria": {
    "tool-invoke-path-resolves": {
      "result": "pass",
      "findings": []
    },
    "tool-satisfies-resolves": {
      "result": "pass",
      "findings": []
    },
    "tool-satisfies-contract-met": {
      "result": "pass",
      "findings": []
    },
    "tool-io-types-declared": {
      "result": "pass",
      "findings": []
    },
    "tool-args-shell-safe": {
      "result": "pass",
      "findings": []
    },
    "tool-alternative-selectable": {
      "result": "n/a",
      "findings": []
    },
    "tool-downstream-fresh": {
      "result": "n/a",
      "findings": []
    },
    "tool-maintains-in-tree": {
      "result": "n/a",
      "findings": []
    }
  },
  "totals": {
    "pass": 5,
    "fail": 0,
    "n/a": 3,
    "unknown": 0
  }
}
```
