---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-306-classes
section_title: "Classes"
section_number: null
pages: 167-167
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
16.1.1
Build
Summary
Class that describes a build instance of software/artifacts.
Description
A build is a representation of the process in which a piece of software or artifact is built. It encapsulates information related to a
build process and provides an element from which relationships can be created to describe the build’s inputs, outputs, and related
entities (e.g. builders, identities, etc.).
ExternalIdentifier of type “urlScheme” may be used to identify build logs. In this case, the comment of the ExternalIdentifier
should be “LogReference”.
