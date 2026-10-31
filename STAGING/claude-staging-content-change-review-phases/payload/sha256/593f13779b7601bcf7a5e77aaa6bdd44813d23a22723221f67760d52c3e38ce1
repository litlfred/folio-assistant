---
name: dsa-catalogue-status
description: >
  Set the life-cycle status (`adms:status`, W3C DCAT 3 §6.4.30) on a Data
  Sharing Agreement's DCAT 3 catalogue record when the agreement is amended,
  renewed, terminated, or expires, while keeping all published versions
  readable at their immutable URLs (DSA building block B3, process step P14.5
  `Task_SetStatus`).
---

# `dsa-catalogue-status` — Set the catalogue status when an agreement changes or ends (P14.5)

> Skill id: `dsa-catalogue-status` · Package: `folio-document-adapter` ·
> Process: `folio-assistant-core/processes/content/dsa-document-lifecycle.bpmn`
> (`Task_SetStatus`, P14.5) · Checker:
> `folio-assistant-core/scripts/check-dsa-hash.ts` (`bun run cat check:dsa-hash`)
> · Bean: `folio-assistant-2z1t`.

When a Data Sharing Agreement is amended, renewed, terminated or expires (P14
in `dsa-document-lifecycle.bpmn`), its W3C DCAT 3 catalogue record must reflect
its life-cycle status without deleting or overwriting any previously published
version.

## Using W3C DCAT 3 §6.4.30 (`adms:status`)

W3C DCAT 3 §6.4.30 specifies `adms:status` (`http://www.w3.org/ns/adms#status`)
on `dcat:Resource` with the ADMS status vocabulary (`http://purl.org/adms/status/`):

- **In force / published release:**
  ```json
  "adms:status": { "@id": "http://purl.org/adms/status/Completed" }
  ```
- **Draft under negotiation or review:**
  ```json
  "adms:status": { "@id": "http://purl.org/adms/status/UnderDevelopment" }
  ```
- **Superseded by an amended version (`dcat:previousVersion` points here):**
  ```json
  "adms:status": { "@id": "http://purl.org/adms/status/Deprecated" }
  ```
- **Terminated or expired agreement (P14.5 `Task_SetStatus`):**
  ```json
  "adms:status": { "@id": "http://purl.org/adms/status/Withdrawn" }
  ```

## Preservation of immutable versions

1. **Never delete or alter the signed legal text of an ended version:** historical
   grants and audit logs continue to verify the SHA-256 digest of the version
   that was in force when a data access occurred.
2. **Update only the catalogue life-cycle status (`adms:status`)** (or publish
   the superseding version linked via `dcat:previousVersion`) and re-run
   `bun run cat check:dsa-hash` to confirm that every version's legal text
   digest and `dcterms:source` citation remain intact.
