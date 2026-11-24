---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-023-a-prov-o-owl-profile
section_title: "A. PROV-O OWL Profile"
section_number: null
pages: 65-65
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
This section is non-normative.
To encourage widespread adoption, PROV-O's design is intentionally minimal and lightweight. Because the OWL 2 RL profile is aimed at RDF
applications that require scalable reasoning without sacrificing too much expressive power [OWL2-PRIMER], it served as a baseline for all
axioms included in PROV-O. The PROV-O axioms that do not suit the OWL 2 RL profile are listed in Table 5. All five use an anonymous class
union for the domain or range of a property, while OWL 2 RL requires the classes to be explicitly named. Although introducing "placeholder"
classes would have suited the OWL 2 RL profile, these additional "abstract" classes would have been irrelevant to the modeling of provenance
information, increased the size of PROV-O unnecessarily, and exposed a potential to confuse users. All five axioms listed in the following table
use a non-superclass expression in a position that requires a superclass expression and do not conform to the OWL 2 RL Profile.
Table 5: All OWL Axioms in PROV-O that do not conform to the OWL-RL profile.
Non OWL-RL PROV-O Axiom
prov:atLocation rdfs:domain [ owl:unionOf (prov:Activity prov:Agent prov:Entity prov:InstantaneousEvent) ]
prov:wasInfluencedBy rdfs:domain [ owl:unionOf (prov:Activity prov:Agent prov:Entity) ]
prov:wasInfluencedBy rdfs:range [ owl:unionOf (prov:Activity prov:Agent prov:Entity) ]
prov:hadActivity rdfs:domain [ owl:unionOf (prov:Delegation prov:Derivation prov:Start prov:End) ]
prov:hadRole rdfs:domain [ owl:unionOf (prov:Association prov:InstantaneousEvent) ]
To provide guidance for OWL 2 RL environments that ignore the union domain axioms, some property domains or ranges have also been defined
with the closest common superclass for the classes in the union, as shown in the following table.
Table 6: Intersecting OWL2 RL compatible domains/ranges
Property
Direction
Domain/range
prov:atLocation
rdfs:domain
(implied: owl:Thing)
prov:wasInfluencedBy
rdfs:domain / rdfs:range
(implied: owl:Thing)
prov:hadActivity
rdfs:domain
prov:Influence
prov:hadRole
rdfs:domain
prov:Influence
Multiple RDFS domains and ranges [RDF-SCHEMA] for a property are interpreted as an intersection, and thus the above do not provide any
additional information in an OWL 2 DL or OWL 2 Full profile, which also understands the unions. The more general domain should not be
interpreted as saying, e.g., "prov:hadActivity can be used with any prov:Influence", but as "Anything using prov:hadActivity is (at least) a
prov:Influence".
