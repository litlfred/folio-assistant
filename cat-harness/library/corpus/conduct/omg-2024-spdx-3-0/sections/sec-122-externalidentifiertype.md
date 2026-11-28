---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-122-externalidentifiertype
section_title: "ExternalIdentifierType"
section_number: null
pages: 60-61
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies the type of an external identifier.
Description
ExternalIdentifierType specifies the type of an external identifier.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/ExternalIdentifierType
Name:
ExternalIdentifierType
48
System Package Data Exchange (SPDX©) v3.0
Entries
cpe22 Common Platform Enumeration Specification 2.23
cpe23 Common Platform Enumeration: Naming Specification Version 2.34
cve Common Vulnerabilities and Exposures identifiers, an identifier for a specific software flaw defined within the official CVE
Dictionary and that conforms to the CVE specification5.
email Email address, as defined in RFC 36966 Section 3.
gitoid Gitoid7, stands for Git Object ID8. A gitoid of type blob is a unique hash of a binary artifact. A gitoid may represent either
an Artifact Identifier9 for the software artifact or an Input Manifest Identifier10 for the software artifact’s associated Artifact
Input Manifest11; this ambiguity exists because the Artifact Input Manifest is itself an artifact, and the gitoid of that artifact
is its valid identifier. Gitoids calculated on software artifacts (Snippet, File, or Package Elements) should be recorded in the
SPDX 3.0 SoftwareArtifact’s contentIdentifier property. Gitoids calculated on the Artifact Input Manifest (Input Manifest
Identifier) should be recorded in the SPDX 3.0 Element’s externalIdentifier property. See OmniBOR Specification12, a
minimalistic specification for describing software Artifact Dependency Graphs13.
other Used when the type does not match any of the other options.
packageUrl Package URL, as defined in the corresponding Annex14 of this specification.
securityOther Used when there is a security related identifier of unspecified type.
swhid SoftWare Hash IDentifier, a persistent intrinsic identifier for digital artifacts, such as files, trees (also known as directories or
folders), commits, and other objects typically found in version control systems. The format of the identifiers is defined in the
SWHID specification15 (ISO/IEC DIS 18670). They typically look like swh:1:cnt:94a9ed024d3859793618152ea559a168
swid Concise Software Identification (CoSWID) tag, as defined in RFC 939316 Section 2.3.
urlScheme Uniform Resource Identifier (URI) Schemes17. The scheme used in order to locate a resource.
8.3.3
