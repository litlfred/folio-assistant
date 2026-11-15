---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s661-a-10-1-general
section_title: "A.10.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12533-12545
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.10.1. General

The Web ARChive (WARC) format ([ISO 28500:2017](https://www.iso.org/standard/68004.html)) is used by national libraries, legal deposit systems, and digital preservation institutions to archive web content. A WARC file is a sequential concatenation of records, each containing a captured resource (such as an HTTP response) along with metadata about the capture. The format supports incremental appending of new records.

> **NOTE:**
> This section applies to WARC 1.1 files as defined by [ISO 28500:2017](https://www.iso.org/standard/68004.html). WARC 1.0 files use the same record structure and the procedures in this section may be applied to them; however, WARC 1.0 is not a normative reference of this specification.

This section defines how to embed a C2PA Manifest Store in a WARC file (media type `application/warc`), providing content provenance for archived web resources.

> **NOTE:**
> This mechanism provides in-band provenance and complements, rather than replaces, the external fixity and preservation-metadata practices used with WARC files. It shares with WACZ signing the model of signed integrity anchored to an external identity, but differs in construction: a single claim signature over the C2PA Manifest Store, covering a collection data hash assertion with a per-record hash for every record, verified against a trust list here, versus a single ECDSA signature over the package-level `datapackage.json` in WACZ. PREMIS and BagIt, by contrast, record unsigned checksums as external metadata.

<a id="warc_placement"></a>
