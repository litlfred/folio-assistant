---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-017-42-expanded-terms
section_title: "Expanded Terms"
section_number: 4.2
pages: 21-33
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
The additional terms used to describe relations among Starting Point classes are discussed in Section 3.2.
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
(13) Class: prov:Collection
IRI:
http://www.w3.org/ns/prov#Collection
A collection is an entity that provides a structure to some constituents, which are themselves entities. These constituents are said to be
member of the collections.
Example
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix ex:      <http://example.com/ontology#> .
@prefix :        <http://example.com/> .
:todays-us-supreme-court
   a prov:Collection, :RobertsCourt;
   prov:qualifiedGeneration [
      a prov:Generation;
      
      # The generation is being qualified to be imprecise;
      # prov:generatedAtTime and prov:atTime specify exact instants in time.
      dcterms:date "2012"^^xsd:gYear; 
   ];                                 
   prov:hadMember
      <http://dbpedia.org/resource/John_Glover_Roberts,_Jr.>,
      <http://dbpedia.org/resource/Antonin_Scalia>, 
      <http://dbpedia.org/resource/Anthony_Kennedy>, 
      <http://dbpedia.org/resource/Clarence_Thomas>, 
      <http://dbpedia.org/resource/Ruth_Bader_Ginsburg>,
      <http://dbpedia.org/resource/Stephen_Breyer>,     
      <http://dbpedia.org/resource/Samuel_Alito>,      
      <http://dbpedia.org/resource/Sonia_Sotomayor>,  
      <http://dbpedia.org/resource/Elena_Kagan>;   
   prov:wasDerivedFrom :the-first-us-supreme-court;
   dcterms:description :copied-string;
.
:copied-string
   a prov:Entity;
   prov:value """2010–present: A. Scalia A. Kennedy C. Thomas R.B. Ginsburg 
                 S. Breyer S. Alito S. Sotomayor E. Kagan""";
   prov:wasQuotedFrom :page-by-composition;
.
:page-by-seat
   a prov:Entity, ex:WikipediaPage;
   prov:specializationOf <http://purl.org/twc/page/wikipedia/us-supreme-court-by-seat>;
   prov:generatedAtTime "2011-08-31T12:51:00"^^xsd:dateTime;
.
:page-by-composition
   a prov:Entity, ex:WikipediaPage;
   prov:specializationOf <http://purl.org/twc/page/wikipedia/us-supreme-court-by-composition>;
   prov:generatedAtTime "2012-05-16T14:33:00"^^xsd:dateTime;
.
back to expanded classes
back to expanded classes
back to expanded classes
is subclass of
prov:Entity
described with properties:
prov:hadMember op
has subclass
prov:EmptyCollection
PROV-DM term
collection
(14) Class: prov:EmptyCollection
IRI:
http://www.w3.org/ns/prov#EmptyCollection
An empty collection is a collection without members.
Example
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.org/> .
:c a prov:EmptyCollection . # The collection is believed to not contain members.
is subclass of
prov:Collection
described with properties:
prov:hadMember op
(15) Class: prov:Bundle
IRI:
http://www.w3.org/ns/prov#Bundle
A bundle is a named set of provenance descriptions, and is itself an Entity, so allowing provenance of provenance to be expressed.
Example
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix my:      <http://example.com/my#> .
@prefix :        <http://example.com/#> .
@base <http://www.example.com/example.ttl> .
<> # A provenance file located at http://www.example.com/example.ttl
   a prov:Bundle;
   prov:generatedAtTime "2012-05-24T09:30:00"^^xsd:dateTime;
   prov:wasAttributedTo :bob;
.
:report1
   a my:Report, prov:Entity;
   my:version "1";
   prov:generatedAtTime "2012-05-24T01:00:00"^^xsd:dateTime;
   prov:wasAttributedTo :bob;
