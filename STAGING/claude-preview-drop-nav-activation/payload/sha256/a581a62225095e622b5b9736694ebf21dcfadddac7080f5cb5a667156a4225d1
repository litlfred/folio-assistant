---
name: dsa-dcat-record
description: >
  Write the W3C DCAT 3 `dcat:Resource` and `dcat:Distribution` catalogue record
  for a Data Sharing Agreement (`dcat:downloadURL`, `spdx:checksum`,
  `odrl:hasPolicy`) and link versions with `dcat:version` and
  `dcat:previousVersion` (DSA building block B3, process step P2.4–5
  `Task_Catalogue`).
---

# `dsa-dcat-record` — Write the DCAT 3 record and link versions (P2.4–5)

> Skill id: `dsa-dcat-record` · Package: `folio-document-adapter` · Process:
> `folio-assistant-core/processes/content/dsa-document-lifecycle.bpmn`
> (`Task_Catalogue`, P2.4–5) · Checker:
> `folio-assistant-core/scripts/check-dsa-hash.ts` (`bun run cat check:dsa-hash`)
> · Bean: `folio-assistant-2z1t`.

Whereas [`filing-dublin-core`](../../library/cataloguing/filing-dublin-core.md)
covers DCMI Metadata Terms on ingested library sources, a published Data
Sharing Agreement requires a **W3C DCAT 3** catalogue record describing the
agreement as a catalogued resource, its immutable legal text distribution and
SHA-256 checksum, its ODRL 2.2 policy link, and its version chain.

## Required vocabulary (existing specs only)

Every field in `dcat.jsonld` must come from **W3C DCAT 3** (including its
normative SPDX checksum terms in §6.8.12 and ADMS status terms in §6.4.30),
**W3C ODRL 2.2**, or **DCMI Metadata Terms**:

- **Resource (`@type: "dcat:Resource"`):**
  - `@id` — immutable version IRI (for example, `https://example.org/dsa/042/v2`).
  - `dcterms:title`, `dcterms:description`, `dcterms:issued` — bibliographic metadata.
  - `dcat:version` — version string (for example, `"1.0"`, `"2.0"`).
  - `dcat:previousVersion` — `{ "@id": "<prior-version-resource-id>" }` on every
    version after the first (DCAT 3 §6.4.25).
  - `adms:status` — life-cycle status IRI (DCAT 3 §6.4.30; see
    [`dsa-catalogue-status`](dsa-catalogue-status.md)).
  - `odrl:hasPolicy` — `{ "@id": "<odrl-agreement-uid>" }` when the version
    carries a computable ODRL 2.2 `Agreement`; that uid is this record's own
    `@id`, the fixed-version URL (see [`dsa-odrl-source`](dsa-odrl-source.md)).
  - `dcat:distribution` — array of `dcat:Distribution` nodes.
- **Distribution (`@type: "dcat:Distribution"`):**
  - `@id` and `dcat:downloadURL` — immutable URL of the signed legal text file
    cited by the ODRL Agreement's `dcterms:source` (see
    [`dsa-odrl-source`](dsa-odrl-source.md)).
  - `dcat:mediaType` — media type (for example, `"text/markdown"` or
    `"application/pdf"`).
  - `spdx:checksum` — SHA-256 checksum object (see
    [`dsa-checksum`](dsa-checksum.md)).

## Versioning rules

1. **New version, new URL, new hash:** amending or renewing an agreement with
   changed text creates a new version directory (for example, `v2/`) with a
   new `@id`, a new `dcat:version`, a new `dcat:downloadURL`, and a newly
   computed `spdx:checksumValue`.
2. **Explicit version chain:** the record of an amended version MUST carry
   `dcat:previousVersion` naming the fixed-version URL of the version it
   amends, that is, the prior version's `dcat:Resource` `@id` (`v2` points
   to `v1`). Consent processing walks this chain to carry older Consents
   across a narrowing amendment (https://github.com/litlfred/fhir-harness/pull/228), so a missing or wrong
   link fails `check:dsa-hash`.
3. **No custom properties:** `check:dsa-hash` rejects any property not defined
   in ODRL 2.2, DCAT 3, or DCMI Terms.
