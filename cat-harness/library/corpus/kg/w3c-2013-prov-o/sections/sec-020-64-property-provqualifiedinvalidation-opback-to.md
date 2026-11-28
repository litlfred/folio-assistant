---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-020-64-property-provqualifiedinvalidation-opback-to
section_title: "(64) Property: prov:qualifiedInvalidation opback to qualified properties"
section_number: null
pages: 52-54
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
back to qualified properties
IRI:
http://www.w3.org/ns/prov#qualifiedInvalidation
Invalidation is the start of the destruction, cessation, or expiry of an existing entity by an activity. The entity is no longer available for use (or
further invalidation) after invalidation. Any generation or usage of an entity precedes its invalidation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/ontology#> .
@prefix :     <http://example.com/> .
:the-Painter 
   a prov:Entity, ex:Painting;
   rdfs:label "Le Peintre"@fr, "The Painter"@en;
   prov:wasAttributedTo <http://dbpedia.org/resource/Pablo_Picasso>;
   prov:wasInvalidatedBy :swissair_Flight_111_crash;
   prov:qualifiedInvalidation [
      a prov:Invalidation;
      prov:activity    :swissair_Flight_111_crash;
      prov:atTime      "1998-09-02T01:31:00Z"^^xsd:dateTime;
      prov:atLocation  <http://purl.org/twc/location/Swissair-Flight-111-crash>;
   ];
. 
:swissair_Flight_111_crash a prov:Activity .
<http://purl.org/twc/location/Swissair-Flight-111-crash> a prov:Location .
If this Entity prov:wasInvalidatedBy Activity :a, then it can qualify how it was invalidated using prov:qualifiedInvalidation [ a prov:Invalidation;
prov:activity :a; :foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Entity
has range
prov:Invalidation
qualifies
prov:wasInvalidatedBy op
PROV-DM term
Invalidation
(65) Property: prov:qualifiedStart op
IRI:
http://www.w3.org/ns/prov#qualifiedStart
Start is when an activity is deemed to have been started by an entity, known as trigger. The activity did not exist before its start. Any usage,
generation, or invalidation involving an activity follows the activity's start. A start may refer to a trigger entity that set off the activity, or to an
activity, known as starter, that generated the trigger.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
# Start can be used to qualify wasStartedBy with time and location information.
:consistency_checking
   a prov:Activity;
   prov:wasStartedBy :updated_data_record;
   prov:qualifiedStart [
      a prov:Start;
      prov:entity       :updated_data_record;
      prov:atTime       "2011-07-06T01:48:36Z"^^xsd:dateTime;
      prov:atLocation   :scienceLab_003;
      prov:hadActivity  :syntax_checking;
   ];
.
:updated_data_record a prov:Entity .
### There is an explicit process of checking the syntax of the updated data record
:syntax_checking
   a   prov:Activity ;
   prov:startedAtTime      "2011-07-06T01:48:36Z"^^xsd:dateTime;
   prov:endedAtTime        "2011-07-06T02:12:36Z"^^xsd:dateTime;
   prov:wasAssociatedWith  :syntax_checker ;
back to qualified properties
back to qualified properties
.
:syntax_checker   a   prov:SoftwareAgent .
If this Activity prov:wasStartedBy Entity :e1, then it can qualify how it was started using prov:qualifiedStart [ a prov:Start; prov:entity :e1; :foo
:bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Activity
has range
prov:Start
qualifies
prov:wasStartedBy op
PROV-DM term
Start
(66) Property: prov:qualifiedUsage op
IRI:
http://www.w3.org/ns/prov#qualifiedUsage
Usage is the beginning of utilizing an entity by an activity. Before usage, the activity had not begun to utilize this entity and could not have been
affected by the entity.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
:newsPublication
   a prov:Activity;
   prov:used                    :tsunami_image;
   prov:qualifiedUsage [
      a prov:Usage;
      prov:entity               :tsunami_image;
      ex:hasCopyrightPermission :licensedUse;  
      ex:hasOwner               :reuters;
   ];
.
:tsunami_image a prov:Entity .
:reuters       a prov:Agent .
If this Activity prov:used Entity :e, then it can qualify how it used it using prov:qualifiedUsage [ a prov:Usage; prov:entity :e; :foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Activity
has range
prov:Usage
qualifies
prov:used op
PROV-DM term
Usage
