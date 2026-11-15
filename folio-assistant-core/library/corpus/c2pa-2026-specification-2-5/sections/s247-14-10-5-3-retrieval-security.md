---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s247-14-10-5-3-retrieval-security
section_title: "14.10.5.3. Retrieval Security"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3437-3446
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.10.5.3. Retrieval Security

A validator performing network retrieval under [Section 14.10.5.2, “Validation of External References”](#_validation_of_external_references) (or any other clause that references this section) may apply the countermeasures described in this section before and during each retrieval attempt, regardless of which assertion type initiated the retrieval.

Where network retrieval is performed on the validator’s behalf by a platform that the validator does not control, and the validator is therefore unable to apply one or more of the countermeasures described in this section, the validator may perform the retrieval through a component that can apply them, such as a server-side service operated for the validator, or may decline to perform the retrieval.

> **NOTE:**
> A validator that runs as a web page within a web browser is an example. Such a validator typically cannot observe the addresses to which a host name resolves, cannot enforce its own redirect limit on cross-origin redirects, and cannot prevent the browser from attaching browser-managed proxy credentials. Because retrieval of external data is optional, not performing the retrieval does not cause a claim to be rejected (see [Section 14.10.5, “External Data Validation”](#_external_data_validation)).

<a id="_permitted_schemes_and_identifiers"></a>