.
Note that there are kinds of bundles (e.g. handwritten letters, audio recordings, etc.) that are not expressed in PROV-O, but can be still be
described by PROV-O.
is subclass of
prov:Entity
PROV-DM term
bundle-entity
(16) Class: prov:Person
IRI:
http://www.w3.org/ns/prov#Person
Person agents are people.
Example
back to expanded classes
back to expanded classes
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix :     <http://example.com/> .
<http://dbpedia.org/resource/Pablo_Picasso>
   a prov:Person, prov:Agent;
   foaf:depiction <http://upload.wikimedia.org/wikipedia/commons/9/98/Pablo_picasso_1.jpg>;
.
is subclass of
prov:Agent
described with properties:
prov:qualifiedDelegation op , prov:actedOnBehalfOf op
PROV-DM term
agent
(17) Class: prov:SoftwareAgent
IRI:
http://www.w3.org/ns/prov#SoftwareAgent
A software agent is running software.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
# Googlebot is Google's web crawling bot; 
# it can initiate and participate in web-crawling activities.
:googlebot
   a prov:SoftwareAgent;
   rdfs:label "Googlebot"^^xsd:string;
.
is subclass of
prov:Agent
described with properties:
prov:qualifiedDelegation op , prov:actedOnBehalfOf op
PROV-DM term
agent
(18) Class: prov:Organization
IRI:
http://www.w3.org/ns/prov#Organization
An organization is a social or legal institution such as a company, society, etc.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix :     <http://example.com/> .
:W3C 
   a prov:Agent, prov:Organization;
   foaf:name "World Wide Web Consortium";
. 
is subclass of
prov:Agent
described with properties:
prov:qualifiedDelegation op , prov:actedOnBehalfOf op
back to expanded classes
back to expanded properties
PROV-DM term
agent
(19) Class: prov:Location
IRI:
http://www.w3.org/ns/prov#Location
A location can be an identifiable geographic place (ISO 19112), but it can also be a non-geographic place such as a directory, row, or column.
As such, there are numerous ways in which location can be expressed, such as by a coordinate, address, landmark, and so forth.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix sioc: <http://rdfs.org/sioc/ns#> .
@prefix :     <http://example.com/> .
# A Location can be a path or a geographical location.
:post9821 
   a prov:Entity, sioc:Post;   
   prov:wasGeneratedBy :publicationActivity1123;
   prov:atLocation     :more-crime-happens-in-cities;
   prov:qualifiedGeneration [
      a prov:Generation;
      prov:activity    :publicationActivity1123;
      prov:atTime     "2011-07-16T01:52:02Z"^^xsd:dateTime; 
      prov:atLocation <http://dbpedia.org/resource/Madrid>;
   ];
.
:publicationActivity1123      a prov:Activity.
:more-crime-happens-in-cities a prov:Location.
<http://dbpedia.org/resource/Madrid> a prov:Location. 
in range of
prov:atLocation op
PROV-DM term
attribute-location
(20) Property: prov:alternateOf op
IRI:
http://www.w3.org/ns/prov#alternateOf
Two alternate entities present aspects of the same thing. These aspects may be the same or different, and the alternate entities may or may
not overlap in time.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:bbc a prov:Agent .
:london_forecast_0412 
   a prov:Entity;
   prov:wasAttributedTo :bbc;
   prov:wasGeneratedBy [
      a prov:Activity;
      prov:endedAtTime "2012-04-12T00:00:00-04:00"^^xsd:dateTime;
   ];
   prov:alternateOf :london_forecast_0413;
.
:london_forecast_0413 
   a prov:Entity;
   prov:wasAttributedTo :bbc;
   prov:wasGeneratedBy [
      a prov:Activity;
      prov:endedAtTime "2012-04-13T00:00:00-04:00"^^xsd:dateTime;
   ];
   prov:alternateOf :london_forecast_0412;
.
## :london_forecast_0412 and :london_forecast_0413 are both 
## specialization of the more general entity :london_forecast
:london_forecast 
   a prov:Entity;
   prov:wasAttributedTo :bbc;
.
back to expanded properties
back to expanded properties
:london_forecast_0412
   prov:specializationOf :london_forecast;
.
:london_forecast_0413
   prov:specializationOf :london_forecast;
