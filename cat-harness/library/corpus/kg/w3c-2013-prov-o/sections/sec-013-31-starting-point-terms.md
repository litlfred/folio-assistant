---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-013-31-starting-point-terms
section_title: "Starting Point Terms"
section_number: 3.1
pages: 3-6
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
Starting Point classes and properties provide the basis for the rest of the PROV Ontology and thus it is recommended that readers become
comfortable with how to apply these terms before continuing to the remaining categories. These terms are used to create simple provenance
descriptions that can be elaborated using terms from other categories. The classes and properties in this category are listed below and are
discussed in Section 3.1.
prov:Entity
 prov:Activity
 prov:Agent
prov:wasGeneratedBy
 prov:wasDerivedFrom
 prov:wasAttributedTo
 prov:startedAtTime
 prov:used
 prov:wasInformedBy
prov:endedAtTime
 prov:wasAssociatedWith
 prov:actedOnBehalfOf
Expanded classes and properties provide additional terms that can be used to relate classes in the Starting Point category. The terms in this
category are applied in the same way as the terms in the Starting Point category. Many of the terms in this category are subclasses or
subproperties of those in the Starting Point category. The classes and properties in this category are listed below and are discussed in Section
3.2.
prov:Collection
 prov:EmptyCollection
 prov:Bundle
 prov:Person
 prov:SoftwareAgent
 prov:Organization
 prov:Location
prov:alternateOf
 prov:specializationOf
 prov:generatedAtTime
 prov:hadPrimarySource
 prov:value
 prov:wasQuotedFrom
prov:wasRevisionOf
 
prov:invalidatedAtTime
 
prov:wasInvalidatedBy
 
prov:hadMember
 
prov:wasStartedBy
prov:wasEndedBy
 prov:invalidated
 prov:influenced
 prov:atLocation
 prov:generated
Qualified classes and properties provide elaborated information about binary relations asserted using Starting Point and Expanded properties.
The terms in this category are applied using a pattern that differs from those in the Starting Point and Expanded categories. While the relations
from the previous two categories are applied as direct, binary assertions, the terms in this category are used to provide additional attributes of
the binary relations. The pattern used in this category allows users to provide elaborate details that are not available using only Starting Point
and Expanded terms. The classes and properties in this category are listed below and are discussed in Section 3.3.
prov:Influence
 
prov:EntityInfluence
 
prov:Usage
 
prov:Start
 
prov:End
 
prov:Derivation
 
prov:PrimarySource
prov:Quotation
 
prov:Revision
 
prov:ActivityInfluence
 
prov:Generation
 
prov:Communication
 
prov:Invalidation
prov:AgentInfluence
 prov:Attribution
 prov:Association
 prov:Plan
 prov:Delegation
 prov:InstantaneousEvent
 prov:Role
prov:wasInfluencedBy
 
prov:qualifiedInfluence
 
prov:qualifiedGeneration
 
prov:qualifiedDerivation
prov:qualifiedPrimarySource
 
prov:qualifiedQuotation
 
prov:qualifiedRevision
 
prov:qualifiedAttribution
prov:qualifiedInvalidation
 prov:qualifiedStart
 prov:qualifiedUsage
 prov:qualifiedCommunication
 prov:qualifiedAssociation
prov:qualifiedEnd
 
prov:qualifiedDelegation
 
prov:influencer
 
prov:entity
 
prov:hadUsage
 
prov:hadGeneration
prov:activity
 prov:agent
 prov:hadPlan
 prov:hadActivity
 prov:atTime
 prov:hadRole
3. The PROV-O Ontology Description
This section introduces the terms in each of the following categories:
Starting Point Terms
Expanded Terms
Qualified Terms
3.1 Starting Point Terms
The Starting Point category is a small set of classes and properties that can be used to create simple, initial provenance descriptions. Three
classes provide a basis for the rest of PROV-O:
An prov:Entity is a physical, digital, conceptual, or other kind of thing with some fixed aspects; entities may be real or imaginary.
An prov:Activity is something that occurs over a period of time and acts upon or with entities; it may include consuming, processing,
transforming, modifying, relocating, using, or generating entities.
An prov:Agent is something that bears some form of responsibility for an activity taking place, for the existence of an entity, or for another
agent's activity.
The three primary classes relate to one another and to themselves using the properties shown in the following figure.
Activities start and end at particular points in time (described using properties prov:startedAtTime and prov:endedAtTime, respectively) and
during their lifespan can use and generate a variety of Entities (described with prov:used and prov:wasGeneratedBy, respectively). For example,
a blog writing activity may use a particular dataset and generate a bar chart. By expressing usage and generation, one can construct provenance
chains comprising both Activities and Entities.
In addition, we can say that an Activity prov:wasInformedBy another Activity to provide some dependency information without explicitly providing
the activities' start and end times. A prov:wasInformedBy relation between Activities suggests that the informed Activity used an Entity that was
generated by the informing Activity, but the Entity itself is unknown or is not of interest. So, the prov:wasInformedBy property allows the
construction of provenance chains comprising only Activities.
Provenance chains comprising only Entities can be formed using the prov:wasDerivedFrom property. A derivation is a transformation of one entity
into another. For example, if the Activity that created the bar chart is not known or is not of interest, then we can say that the bar chart
prov:wasDerivedFrom the dataset. Arbitrary RDF properties can be used to describe the fixed aspects of an Entity that are interesting within a
particular application (for example, the file size and format of the dataset, or the aspect ratio of the bar chart).
While the properties prov:used, prov:wasGeneratedBy, prov:wasInformedBy, and prov:wasDerivedFrom can be used to construct provenance
chains among Activities and Entities, Agents may also be ascribed responsibility for any Activity or Entity within a provenance chain. An Agent's
responsibility for an Activity or Entity is described using the properties prov:wasAssociatedWith and prov:wasAttributedTo, respectively. Agents
can also be responsible for other Agents' actions. In this case of delegation, the influencing Agent prov:actedOnBehalfOf another Agent that also
bears responsibility for the influenced Activity or Entity.
The properties rdf:type and rdfs:label are used to express prov:type and prov:label, respectively.
used
endedAtTime
wasAssociatedWith
actedOnBehalfOf
wasGeneratedBy
wasAttributedTo
wasDerivedFrom
wasInformedBy
Activity
Entity
Agent
xsd:dateTime
startedAtTime
xsd:dateTime
Figure 1. The three Starting Point classes and the properties that relate them.
The diagrams in this document depict Entities as yellow ovals,
Activities as blue rectangles, and Agents as orange pentagons.
The responsibility properties are shown in pink.
Example 1: The following PROV-O describes the resources involved when creating a chart about crime statistics. The example uses only
Starting Point terms and serves as a basis for elaboration that will be described in subsequent sections. In the example, Derek performs an
aggregation of some government crime data, grouping by national regions that are described in a separate dataset by a civil action group.
Example
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.org#> .
:bar_chart
   a prov:Entity;
   prov:wasGeneratedBy  :illustrationActivity;
   prov:wasDerivedFrom  :aggregatedByRegions;
   prov:wasAttributedTo :derek;
