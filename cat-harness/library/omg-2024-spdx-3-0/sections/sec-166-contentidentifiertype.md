---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-166-contentidentifiertype
section_title: "ContentIdentifierType"
section_number: null
pages: 86-86
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies the type of a content identifier.
Description
ContentIdentifierType specifies the type of a content identifier.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/ContentIdentifierType
Name:
ContentIdentifierType
Entries
gitoid Gitoid59, stands for Git Object ID60. A gitoid of type blob is a unique hash of a binary artifact. A gitoid may represent either
an Artifact Identifier61 for the software artifact or an Input Manifest Identifier62 for the software artifact’s associated Artifact
Input Manifest63; this ambiguity exists because the Artifact Input Manifest is itself an artifact, and the gitoid of that artifact
is its valid identifier. Gitoids calculated on software artifacts (Snippet, File, or Package Elements) should be recorded in the
SPDX 3.0 SoftwareArtifact’s contentIdentifier property. Gitoids calculated on the Artifact Input Manifest (Input Manifest
Identifier) should be recorded in the SPDX 3.0 Element’s externalIdentifier property. See OmniBOR Specification64, a
minimalistic specification for describing software Artifact Dependency Graphs65.
swhid SoftWare Hash IDentifier, a persistent intrinsic identifier for digital artifacts, such as files, trees (also known as directories or
folders), commits, and other objects typically found in version control systems. The format of the identifiers is defined in the
SWHID specification66 (ISO/IEC DIS 18670). They typically look like swh:1:cnt:94a9ed024d3859793618152ea559a168b
9.3.2