.
has domain
prov:Entity
has range
prov:Entity
has sub-properties
prov:specializationOf
PROV-DM term
alternate
(21) Property: prov:specializationOf op
IRI:
http://www.w3.org/ns/prov#specializationOf
An entity that is a specialization of another shares all aspects of the latter, and additionally presents more specific aspects of the same thing as
the latter. In particular, the lifetime of the entity being specialized contains that of any specialization. Examples of aspects include a time period,
an abstraction, and a context associated with the entity.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:london_forecast_0412 
   a prov:Entity;
   prov:wasAttributedTo :bbc;
   prov:wasGeneratedBy [
      a prov:Activity;
      prov:endedAtTime "2012-04-12T00:00:00-04:00"^^xsd:dateTime;
   ];
.
:london_forecast_0413 
   a prov:Entity;
   prov:wasAttributedTo :bbc;
   prov:wasGeneratedBy [
      a prov:Activity;
      prov:endedAtTime "2012-04-13T00:00:00-04:00"^^xsd:dateTime;
   ];
.
:london_forecast 
   a prov:Entity;
   prov:wasAttributedTo :bbc;
.
## :london_forecast_0412 and :london_forecast_0413 are both 
## specialization of the more general entity :london_forecast
:london_forecast_0412  
   prov:alternateOf      :london_forecast_0413;
   prov:specializationOf :london_forecast;
.
has super-properties
prov:alternateOf op
has domain
prov:Entity
has range
prov:Entity
PROV-DM term
specialization
(22) Property: prov:generatedAtTime dp
IRI:
http://www.w3.org/ns/prov#generatedAtTime
Generation is the completion of production of a new entity by an activity. This entity did not exist before generation and becomes available for
usage after this generation.
back to expanded properties
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
# A widget was generated 1:35:23 PM on April 3, 2012 UTC
:widget-789532
   a prov:Entity;
   prov:generatedAtTime "2012-04-03T13:35:23Z"^^xsd:dateTime;
.
# The above statement is equivalent to:
# :widget-789532 prov:qualifiedGeneration [ prov:atTime "2012-04-03T13:35:23Z"^^xsd:dateTime ] .
The time at which an entity was completely created and is available for use.
has domain
prov:Entity
has range
http://www.w3.org/2001/XMLSchema#dateTime
can be qualified with
prov:Generation
prov:atTime dp
PROV-DM term
Generation
(23) Property: prov:hadPrimarySource op
IRI:
http://www.w3.org/ns/prov#hadPrimarySource
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
@prefix foaf:    <http://xmlns.com/foaf/0.1/> .
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix lang:    <http://lexvo.org/id/iso639-3/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix frbr:    <http://purl.org/vocab/frbr/core#> .
@prefix :        <http://example.com/> .
## Having an primary source is a particular case of derivation.
<http://www.gutenberg.org/ebooks/996>
   a prov:Entity, frbr:Work;
   dcterms:title          "Don Quixote";
   prov:wasAttributedTo   :ormsby;
   dcterms:language       lang:eng;
   prov:hadPrimarySource <http://cultura.linkeddata.es/BNE/resource/C1001/XX2197892>;
.
#### The English version book is a translation that is based on the original Spanish book
<http://cultura.linkeddata.es/BNE/resource/C1001/XX2197892>
    a prov:Entity, frbr:Work;
    prov:wasAttributedTo :cervantes;
    dcterms:language     lang:spa;
.
:cervantes
   a prov:Person;
   foaf:name "Miguel de Cervantes";
.
:ormsby
   a prov:Person;
   foaf:name "John Ormsby";
.
has super-properties
prov:wasDerivedFrom op
back to expanded properties
back to expanded properties
has domain
prov:Entity
has range
prov:Entity
can be qualified with
prov:qualifiedPrimarySource op
prov:PrimarySource
PROV-DM term
primary-source
(24) Property: prov:value dp
IRI:
http://www.w3.org/ns/prov#value
Provides a value that is a direct representation of an entity.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:copied-string
   a prov:Entity;
   prov:value 
      """2010–present: A. Scalia A. Kennedy C. Thomas R.B. Ginsburg 
         S. Breyer S. Alito S. Sotomayor E. Kagan""";
   prov:wasQuotedFrom 
      <http://purl.org/twc/page/wikipedia/us-supreme-court-by-composition>;
