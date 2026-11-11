---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s412-16-4-2-2-process-evidence
section_title: "16.4.2.2. Process Evidence"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7566-7588
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.2.2. Process Evidence

The hashed variant of an external reference assertion may be used to reference externally-stored creation-process evidence. The `data_types` field on the `hashed-ext-uri-map` location identifies the kind of evidence using an `asset-type-map`. The following pre-defined values are available:

`c2pa.types.audit-log`

A structured log of creation-phase events collected by a local or remote observer during the creation process.

> **NOTE:**
> All aspects of the log are implementation dependent.

`c2pa.types.version-history`

A record of revisions to the asset over time, such as a signed commit history from a version control system.

> **NOTE:**
> All aspects of the version history record are implementation dependent.

Entity-specific evidence types shall conform to the same syntax as [entity-specific namespaces](#_namespacing).

When applicable, `processStart` and `processEnd` in the assertion’s `metadata` describe the process as specified in [process time](#_process_time).

<a id="_schema_and_example_10"></a>
