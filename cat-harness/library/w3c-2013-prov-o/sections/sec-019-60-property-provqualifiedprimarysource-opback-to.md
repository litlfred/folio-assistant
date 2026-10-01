---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-019-60-property-provqualifiedprimarysource-opback-to
section_title: "(60) Property: prov:qualifiedPrimarySource opback to qualified properties"
section_number: null
pages: 50-52
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
IRI:
http://www.w3.org/ns/prov#qualifiedPrimarySource
A primary source for a topic refers to something produced by some agent with direct experience and knowledge about the topic, at the time of
the topic's study, without benefit from hindsight. Because of the directness of primary sources, they 'speak for themselves' in ways that cannot
be captured through the filter of secondary sources. As such, it is important for secondary sources to reference those primary sources from
which they were derived, so that their reliability can be investigated. A primary source relation is a particular case of derivation of secondary
materials from their primary sources. It is recognized that the determination of primary sources can be up to interpretation, and should be done
according to conventions accepted within the application's domain.
Example
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix ex:      <http://example.com/vocab#> .
@prefix :        <http://example.com/> .
:temperatureDisplay
   a prov:Entity;
   prov:hadPrimarySource :sensorReading20120510;
   prov:qualifiedPrimarySource [
      a prov:PrimarySource;
      prov:entity        :sensorReading20120510;
      ex:precisionLoss true;
      rdfs:comment """The displayed temperature does not show the full precision 
                      available in the reading.""";
   ];
.
:sensorReading20120510 
   a prov:Entity;
   prov:wasGeneratedBy :temperatureSensor;
.
If this Entity prov:hadPrimarySource Entity :e, then it can qualify how using prov:qualifiedPrimarySource [ a prov:PrimarySource; prov:entity :e;
:foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Entity
has range
prov:PrimarySource
back to qualified properties
back to qualified properties
qualifies
prov:hadPrimarySource op
PROV-DM term
primary-source
(61) Property: prov:qualifiedQuotation op
IRI:
http://www.w3.org/ns/prov#qualifiedQuotation
A quotation is the repeat of (some or all of) an entity, such as text or image, by someone who may or may not be its original author. Quotation is
a particular case of derivation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix my:   <http://example.com/vocab/my#> .
@prefix :     <http://example.com/> .
:bl-dagstuhl
   a prov:Entity;
   prov:value """During the workshop, it became clear to me that the consensus
   based models (which are often graphical in nature) can not only be
   formalized but also be directly connected to these database focused
   formalizations. I just needed to get over the differences in syntax.
   This could imply that we could have nice way to trace provenance across
   systems and through databases and be able to understand the
   mathematical properties of this interconnection.""";
   prov:wasQuotedFrom <http://purl.org/twc/page/thoughts-from-the-dagstuhl-workshop>;
   prov:qualifiedQuotation [
      a prov:Quotation;
      prov:entity <http://purl.org/twc/page/thoughts-from-the-dagstuhl-workshop>;
      my:fromSection 1;
   ];
.
<http://purl.org/twc/page/thoughts-from-the-dagstuhl-workshop>
   a prov:Entity;
   prov:wasAttributedTo <http://data.semanticweb.org/person/paul-groth>;
.
<http://data.semanticweb.org/person/luc-moreau> a prov:Person, prov:Agent .
<http://data.semanticweb.org/person/paul-groth> a prov:Person, prov:Agent .
If this Entity prov:wasQuotedFrom Entity :e, then it can qualify how using prov:qualifiedQuotation [ a prov:Quotation; prov:entity :e; :foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Entity
has range
prov:Quotation
qualifies
prov:wasQuotedFrom op
PROV-DM term
quotation
(62) Property: prov:qualifiedRevision op
IRI:
http://www.w3.org/ns/prov#qualifiedRevision
A revision is a derivation for which the resulting entity is a revised version of some original. The implication here is that the resulting entity
contains substantial content from the original. Revision is a particular case of derivation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:draft2 
   a prov:Entity;
   prov:wasRevisionOf :draft1;
   prov:qualifiedRevision [
      a prov:Revision;
back to qualified properties
back to qualified properties
      prov:entity :draft1
   ];
   prov:wasAttributedTo :eddie;
.
:draft1 a prov:Entity .
:eddie  a prov:Person, prov:Agent, prov:Entity .
If this Entity prov:wasRevisionOf Entity :e, then it can qualify how it was revised using prov:qualifiedRevision [ a prov:Revision; prov:entity :e;
:foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Entity
has range
prov:Revision
qualifies
prov:wasRevisionOf op
PROV-DM term
revision
(63) Property: prov:qualifiedAttribution op
IRI:
http://www.w3.org/ns/prov#qualifiedAttribution
Attribution is the ascribing of an entity to an agent. When an entity e is attributed to agent ag, entity e was generated by some unspecified
activity that in turn was associated to agent ag. Thus, this relation is useful when the activity is not known, or irrelevant.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
## When the role of the agent is not known or does not matter:
:nationalRegionsList 
   a prov:Entity;
   prov:wasAttributedTo :civil_action_group;
.
:civil_action_group a prov:Agent .
## If we want to express the role of the agent:
:nationalRegionsList 
   a prov:Entity;
   prov:qualifiedAttribution [
      a prov:Attribution;
      prov:agent :civil_action_group;
      ex:hadRole :owner;
   ]
.
If this Entity prov:wasAttributedTo Agent :ag, then it can qualify how it was influenced using prov:qualifiedAttribution [ a prov:Attribution;
prov:agent :ag; :foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Entity
has range
prov:Attribution
qualifies
prov:wasAttributedTo op
PROV-DM term
attribution