.
has domain
prov:Entity
PROV-DM term
attribute-value
(25) Property: prov:wasQuotedFrom op
IRI:
http://www.w3.org/ns/prov#wasQuotedFrom
A quotation is the repeat of (some or all of) an entity, such as text or image, by someone who may or may not be its original author. Quotation is
a particular case of derivation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
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
.
<http://purl.org/twc/page/thoughts-from-the-dagstuhl-workshop>
   a prov:Entity;
.
An entity is derived from an original entity by copying, or 'quoting', some or all of it.
has super-properties
prov:wasDerivedFrom op
has domain
prov:Entity
back to expanded properties
back to expanded properties
has range
prov:Entity
can be qualified with
prov:qualifiedQuotation op
prov:Quotation
PROV-DM term
quotation
(26) Property: prov:wasRevisionOf op
IRI:
http://www.w3.org/ns/prov#wasRevisionOf
A revision is a derivation for which the resulting entity is a revised version of some original. The implication here is that the resulting entity
contains substantial content from the original. Revision is a particular case of derivation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix sioc: <http://rdfs.org/sioc/ns#> .
@prefix :     <http://example.com/> .
:post9821v1
   a prov:Entity, sioc:Post;
   prov:wasRevisionOf :post9821;
   rdfs:comment ":post9821v1 is a post, which is a revision of the original post :post9821.";
.    
A revision is a derivation that revises an entity into a revised version.
has super-properties
prov:wasDerivedFrom op
has domain
prov:Entity
has range
prov:Entity
can be qualified with
prov:Revision
prov:qualifiedRevision op
PROV-DM term
revision
(27) Property: prov:invalidatedAtTime dp
IRI:
http://www.w3.org/ns/prov#invalidatedAtTime
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
   prov:invalidatedAtTime "1998-09-02T01:31:00Z"^^xsd:dateTime;
.
The time at which an entity was invalidated (i.e., no longer usable).
has domain
prov:Entity
has range
http://www.w3.org/2001/XMLSchema#dateTime
back to expanded properties
back to expanded properties
can be qualified with
prov:Invalidation
prov:atTime dp
PROV-DM term
Invalidation
(28) Property: prov:wasInvalidatedBy op
IRI:
http://www.w3.org/ns/prov#wasInvalidatedBy
Invalidation is the start of the destruction, cessation, or expiry of an existing entity by an activity. The entity is no longer available for use (or
further invalidation) after invalidation. Any generation or usage of an entity precedes its invalidation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix :     <http://example.com/> .
:the-Painter 
   a prov:Entity, :Painting;
   rdfs:label "Le Peintre"@fr, "The Painter"@en;
   prov:wasAttributedTo <http://dbpedia.org/resource/Pablo_Picasso>;
   prov:wasInvalidatedBy :Swissair_Flight_111_crash; #The painting was destroyed in an airplane crash
.
<http://dbpedia.org/resource/Pablo_Picasso> 
   a prov:Agent;
   foaf:depiction <http://upload.wikimedia.org/wikipedia/commons/9/98/Pablo_picasso_1.jpg>;
.
:Swissair_Flight_111_crash 
   a prov:Activity;
   prov:used <http://dbpedia.org/resource/Swissair_Flight_111>;
