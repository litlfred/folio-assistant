---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-025-c-changes-since-wd-prov-o-20120724
section_title: "C. Changes since WD-prov-o-20120724"
section_number: null
pages: 67-67
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
This section is non-normative.
Restated prov:hadRole's domain to 'Association or InstantaneousEvent' instead of the original that enumerated the subclasses of
InstantaneousEvent ('Association or End or Generation or Invalidation or Start or Usage').
Renamed prov:Source to prov:PrimarySource and prov:qualifiedSource to prov:qualifiedPrimarySource.
Examples have been rewritten to avoid usage of TriG named graph syntax except for when showing bundles in prov:asInBundle and
prov:mentionOf (since removed to a separate Note). A citation to TriG was added.
Some examples have been elaborated to use resource names like :illustration_usage rather than :usage_1.
Fixed naming mismatch by changing prov:hadOriginalSource to prov:hadPrimarySource.
Rephrased definitions for prov:EntityInfluence, prov:ActivityInfluence, and prov:AgentInfluence to align with the definition of their
superclass prov:Influence.
Updated definitions for prov:Start and prov:End from PROV-DM.
The property chain for prov:wasInformedBy was fixed from "qualifiedCommunication o entity subproperty of wasInformedBy" to
"prov:qualifiedCommunication o prov:activity subproperty of wasInformedBy"
Removed prov:mentionOf and prov:asInBundle, which have been relocated to its own Note.
Added comments encouraging the use of the more specific forms of prov:Influence.
Added uniform references to other "dated" PROV documents.
Added prefix namespace table.
Added Compliance with this document section.
Corrected Turtle syntax for RL violations in PROV-O OWL Profile section. They were missing owl:unionOf.
Updated attributions for the tools used to produce this document in Acknowledgements section.
Reworked the Expanded Terms narrative and examples to better highlight each term.
