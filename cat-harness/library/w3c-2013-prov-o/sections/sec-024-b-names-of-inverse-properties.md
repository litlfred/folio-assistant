---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-024-b-names-of-inverse-properties
section_title: "B. Names of inverse properties"
section_number: null
pages: 65-67
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
To maximize interoperability, PROV-O intentionally avoids defining too many properties' inverses. In fact, it only defines two (prov:generated and
prov:invalidated). When all inverses are defined for all properties, modelers may choose from two logically equivalent properties when making
each assertion. Although the two options may be logically equivalent, developers consuming the assertions may need to exert extra effort to
handle both (e.g., by either adding an OWL reasoner or writing code and queries to handle both cases). This extra effort can be reduced by
preferring one inverse over another.
For example, the first PROV-O statement (below) could just as easily be asserted as the second statement. But if a client queries using
prov:wasDerivedFrom when :hadDerivation was used in the assertion, no results will be returned unless OWL reasoning is applied (or the size of
the query is doubled).
Example
<http://www.w3.org/TR/prov-o/>  prov:wasDerivedFrom <http://www.w3.org/TR/prov-dm/> .
   # These two statements are equivalent if prov:wasDerivedFrom is an inverse of :hadDerivation.
   # But extra effort is required to handle both cases (if one is not already using OWL reasoning).
   # We cannot assume that everybody is using OWL reasoning.
   # We do not want people to write more code and query than necessary.