.
has super-properties
prov:wasInfluencedBy op
has domain
prov:Entity
has range
prov:Activity
can be qualified with
prov:Invalidation
prov:qualifiedInvalidation op
PROV-DM term
Invalidation
(29) Property: prov:hadMember op
IRI:
http://www.w3.org/ns/prov#hadMember
A collection is an entity that provides a structure to some constituents, which are themselves entities. These constituents are said to be
member of the collections.
Example
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix prov:    <http://www.w3.org/ns/prov#> .
@prefix ex:      <http://example.com/ontology#> .
@prefix :        <http://example.com/> .
:todays-us-supreme-court
   a prov:Collection, ex:RobertsCourt;
   dcterms:description [
      a prov:Entity;
      prov:value """2010–present: A. Scalia A. Kennedy C. Thomas R.B. Ginsburg S. 
                  Breyer S. Alito S. Sotomayor E. Kagan""";
      prov:wasQuotedFrom :page-by-composition;
   ];
   prov:qualifiedGeneration [
      a prov:Generation;
      
      # Since we need to be imprecise, we can't use prov:generatedAtTime or prov:atTime
back to expanded properties
      dcterms:date "2012"^^xsd:gYear;
   ];
   prov:wasDerivedFrom :the-first-us-supreme-court;
   prov:hadMember
      <http://dbpedia.org/resource/John_Glover_Roberts,_Jr.>,
      <http://dbpedia.org/resource/Antonin_Scalia>, 
      <http://dbpedia.org/resource/Anthony_Kennedy>, 
      <http://dbpedia.org/resource/Clarence_Thomas>, 
      <http://dbpedia.org/resource/Ruth_Bader_Ginsburg>,
      <http://dbpedia.org/resource/Stephen_Breyer>,     
      <http://dbpedia.org/resource/Samuel_Alito>,      
      <http://dbpedia.org/resource/Sonia_Sotomayor>,  
      <http://dbpedia.org/resource/Elena_Kagan>;   
.
:page-by-seat
   a prov:Entity, ex:WikipediaPage;
   prov:specializationOf <http://purl.org/twc/page/wikipedia/us-supreme-court-by-seat>;
   prov:generatedAtTime "2011-08-31T12:51:00"^^xsd:dateTime;
.
:page-by-composition
   a prov:Entity, ex:WikipediaPage;
   prov:specializationOf <http://purl.org/twc/page/wikipedia/us-supreme-court-by-composition>;
   prov:generatedAtTime "2012-05-16T14:33:00"^^xsd:dateTime;
.
has super-properties
prov:wasInfluencedBy op
has domain
prov:Collection
has range
prov:Entity
PROV-DM term
collection
(30) Property: prov:wasStartedBy op
IRI:
http://www.w3.org/ns/prov#wasStartedBy
Start is when an activity is deemed to have been started by an entity, known as trigger. The activity did not exist before its start. Any usage,
generation, or invalidation involving an activity follows the activity's start. A start may refer to a trigger entity that set off the activity, or to an
activity, known as starter, that generated the trigger.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
# Use prov:qualifiedStart to see when and where the activity was started
:experiment
   a prov:Activity;
   prov:wasStartedBy :researcher;
.
:researcher a prov:Agent .
Start is when an activity is deemed to have started. A start may refer to an entity, known as trigger, that initiated the activity.
has super-properties
prov:wasInfluencedBy op
has domain
prov:Activity
has range
prov:Entity
can be qualified with
prov:Start
prov:qualifiedStart op
PROV-DM term
Start
back to expanded properties
back to expanded properties
(31) Property: prov:wasEndedBy op
IRI:
http://www.w3.org/ns/prov#wasEndedBy
End is when an activity is deemed to have been ended by an entity, known as trigger. The activity no longer exists after its end. Any usage,
generation, or invalidation involving an activity precedes the activity's end. An end may refer to a trigger entity that terminated the activity, or to
an activity, known as ender that generated the trigger.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:experiment 
   a prov:Activity;
   prov:wasEndedBy :inconsistentResult;
   prov:qualifiedEnd [
      a prov:End;
      prov:entity     :inconsistentResult;
      prov:atTime    "2011-07-16T01:52:02Z"^^xsd:dateTime;
      prov:atLocation :scienceLab_003;
   ];
