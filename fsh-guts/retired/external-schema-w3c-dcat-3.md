---
$schema: folio-fsh-guts/v1
title: "The w3c-dcat-3 external-schema record: cited ahead of use, retired when records began to need a user"
kind: retired-external-schema
movedOn: 2026-09-24
movedFrom: "cat-harness/external-schemas/w3c-dcat-3.json"
bean: folio-assistant-4sim
summary: >-
  Added on the owner's 4sim ruling, "Reference only", to pin the DCAT 3 edition ahead of any use. Main's #1168 B6a then made each file that uses a spec declare it (conformsTo), and added a test that every record has such a user. Nothing conforms to DCAT, so no file can honestly declare it, and the record would read as a spec nothing depends on, which it is. The chosen edition is kept on bean 4sim. Re-add this record when something emits a DCAT term.
---

# The record, as it was

```json
{
  "$schema": "folio-external-schema/v1",
  "id": "w3c-dcat-3",
  "authority": "W3C",
  "title": "Data Catalog Vocabulary (DCAT) - Version 3",
  "version": "2024-08-22",
  "specUrl": "https://www.w3.org/TR/2024/REC-vocab-dcat-3-20240822/",
  "namespaces": [
    "http://www.w3.org/ns/dcat#"
  ],
  "use": "cites",
  "terms": [],
  "note": "REFERENCE ONLY — owner, 2026-09-23, on bean 4sim: 'Reference only'. Pinned so that the day a glossary or terminology RELEASE is described (a dcat:Dataset per published graph document, a dcat:Distribution per serialisation), the edition is already chosen and named, not guessed. Nothing in this repository emits a DCAT term today, so there are no operative terms. DCAT is also one more TARGET vocabulary for the ETL Tools of bean k74z."
}
```