.
:derek
   a foaf:Person, prov:Agent;
   foaf:givenName       "Derek";
   foaf:mbox            <mailto:derek@example.org>;
   prov:actedOnBehalfOf :natonal_newspaper_inc;
.
:national_newspaper_inc 
   a foaf:Organization, prov:Agent;
   foaf:name "National Newspaper, Inc.";
.
:illustrationActivity 
   a prov:Activity; 
   prov:used              :aggregatedByRegions;
   prov:wasAssociatedWith :derek;
   prov:wasInformedBy     :aggregationActivity;
.
:aggregatedByRegions
   a prov:Entity;
   prov:wasGeneratedBy  :aggregationActivity;
   prov:wasAttributedTo :derek;
.
:aggregationActivity
   a prov:Activity;
   prov:startedAtTime    "2011-07-14T01:01:01Z"^^xsd:dateTime;
   prov:wasAssociatedWith :derek;
   prov:used              :crimeData;
   prov:used              :nationalRegionsList;
   prov:endedAtTime      "2011-07-14T02:02:02Z"^^xsd:dateTime;
.
:crimeData
   a prov:Entity;
   prov:wasAttributedTo :government;
.
:government a foaf:Organization, prov:Agent .
:nationalRegionsList 
   a prov:Entity;
   prov:wasAttributedTo :civil_action_group;
.
:civil_action_group a foaf:Organization, prov:Agent .
The example states that the agent :derek was associated with two activities: :aggregationActivity and :illustrationActivity. The activity
:aggregationActivity used the entities :crimeData (a crime statistics dataset) and :nationalRegionsList (a list of national regions), and
generated a new entity, :aggregatedByRegions that aggregates the statistics in :crimeData according to the regions in :nationalRegionsList. The
:aggregatedByRegions entity was then used by the :illustrationActivity activity, to generate a new entity :bar_chart that depicts the
aggregated statistics.
The example also states that the activity :illustrationActivity was informed by the activity :aggregationActivity. Indeed, the former used the
entity :aggregatedByRegions, which was generated by the latter.
Because the agent :derek was associated with the activities :aggregationActivity and :illustrationActivity, the entities generated by these
activities, i.e., :aggregatedByRegions and :bar_chart, were also attributed to him.
Finally, the example states that the agent :derek acted on behalf of the organization :national_newspaper_inc.
:bar_chart
:illustrationActivity
:aggregatedBy
Regions
:aggregationActivity
prov:wasGeneratedBy
prov:used
prov:wasInformedBy
prov:wasGeneratedBy
prov:wasAssociatedWith
prov:used
prov:used
prov:wasAttributedTo
prov:wasAttributedTo
:derek
:national_
newspaper_inc
prov:actedOnBehalfOf
"2011-07-14T01:01:01Z"
^^xsd:dateTime
prov:startedAtTime
2011-07-14T02:02:02Z"
^^xsd:dateTime
prov:endedAtTime
type=foaf:Person, prov:Agent
foaf:givenName="Derek"
foaf:mbox=<mailto:dererk@example.org>
type=foaf:Organization, prov:Agent
foaf:name="National Newspaper Inc."
:crimeData
:nationalRegionsList
:government
:civil_action_group
prov:wasAttributedTo
prov:wasAttributedTo
type=foaf:Organization, 
prov:Agent
type=foaf:Organization, 
prov:Agent
prov:wasDerivedFrom
prov:wasAssociatedWith
Figure 2. A graphical illustration of the PROV-O in Example 1, showing how the three Starting Point classes relate.
The diagrams in this document depict Entities as yellow ovals, Activities as blue rectangles,
and Agents as orange pentagons. The responsibility properties are shown in pink.