.
:inconsistentResult a prov:Entity .
:scienceLab_003     a prov:Location .
End is when an activity is deemed to have ended. An end may refer to an entity, known as trigger, that terminated the activity.
has super-properties
prov:wasInfluencedBy op
has domain
prov:Activity
has range
prov:Entity
can be qualified with
prov:End
prov:qualifiedEnd op
PROV-DM term
End
(32) Property: prov:invalidated op
IRI:
http://www.w3.org/ns/prov#invalidated
Invalidation is the start of the destruction, cessation, or expiry of an existing entity by an activity. The entity is no longer available for use (or
further invalidation) after invalidation. Any generation or usage of an entity precedes its invalidation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix ex:   <http://example.com/ontology#> .
@prefix :     <http://example.com/> .
:swissair_Flight_111_crash 
   a prov:Activity;
   prov:used        <http://dbpedia.org/resource/Swissair_Flight_111>;
   prov:invalidated :the-Painter;
.
:the-Painter 
   a prov:Entity, ex:Painting;
   rdfs:label "Le Peintre"@fr, "The Painter"@en;
   prov:wasAttributedTo <http://dbpedia.org/resource/Pablo_Picasso>;
   
   # Inferred from prov:invalidated
   prov:wasInvalidatedBy :swissair_Flight_111_crash;   
.
<http://dbpedia.org/resource/Pablo_Picasso> 
   a prov:Agent;
   foaf:depiction <http://upload.wikimedia.org/wikipedia/commons/9/98/Pablo_picasso_1.jpg>;
.
back to expanded properties
back to expanded properties
has super-properties
prov:influenced op
has domain
prov:Activity
has range
prov:Entity
has inverse
prov:wasInvalidatedBy
PROV-DM term
Invalidation
(33) Property: prov:influenced op
IRI:
http://www.w3.org/ns/prov#influenced
Influence is the capacity of an entity, activity, or agent to have an effect on the character, development, or behavior of another by means of
usage, start, end, generation, invalidation, communication, derivation, attribution, association, or delegation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix w3:   <http://example.com/w3/> .
@prefix tr:   <http://example.com/tech-report/> .
@prefix :     <http://example.com/> .
# prov:influenced is a top-level property that links any
# Entity, Activity, or Agent to any other 
# Entity, Activity, or Agent that it had an effect upon.
w3:Consortium 
   a prov:Agent;
   prov:influenced tr:WD-prov-dm-20111215;
.
has inverse
prov:wasInfluencedBy
has sub-properties
prov:generated
prov:invalidated
PROV-DM term
influence
(34) Property: prov:atLocation op
IRI:
http://www.w3.org/ns/prov#atLocation
A location can be an identifiable geographic place (ISO 19112), but it can also be a non-geographic place such as a directory, row, or column.
As such, there are numerous ways in which location can be expressed, such as by a coordinate, address, landmark, and so forth.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix sioc: <http://rdfs.org/sioc/ns#> .
@prefix :     <http://example.com/> .
# A Location can be a path or a geographical location.
:post9821 
   a prov:Entity, sioc:Post;   
   prov:wasGeneratedBy :publicationActivity1123;
   prov:atLocation     :more-crime-happens-in-cities;
   prov:qualifiedGeneration [
      a prov:Generation;
      prov:activity    :publicationActivity1123;
      prov:atTime     "2011-07-16T01:52:02Z"^^xsd:dateTime; 
      prov:atLocation <http://dbpedia.org/resource/Madrid>;
   ];
.
:publicationActivity1123      a prov:Activity .
back to expanded properties
back to qualified classes
:more-crime-happens-in-cities        a prov:Location .
<http://dbpedia.org/resource/Madrid> a prov:Location .
The Location of any resource.
This property has multiple RDFS domains to suit multiple OWL Profiles. See PROV-O OWL Profile.
has domain
prov:Activity or prov:Agent or prov:Entity or prov:InstantaneousEvent
has range
prov:Location
PROV-DM term
attribute-location
(35) Property: prov:generated op
IRI:
http://www.w3.org/ns/prov#generated
Generation is the completion of production of a new entity by an activity. This entity did not exist before generation and becomes available for
usage after this generation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:proteinDigestion
   a prov:Activity;
   prov:generated :peptideSample1;
.
:peptideSample1 a prov:Entity .
has super-properties
prov:influenced op
has domain
prov:Activity
has range
prov:Entity
has inverse
prov:wasGeneratedBy
PROV-DM term
Generation
