---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-168-sbomtype
section_title: "SbomType"
section_number: null
pages: 87-87
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provides a set of values to be used to describe the common types of SBOMs that tools may create.
Description
The set of SBOM types with definitions as defined in Types of Software Bill of Material (SBOM) Documents67, published on
April 21, 2023.
An SBOM type describes the most likely type of an SBOM from the producer perspective, so that consumers can draw conclusions
about the data inside an SBOM.
A single SBOM can have multiple SBOM document types associated with it.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/SbomType
Name:
SbomType
Entries
analyzed SBOM generated through analysis of artifacts (e.g., executables, packages, containers, and virtual machine images) after
its build. Such analysis generally requires a variety of heuristics. In some contexts, this may also be referred to as a “3rd
party” SBOM.
build SBOM generated as part of the process of building the software to create a releasable artifact (e.g., executable or package)
from data such as source files, dependencies, built components, build process ephemeral data, and other SBOMs.
deployed SBOM provides an inventory of software that is present on a system. This may be an assembly of other SBOMs that
combines analysis of configuration options, and examination of execution behavior in a (potentially simulated) deployment
environment.
design SBOM of intended, planned software project or product with included components (some of which may not yet exist) for
a new software artifact.
runtime SBOM generated through instrumenting the system running the software, to capture only components present in the
system, as well as external call-outs or dynamically loaded components. In some contexts, this may also be referred to as an
“Instrumented” or “Dynamic” SBOM.
source SBOM created directly from the development environment, source files, and included dependencies used to build an
product artifact.
9.3.4
