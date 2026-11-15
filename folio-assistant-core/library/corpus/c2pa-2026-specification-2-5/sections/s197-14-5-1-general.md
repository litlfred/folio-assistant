---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s197-14-5-1-general
section_title: "14.5.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2623-2632
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.5.1. General

The last C2PA Manifest superbox in the C2PA Manifest Store superbox shall be considered the active manifest, but locating the C2PA Manifest Store may involve looking in a number of possible locations.

Locating the C2PA Manifest Store is a prerequisite to validation and is not itself associated with a validation status code. If no C2PA Manifest Store can be located by the methods described below, the asset shall be treated as if no manifests were located. Where an embedding method admits only a single C2PA Manifest Store within a given location, more than one in that location shall likewise be treated as if no manifests were located. The per-format considerations that follow apply these rules to specific embedding methods.

> **NOTE:**
> An implementation may provide additional information about why no manifests were located, such as the presence of more than one C2PA Manifest Store. How that information is surfaced is out of scope for this specification.

<a id="_embedded_2"></a>
