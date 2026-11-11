---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-011-note
section_title: "NOTE"
section_number: null
pages: 5-6
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The ODRL Information Model provides a logical view of the components of the Policy model. The implementable view of
the ODRL Information Model is provided by various encoding serialisations as normatively described in the ODRL
Vocabulary & Expression document [odrl-vocab]. The mapping of the logical Information Model components to the
implementable serialisations may require some trade-offs and/or differences depending on the features supported by the
serialisation language.
In the latter case, the profile property MUST be used to indicate the IRIs of the ODRL Profile(s). See the ODRL Profiles section
for more details on mechanisms to define ODRL Profiles and conformance requirements. (The Examples in this document will
use ODRL Profile identifiers for illustrative purposes only.)
An ODRL Policy MAY be subclassed to more precisely describe the context of use of the Policy that MAY include additional
constraints that ODRL processors MUST understand. Additional Policy subclasses MAY be documented in the ODRL Common
Vocabulary [odrl-vocab] or in ODRL Profiles. A Policy class MUST be disjoint will all Policy subclasses (except for Set).