<http://www.w3.org/TR/prov-dm/>     :hadDerivation  <http://www.w3.org/TR/prov-o/>  .
So, PROV-O avoids this situation by encouraging modelers to use one property instead of its inverse; the preferred property to use is the one
defined in the PROV-O ontology. Those asserting and querying for the preferred property avoid the need for OWL reasoning, additional code,
and larger queries while maintaining the same level of interoperability.
However, the absence of defined inverses can lead to a different risk to interoperability. Because modelers are free to create their own
properties to suit their needs, they may be motivated to assert the inverse of any PROV-O property defined herein.
For example, since PROV-O does not define the inverse of prov:wasDerivedFrom, and if three developers would rather model their assertions in
the opposite direction, the following set of assertions might be found in the future web of provenance. These assertions are not in an
interoperable form without the use of an OWL reasoner, additional code, or larger queries.
Example
# If PROV-O's properties' inverses are not defined, modelers may be motivated to introduce their own inverse property name.
# The following three statements are equivalent if their predicates are all inverses of prov:wasDerivedFrom.
<http://www.w3.org/TR/prov-dm/>    my:hadDerivation  <http://www.w3.org/TR/prov-o/>  .
<http://www.w3.org/TR/prov-dm/>  your:ledTo          <http://www.w3.org/TR/prov-o/>  .
<http://www.w3.org/TR/prov-dm/> their:derivedTo      <http://www.w3.org/TR/prov-o/>  .
To balance these two interoperability risks, this document reserves the names of the PROV-O inverses. The name of a property's inverse is
determined 
by 
appending 
the 
value 
of 
its 
http://www.w3.org/ns/prov#inverse 
annotation 
to 
the 
PROV 
namespace
(http://www.w3.org/ns/prov#). Modelers wishing to use inverses of the properties defined by PROV-O should use those reserved by this
document.
For example, the same three modelers above that defined my:hadDerivation, your:ledTo, and their:derivedTo should instead look for the
http://www.w3.org/ns/prov#inverse 
annotation 
on 
prov:wasDerivedFrom 
to 
determine 
that 
they 
should 
use 
the 
property
http://www.w3.org/ns/prov#hadDerivation.
Example
@prefix prov: <http://www.w3.org/ns/prov#> .
# Each PROV-O property is annotated with the local name of its inverse.
prov:wasDerivedFrom
   a owl:ObjectProperty;
   rdfs:isDefinedBy <http://www.w3.org/ns/prov#>;
   prov:inverse     "hadDerivation";
   rdfs:domain  prov:Entity;
   rdfs:range   prov:Entity;
.
# Instead of defining their own, modelers should use the
# recommended inverse local name within the PROV namespace:
<http://www.w3.org/TR/prov-dm/> prov:hadDerivation <http://www.w3.org/TR/prov-o/>  .
# Following this recommendation avoids a proliferation of inverse definitions, 
# while encouraging the use of one inverse over another.
# This increases interoperability.
The following table lists the recommended inverse names that should be used if a modeler does not want to use the recommended PROV-O
property. For convenience, this file lists the resulting inverse properties.
Table 5: Names of inverses
Domain
PROV-O Property
Recommended inverse name
Range
prov:Agent
prov:actedOnBehalfOf
prov:hadDelegate
prov:Agent
prov:ActivityInfluence
prov:activity
prov:activityOfInfluence
prov:Activity
prov:AgentInfluence
prov:agent
prov:agentOfInfluence
prov:Agent
prov:Entity
prov:alternateOf
prov:alternateOf
prov:Entity
union
prov:atLocation
prov:locationOf
prov:Location
prov:EntityInfluence
prov:entity
prov:entityOfInfluence
prov:Entity
prov:Activity
prov:generated
prov:wasGeneratedBy
prov:Entity
union
prov:hadActivity
prov:wasActivityOfInfluence
prov:Activity
prov:Derivation
prov:hadGeneration
prov:generatedAsDerivation
prov:Generation
prov:Collection
prov:hadMember
prov:wasMemberOf
prov:Entity
prov:Association
prov:hadPlan
prov:wasPlanOf
prov:Plan
prov:Entity
prov:hadPrimarySource
prov:wasPrimarySourceOf
prov:Entity
union
prov:hadRole
prov:wasRoleIn
prov:Role
prov:Derivation
prov:hadUsage
prov:wasUsedInDerivation
prov:Usage
prov:influenced
prov:wasInfluencedBy
prov:Influence
prov:influencer
prov:hadInfluence
union
prov:Activity
prov:invalidated
prov:wasInvalidatedBy
prov:Entity
prov:Activity
prov:qualifiedAssociation
prov:qualifiedAssociationOf
prov:Association
prov:Entity
prov:qualifiedAttribution
prov:qualifiedAttributionOf
prov:Attribution
prov:Activity
prov:qualifiedCommunication
prov:qualifiedCommunicationOf
prov:Communication
prov:Agent
prov:qualifiedDelegation
prov:qualifiedDelegationOf
prov:Delegation
prov:Entity
prov:qualifiedDerivation
prov:qualifiedDerivationOf
prov:Derivation
prov:Activity
prov:qualifiedEnd
prov:qualifiedEndOf
prov:End
prov:Entity
prov:qualifiedGeneration
prov:qualifiedGenerationOf
prov:Generation
union
prov:qualifiedInfluence
prov:qualifiedInfluenceOf
prov:Influence
prov:Entity
prov:qualifiedInvalidation
prov:qualifiedInvalidationOf
prov:Invalidation
prov:Entity
prov:qualifiedPrimarySource
prov:qualifiedSourceOf
prov:PrimarySource
prov:Entity
prov:qualifiedQuotation
prov:qualifiedQuotationOf
prov:Quotation
prov:Entity
prov:qualifiedRevision
prov:revisedEntity
prov:Revision
prov:Activity
prov:qualifiedStart
prov:qualifiedStartOf
prov:Start
prov:Activity
prov:qualifiedUsage
prov:qualifiedUsingActivity
prov:Usage
prov:Entity
prov:specializationOf
prov:generalizationOf
prov:Entity
prov:Activity
prov:used
prov:wasUsedBy
prov:Entity
prov:Activity
prov:wasAssociatedWith
prov:wasAssociateFor
prov:Agent
prov:Entity
prov:wasAttributedTo
prov:contributed
prov:Agent
prov:Entity
prov:wasDerivedFrom
prov:hadDerivation
prov:Entity
prov:Activity
prov:wasEndedBy
prov:ended
prov:Entity
prov:Entity
prov:wasGeneratedBy
prov:generated
prov:Activity
union
prov:wasInfluencedBy
prov:influenced
union
prov:Activity
prov:wasInformedBy
prov:informed
prov:Activity
prov:Entity
prov:wasInvalidatedBy
prov:invalidated
prov:Activity
prov:Entity
prov:wasQuotedFrom
prov:quotedAs
prov:Entity
prov:Entity
prov:wasRevisionOf
prov:hadRevision
prov:Entity
prov:Activity
prov:wasStartedBy
prov:started
prov:Entity
