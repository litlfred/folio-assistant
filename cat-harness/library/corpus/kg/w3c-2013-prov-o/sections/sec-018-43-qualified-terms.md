---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-018-43-qualified-terms
section_title: "Qualified Terms"
section_number: 4.3
pages: 33-50
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
The terms used to qualify the Starting Point and Expanded properties are discussed in Section 3.3.
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
(36) Class: prov:Influence
IRI:
http://www.w3.org/ns/prov#Influence
Influence is the capacity of an entity, activity, or agent to have an effect on the character, development, or behavior of another by means of
usage, start, end, generation, invalidation, communication, derivation, attribution, association, or delegation.
Example
back to qualified classes
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix my:   <http://example.com/ontology#> .
@prefix :     <http://example.com/> .
# Although a domain extension (e.g. ':wasConductedBy') is not defined by PROV-O,
# the relation between a surgery and an agent can still be qualified
# by reusing prov:Influence and one of its three subclasses 
# (depending on the type of influencer):
# AgentInfluence, EntityInfluence, and ActivityInfluence.
my:wasConductedBy rdfs:subPropertyOf prov:wasAssociatedWith .
:conductingSurgery_1
   a prov:Activity;
   
   # This unqualified influence is unknown in PROV, 
   # but would be a subproperty of wasAssociatedWith.
   my:wasConductedBy :bob;     
   
   # Even though PROV systems do not understand my:wasConductedBy, 
   prov:qualifiedAssociation [ 
      # they can recognize that the unknown relation 
      # is being qualified with a prov:hadRole.
      a prov:Association,     
        prov:AgentInfluence,   # Inferred
        prov:Influence;        # Inferred
      prov:agent   :bob;       # The object of my:wasConductedBy
      prov:hadRole my:surgeon;
   ];
.
:bob       a prov:Agent .
my:surgeon a prov:Role .
Because prov:Influence is a broad relation, its most specific subclasses (e.g. prov:Communication, prov:Delegation, prov:End,
prov:Revision, etc.) should be used when applicable.
An instance of prov:Influence provides additional descriptions about the binary prov:wasInfluencedBy relation from some influenced
Activity, Entity, or Agent to the influencing Activity, Entity, or Agent. For example, :stomach_ache prov:wasInfluencedBy :spoon;
prov:qualifiedInfluence [ a prov:Influence; prov:entity :spoon; :foo :bar ] . Because prov:Influence is a broad relation, the more specific
relations (Communication, Delegation, End, etc.) should be used when applicable.
described with properties:
prov:influencer op , prov:hadRole op , prov:hadActivity op
in range of
prov:qualifiedInfluence op
has subclasses
prov:ActivityInfluence , prov:AgentInfluence , prov:EntityInfluence
qualifies
prov:wasInfluencedBy op
PROV-DM term
influence
(37) Class: prov:EntityInfluence
IRI:
http://www.w3.org/ns/prov#EntityInfluence
EntityInfluence is the capacity of an entity to have an effect on the character, development, or behavior of another by means of usage, start,
end, derivation, or other.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:sortActivity
   a prov:Activity;
   prov:used :rawData;
   prov:qualifiedUsage [
      a prov:Usage, 
        prov:EntityInfluence; ## Instances of Start, End, Usage, Derivation, and Invalidation
      prov:entity  :datasetA; ## qualify the influenced of an Entity (cited by prov:entity).
      prov:hadRole :inputToBeSorted;
   ];
   prov:generated :sortedData;
.
back to qualified classes
back to qualified classes
:rawData    a prov:Entity .
:sortedData a prov:Entity .
EntityInfluence provides additional descriptions of an Entity's binary influence upon any other kind of resource. Instances of
EntityInfluence use the prov:entity property to cite the influencing Entity.
It is not recommended that the type EntityInfluence be asserted without also asserting one of its more specific subclasses.
is subclass of
prov:Influence
described with properties:
prov:entity op
prov:hadRole op , prov:influencer op , prov:hadActivity op
has subclasses
prov:End , prov:Start , prov:Usage , prov:Derivation
(38) Class: prov:Usage
IRI:
http://www.w3.org/ns/prov#Usage
Usage is the beginning of utilizing an entity by an activity. Before usage, the activity had not begun to utilize this entity and could not have been
affected by the entity.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:sortActivity 
   a prov:Activity;
   prov:startedAtTime  "2011-07-16T01:52:02Z"^^xsd:dateTime; 
   prov:qualifiedUsage [
      a prov:Usage;
      prov:entity    :datasetA;         ## The entity used by the prov:Usage
      prov:hadRole   :inputToBeSorted;  ## the role of the entity in this prov:Usage        
   ];
   prov:generated :datasetB;
.
:datasetA        a prov:Entity .
:datasetB        a prov:Entity .
:inputToBeSorted a prov:Role .
## The role of :datasetA cannot be expressed using only starting-point terms:
:sortActivity
   a prov:Activity;
   prov:startedAtTime     "2011-07-16T01:52:02Z"^^xsd:dateTime;
   prov:used       :datasetA;
   prov:generated  :datasetB;
.
An instance of prov:Usage provides additional descriptions about the binary prov:used relation from some prov:Activity to an prov:Entity
that it used. For example, :keynote prov:used :podium; prov:qualifiedUsage [ a prov:Usage; prov:entity :podium; :foo :bar ].
is subclass of
prov:InstantaneousEvent , prov:EntityInfluence
described with properties:
prov:atTime dp , prov:entity op
in range of
prov:hadUsage op prov:qualifiedUsage op
qualifies
prov:used op
PROV-DM term
Usage
(39) Class: prov:Start
IRI:
http://www.w3.org/ns/prov#Start
back to qualified classes
Start is when an activity is deemed to have been started by an entity, known as trigger. The activity did not exist before its start. Any usage,
generation, or invalidation involving an activity follows the activity's start. A start may refer to a trigger entity that set off the activity, or to an
activity, known as starter, that generated the trigger.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
### Start can be used to qualify wasStartedBy with time and location information.
### In this example, a consistency checking activity is started by the update of a data record.
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
.
:syntax_checker   a   prov:SoftwareAgent .
An instance of prov:Start provides additional descriptions about the binary prov:wasStartedBy relation from some started prov:Activity to
an prov:Entity that started it. For example, :foot_race prov:wasStartedBy :bang; prov:qualifiedStart [ a prov:Start; prov:entity :bang; :foo
:bar; prov:atTime '2012-03-09T08:05:08-05:00'^^xsd:dateTime ] .
is subclass of
prov:InstantaneousEvent , prov:EntityInfluence
described with properties:
prov:hadActivity op
prov:atTime dp , prov:entity op
in range of
prov:qualifiedStart op
qualifies
prov:wasStartedBy op
PROV-DM term
Start
(40) Class: prov:End
IRI:
http://www.w3.org/ns/prov#End
End is when an activity is deemed to have been ended by an entity, known as trigger. The activity no longer exists after its end. Any usage,
generation, or invalidation involving an activity precedes the activity's end. An end may refer to a trigger entity that terminated the activity, or to
an activity, known as ender that generated the trigger.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
### End can be used to qualify wasEndedBy with time and location information.
### In this example, an experiment is stopped because an intermediate inconsitent resul.
:experiment 
   a prov:Activity;
   prov:wasEndedBy :inconsistentResult;
   prov:qualifiedEnd [
      a prov:End;
      prov:entity       :inconsistentResult;
      prov:atTime       "2011-07-16T01:52:02Z"^^xsd:dateTime;
back to qualified classes
      prov:atLocation   :scienceLab_003;
      prov:hadActivity  :analyse_intermediate_result ; 
   ];
.
   
:inconsistentResult a prov:Entity .
### An implicit process analyzes the intermediate result to confirm its expected consistency
analyse_intermediate_result
   a   prov:Activity ;
   prov:startedAtTime   "2011-07-15T12:52:02Z"^^xsd:dateTime;
   prov:endedAtTime     "2011-07-16T01:52:02Z"^^xsd:dateTime;
.
An instance of prov:End provides additional descriptions about the binary prov:wasEndedBy relation from some ended prov:Activity to an
prov:Entity that ended it. For example, :ball_game prov:wasEndedBy :buzzer; prov:qualifiedEnd [ a prov:End; prov:entity :buzzer; :foo
:bar; prov:atTime '2012-03-09T08:05:08-05:00'^^xsd:dateTime ].
is subclass of
prov:InstantaneousEvent , prov:EntityInfluence
described with properties:
prov:hadActivity op
prov:atTime dp , prov:entity op
in range of
prov:qualifiedEnd op
qualifies
prov:wasEndedBy op
PROV-DM term
End
(41) Class: prov:Derivation
IRI:
http://www.w3.org/ns/prov#Derivation
A derivation is a transformation of an entity into another, an update of an entity resulting in a new one, or the construction of a new entity based
on a pre-existing entity.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
# The simplest (and least detailed) form of derivation.
:bar_chart 
   a prov:Entity;
   prov:wasDerivedFrom :aggregatedByRegions;  
.
# The simple form can be accompanied by a qualified form:
# which provides more details about how :bar_chart was 
# derived from :aggregatedRegions.
:bar_chart
   a prov:Entity;
   
   prov:wasDerivedFrom :aggregatedByRegions;  
   prov:qualifiedDerivation [                  
      a prov:Derivation;                      
      prov:entity      :aggregatedByRegions;  
                          
      # Derivations can cite the influencing Activity in doing the derivation.
      prov:hadActivity   :create_the_chart;
      # They can also cite the Usage and Generation that the Activity 
      # performed to generate :bar_chart.
      prov:hadUsage      :data_loading;
      prov:hadGeneration :plot_the_chart;
   ];
.
### The process during which the chart was created, from loading the data to the software, to process the data and plot the cha
### Additional metadata was recorded, like when it started (before the usage), ended (after the generation of the chart) and who
:create_the_chart 
   a prov:Activity;
   prov:wasAssociatedWith :derek;
   prov:startedAtTime "2012-04-03T00:00:00Z"^^xsd:dateTime;
   prov:endedAtTime "2012-04-03T00:00:10Z"^^xsd:dateTime;
.
### The final chart was plotted
back to qualified classes
:plot_the_chart
   a prov:Generation, prov:InstantaneousEvent;
   prov:atTime "2012-04-03T00:00:01Z"^^xsd:dateTime;
.
### The data was getting used to create the chart
:data_loading
   a prov:Usage;
   prov:atTime "2012-04-03T00:00:00Z"^^xsd:dateTime;
.
The more specific forms of prov:Derivation (i.e., prov:Revision, prov:Quotation, prov:PrimarySource) should be asserted if they apply.
An instance of prov:Derivation provides additional descriptions about the binary prov:wasDerivedFrom relation from some derived
prov:Entity to another prov:Entity from which it was derived. For example, :chewed_bubble_gum prov:wasDerivedFrom
:unwrapped_bubble_gum; prov:qualifiedDerivation [ a prov:Derivation; prov:entity :unwrapped_bubble_gum; :foo :bar ].
is subclass of
prov:EntityInfluence
described with properties:
prov:hadUsage op , prov:hadGeneration op
prov:hadActivity op
prov:entity op
in range of
prov:qualifiedDerivation op
has subclasses
prov:Revision , prov:PrimarySource , prov:Quotation
qualifies
prov:wasDerivedFrom op
PROV-DM term
Derivation
(42) Class: prov:PrimarySource
IRI:
http://www.w3.org/ns/prov#PrimarySource
A primary source for a topic refers to something produced by some agent with direct experience and knowledge about the topic, at the time of
the topic's study, without benefit from hindsight. Because of the directness of primary sources, they 'speak for themselves' in ways that cannot
be captured through the filter of secondary sources. As such, it is important for secondary sources to reference those primary sources from
which they were derived, so that their reliability can be investigated. A primary source relation is a particular case of derivation of secondary
materials from their primary sources. It is recognized that the determination of primary sources can be up to interpretation, and should be done
according to conventions accepted within the application's domain.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:myPost 
   a prov:Entity;
   prov:hadPrimarySource :donQuixote;
   prov:qualifiedPrimarySource [
      a prov:PrimarySource;
      prov:entity :donQuixote;
      :confidenceValue "6"^^xsd:integer;
      rdfs:comment """Not sure if Don Quixote was the original source, 
                      so asserting a confidence value of 6 out of 10.""";
   ];
.
:donQuixote a prov:Entity.
An instance of prov:PrimarySource provides additional descriptions about the binary prov:hadPrimarySource relation from some
secondary 
prov:Entity 
to 
an 
earlier, 
primary 
prov:Entity. 
For 
example, 
:blog 
prov:hadPrimarySource 
:newsArticle;
prov:qualifiedPrimarySource [ a prov:PrimarySource; prov:entity :newsArticle; :foo :bar ] .
is subclass of
prov:Derivation
described with properties:
prov:hadGeneration op , prov:hadUsage op
back to qualified classes
back to qualified classes
in range of
prov:qualifiedPrimarySource op
qualifies
prov:hadPrimarySource op
PROV-DM term
primary-source
(43) Class: prov:Quotation
IRI:
http://www.w3.org/ns/prov#Quotation
A quotation is the repeat of (some or all of) an entity, such as text or image, by someone who may or may not be its original author. Quotation is
a particular case of derivation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
:dagstuhl-quote
   a prov:Entity;
   prov:value   "why would people record and share provenance in the first place?";
   prov:wasQuotedFrom <http://purl.org/twc/page/thoughts-from-the-dagstuhl-workshop>;
   prov:qualifiedQuotation [
      a prov:Quotation;
      prov:entity     <http://purl.org/twc/page/thoughts-from-the-dagstuhl-workshop>;
      ex:fromSection 2;
   ];
   prov:wasAttributedTo <http://data.semanticweb.org/person/luc-moreau>;
.
<http://purl.org/twc/page/thoughts-from-the-dagstuhl-workshop> 
   a prov:Entity;
   prov:wasAttributedTo <http://data.semanticweb.org/person/paul-groth>;
.
<http://data.semanticweb.org/person/luc-moreau> a prov:Person, prov:Agent .
<http://data.semanticweb.org/person/paul-groth> a prov:Person, prov:Agent .
An instance of prov:Quotation provides additional descriptions about the binary prov:wasQuotedFrom relation from some taken
prov:Entity from an earlier, larger prov:Entity. For example, :here_is_looking_at_you_kid prov:wasQuotedFrom :casablanca_script;
prov:qualifiedQuotation [ a prov:Quotation; prov:entity :casablanca_script; :foo :bar ].
is subclass of
prov:Derivation
described with properties:
prov:hadGeneration op , prov:hadUsage op
in range of
prov:qualifiedQuotation op
qualifies
prov:wasQuotedFrom op
PROV-DM term
quotation
(44) Class: prov:Revision
IRI:
http://www.w3.org/ns/prov#Revision
A revision is a derivation for which the resulting entity is a revised version of some original. The implication here is that the resulting entity
contains substantial content from the original. Revision is a particular case of derivation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
:draft2 
back to qualified classes
   a prov:Entity;
   prov:wasRevisionOf    :draft1;
   prov:qualifiedRevision [
      a prov:Revision;
      prov:entity        :draft1;
      ex:peerReviewed     false;
   ];
   prov:wasAssociatedWith :edward;
   prov:qualifiedAssociation [
      a prov:Association;
      prov:agent          :edward;
      prov:hadRole        :editor;
   ];
.
:draft1 a prov:Entity .
:edward 
   a prov:Person, prov:Agent;
.
An instance of prov:Revision provides additional descriptions about the binary prov:wasRevisionOf relation from some newer prov:Entity
to an earlier prov:Entity. For example, :draft_2 prov:wasRevisionOf :draft_1; prov:qualifiedRevision [ a prov:Revision; prov:entity :draft_1;
:foo :bar ].
is subclass of
prov:Derivation
described with properties:
prov:hadGeneration op , prov:hadUsage op
in range of
prov:qualifiedRevision op
qualifies
prov:wasRevisionOf op
PROV-DM term
revision
(45) Class: prov:ActivityInfluence
IRI:
http://www.w3.org/ns/prov#ActivityInfluence
ActivitiyInfluence is the capacity of an activity to have an effect on the character, development, or behavior of another by means of generation,
invalidation, communication, or other.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:bar_chart 
   a prov:Entity;
   prov:wasGeneratedBy      :illustrating;
   prov:qualifiedGeneration :making-bar-chart;
. 
:making-bar-chart
   a prov:Generation, 
     prov:ActivityInfluence;  ## Instances of Generation, Invalidation and Communication qualify
   prov:activity :illustrating; ## the influence of an Activity (cited by prov:activity)
   rdfs:comment "Ended up with bar chart as line chart looked ugly."@en;
.
:illustrating a prov:Activity .
It is not recommended that the type ActivityInfluence be asserted without also asserting one of its more specific subclasses.
ActivityInfluence provides additional descriptions of an Activity's binary influence upon any other kind of resource. Instances of
ActivityInfluence use the prov:activity property to cite the influencing Activity.
is subclass of
prov:Influence
described with properties:
prov:activity op
prov:hadRole op , prov:influencer op , prov:hadActivity op
has subclasses
back to qualified classes
back to qualified classes
prov:Generation , prov:Invalidation , prov:Communication
(46) Class: prov:Generation
IRI:
http://www.w3.org/ns/prov#Generation
Generation is the completion of production of a new entity by an activity. This entity did not exist before generation and becomes available for
usage after this generation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix bbc:  <http://www.bbc.co.uk/> .
@prefix eg:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
:bbcNews2012-04-03 
   a prov:Entity, eg:DailyNews;
   rdfs:comment """The BBC news home page on 2012-04-03 contained a reference 
                   to a given news item, but the BBC news home page on 
                   the next day did not.""";
   prov:wasGeneratedBy :publishingActivity;
   prov:qualifiedGeneration [
      a prov:Generation, prov:InstantaneousEvent;
      prov:atTime "2012-04-03T00:00:01Z"^^xsd:dateTime;
      prov:activity :publishingActivity;
   ];
   prov:qualifiedInvalidation [
      a prov:Invalidation, prov:InstantaneousEvent;
      prov:atTime "2012-04-03T23:59:59Z"^^xsd:dateTime;
   ];
.
:publishingActivity 
   a prov:Activity;
.
An instance of prov:Generation provides additional descriptions about the binary prov:wasGeneratedBy relation from a generated
prov:Entity to the prov:Activity that generated it. For example, :cake prov:wasGeneratedBy :baking; prov:qualifiedGeneration [ a
prov:Generation; prov:activity :baking; :foo :bar ].
is subclass of
prov:InstantaneousEvent , prov:ActivityInfluence
described with properties:
prov:activity op , prov:atTime dp
in range of
prov:hadGeneration op prov:qualifiedGeneration op
qualifies
prov:wasGeneratedBy op
PROV-DM term
Generation
(47) Class: prov:Communication
IRI:
http://www.w3.org/ns/prov#Communication
Communication is the exchange of an entity by two activities, one activity using the entity generated by the other.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
:writing-celebrity-gossip 
   a prov:Activity;
   prov:wasInformedBy          :voicemail-interception;
   prov:qualifiedCommunication :informing-the-journalist;
.
:informing-the-journalist 
   a prov:Communication;
   prov:activity   :voicemail-interception;
   ex:mediaType "email";
back to qualified classes
.
:voicemail-interception a prov:Activity .
An instance of prov:Communication provides additional descriptions about the binary prov:wasInformedBy relation from an informed
prov:Activity 
to 
the 
prov:Activity 
that 
informed 
it. 
For 
example, 
:you_jumping_off_bridge 
prov:wasInformedBy
:everyone_else_jumping_off_bridge; 
prov:qualifiedCommunication 
[ 
a 
prov:Communication; 
prov:activity
:everyone_else_jumping_off_bridge; :foo :bar ].
is subclass of
prov:ActivityInfluence
described with properties:
prov:activity op
in range of
prov:qualifiedCommunication op
qualifies
prov:wasInformedBy op
PROV-DM term
Communication
(48) Class: prov:Invalidation
IRI:
http://www.w3.org/ns/prov#Invalidation
Invalidation is the start of the destruction, cessation, or expiry of an existing entity by an activity. The entity is no longer available for use (or
further invalidation) after invalidation. Any generation or usage of an entity precedes its invalidation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix wgs:  <http://www.w3.org/2003/01/geo/wgs84_pos#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix :     <http://example.com/> .
:the-Painter 
   a prov:Entity, :Painting;
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
<http://purl.org/twc/location/Swissair-Flight-111-crash>
   a prov:Location;
   wgs:lat   44.409167;
   wgs:long -63.973611;
.
<http://dbpedia.org/resource/Pablo_Picasso> 
   a prov:Agent;
   foaf:depiction <http://upload.wikimedia.org/wikipedia/commons/9/98/Pablo_picasso_1.jpg>;
.
:swissair_Flight_111_crash 
   a prov:Activity;
   prov:used          <http://dbpedia.org/resource/Swissair_Flight_111>;
   prov:startedAtTime "1998-09-02T01:31:00Z"^^xsd:dateTime;
   prov:atLocation    <http://dbpedia.org/resource/Atlantic_ocean>;
.
An instance of prov:Invalidation provides additional descriptions about the binary prov:wasInvalidatedBy relation from an invalidated
prov:Entity to the prov:Activity that invalidated it. For example, :uncracked_egg prov:wasInvalidatedBy :baking; prov:qualifiedInvalidation [
a prov:Invalidation; prov:activity :baking; :foo :bar ].
is subclass of
prov:InstantaneousEvent , prov:ActivityInfluence
described with properties:
prov:activity op , prov:atTime dp
in range of
prov:qualifiedInvalidation op
back to qualified classes
back to qualified classes
qualifies
prov:wasInvalidatedBy op
PROV-DM term
Invalidation
(49) Class: prov:AgentInfluence
IRI:
http://www.w3.org/ns/prov#AgentInfluence
AgentInfluence is the capacity of an agent to have an effect on the character, development, or behavior of another by means of attribution,
association, delegation, or other.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:illustrating
    a prov:Activity; 
    prov:wasAssociatedWith :derek;
    prov:qualifiedAssociation [
       a prov:Association, 
         prov:AgentInfluence; ## Instances of Generation, Invalidation and Communication qualify
       prov:agent   :derek;   ## the influence of an Agent (cited by prov:agent)
       prov:hadRole :illustrationist
    ];
.
:derek a prov:Person, prov:Agent, prov:Entity .
:illustratonist a prov:Role .
AgentInfluence provides additional descriptions of an Agent's binary influence upon any other kind of resource. Instances of
AgentInfluence use the prov:agent property to cite the influencing Agent.
It is not recommended that the type AgentInfluence be asserted without also asserting one of its more specific subclasses.
is subclass of
prov:Influence
described with properties:
prov:agent op
prov:hadRole op , prov:influencer op , prov:hadActivity op
has subclasses
prov:Delegation , prov:Association , prov:Attribution
(50) Class: prov:Attribution
IRI:
http://www.w3.org/ns/prov#Attribution
Attribution is the ascribing of an entity to an agent. When an entity e is attributed to agent ag, entity e was generated by some unspecified
activity that in turn was associated to agent ag. Thus, this relation is useful when the activity is not known, or irrelevant.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
<http://dbpedia.org/resource/Fallingwater>
   a prov:Entity;
   prov:wasAttributedTo <http://dbpedia.org/resource/Edgar_J._Kaufmann>,
                        <http://dbpedia.org/resource/Frank_Lloyd_Wright>,
                        :western-Pennsylvania-Conservancy;
   prov:qualifiedAttribution [
      a prov:Attribution;
      prov:agent <http://dbpedia.org/resource/Edgar_J._Kaufmann>;
      ex:hadRole :owner;
   ];
   prov:qualifiedAttribution [
      a prov:Attribution;
      prov:agent <http://dbpedia.org/resource/Frank_Lloyd_Wright>;
      ex:hadRole :architect;
   ];
   prov:qualifiedAttribution [
back to qualified classes
      a prov:Attribution;
      prov:agent :western-Pennsylvania-Conservancy;
      ex:hadRole :conserver;
   ];
.
<http://dbpedia.org/resource/Edgar_J._Kaufmann>  a prov:Person, prov:Agent .
<http://dbpedia.org/resource/Frank_Lloyd_Wright> a prov:Person, prov:Agent .
:western-Pennsylvania-Conservancy a prov:Organization, prov:Agent . 
An instance of prov:Attribution provides additional descriptions about the binary prov:wasAttributedTo relation from an prov:Entity to some
prov:Agent that had some responsible for it. For example, :cake prov:wasAttributedTo :baker; prov:qualifiedAttribution [ a prov:Attribution;
prov:entity :baker; :foo :bar ].
is subclass of
prov:AgentInfluence
described with properties:
prov:agent op
in range of
prov:qualifiedAttribution op
qualifies
prov:wasAttributedTo op
PROV-DM term
attribution
(51) Class: prov:Association
IRI:
http://www.w3.org/ns/prov#Association
An activity association is an assignment of responsibility to an agent for an activity, indicating that the agent had a role in the activity. It further
allows for a plan to be specified, which is the plan intended by the agent to achieve some goals in the context of this activity.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:illustrating
    a prov:Activity; 
    prov:wasAssociatedWith :derek, 
                           :steve;
    prov:qualifiedAssociation [
        a prov:Association;
        prov:agent   :derek;
        prov:hadRole :illustrationist;
    ];
    prov:qualifiedAssociation [
        a prov:Association;
        prov:agent   :steve;
        prov:hadRole :stylist;
        prov:hadPlan :style-guide;
        rdfs:comment "Steve helped Derek conform with the publisher's style guide."@en;
    ];
.
:derek a prov:Person, prov:Agent, prov:Entity .
:steve a prov:Person, prov:Agent, prov:Entity .
:illustratonist a prov:Role .
:stylist        a prov:Role .
:style-guide a prov:Plan, prov:Entity .
An instance of prov:Association provides additional descriptions about the binary prov:wasAssociatedWith relation from an prov:Activity to
some prov:Agent that had some responsiblity for it. For example, :baking prov:wasAssociatedWith :baker; prov:qualifiedAssociation [ a
prov:Association; prov:agent :baker; :foo :bar ].
is subclass of
prov:AgentInfluence
described with properties:
prov:hadPlan op
prov:hadRole op
prov:agent op
back to qualified classes
back to qualified classes
in range of
prov:qualifiedAssociation op
qualifies
prov:wasAssociatedWith op
PROV-DM term
Association
(52) Class: prov:Plan
IRI:
http://www.w3.org/ns/prov#Plan
A plan is an entity that represents a set of actions or steps intended by one or more agents to achieve some goals.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:illustrating 
   a prov:Activity;
   prov:qualifiedAssociation :steve-checking-style-guide;
.
:steve-checking-style-guide
   a prov:Association;
   prov:agent   :steve;
   prov:hadPlan :style-guide;
   rdfs:comment "Steve followed the publisher's style guide"@en;
. 
:style-guide
   a prov:Plan, prov:Entity;
   rdfs:comment "Use blue graphs for positive spin, red for negative"@en;
.
There exist no prescriptive requirement on the nature of plans, their representation, the actions or steps they consist of, or their intended
goals. Since plans may evolve over time, it may become necessary to track their provenance, so plans themselves are entities.
Representing the plan explicitly in the provenance can be useful for various tasks: for example, to validate the execution as represented
in the provenance record, to manage expectation failures, or to provide explanations.
is subclass of
prov:Entity
in range of
prov:hadPlan op
PROV-DM term
Association
(53) Class: prov:Delegation
IRI:
http://www.w3.org/ns/prov#Delegation
Delegation is the assignment of authority and responsibility to an agent (by itself or by another agent) to carry out a specific activity as a
delegate or representative, while the agent it acts on behalf of retains some responsibility for the outcome of the delegated work. For example,
a student acted on behalf of his supervisor, who acted on behalf of the department chair, who acted on behalf of the university; all those agents
are responsible in some way for the activity that took place but we do not say explicitly who bears responsibility and to what degree.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix ex:   <http://example.com/vocab#> .
@prefix :     <http://example.com/> .
### In this example, Frank (an insurance agent) acts on behalf of his company for performing
### a policy sale
 
:policySale
   a prov:Activity;
   prov:wasAssociatedWith :insuranceAgent_Frank;
.
:insuranceAgent_Frank
   a prov:Person;
   prov:actedOnBehalfOf :insuranceCompany_A;
   prov:qualifiedDelegation [
      a prov:Delegation;
back to qualified classes
back to qualified classes
      prov:agent        :insuranceCompany_A;
      ex:rewardScheme   "commission";
      prov:hadActivity  :policySale ;
   ];
.
An instance of prov:Delegation provides additional descriptions about the binary prov:actedOnBehalfOf relation from a performing
prov:Agent to some prov:Agent for whom it was performed. For example, :mixing prov:wasAssociatedWith :toddler . :toddler
prov:actedOnBehalfOf :mother; prov:qualifiedDelegation [ a prov:Delegation; prov:entity :mother; :foo :bar ].
is subclass of
prov:AgentInfluence
described with properties:
prov:hadActivity op
prov:agent op
in range of
prov:qualifiedDelegation op
qualifies
prov:actedOnBehalfOf op
PROV-DM term
delegation
(54) Class: prov:InstantaneousEvent
IRI:
http://www.w3.org/ns/prov#InstantaneousEvent
The PROV data model is implicitly based on a notion of instantaneous events (or just events), that mark transitions in the world. Events include
generation, usage, or invalidation of entities, as well as starting or ending of activities. This notion of event is not first-class in the data model,
but it is useful for explaining its other concepts and its semantics.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix bbc:  <http://www.bbc.co.uk/> .
@prefix :     <http://example.com/> .
:bbcNews2012-04-03 
   a prov:Entity, :DailyNews;
   rdfs:comment """The BBC news home page on 2012-04-03 contained 
                   a reference to a given news item, but the BBC news 
                   home page on the next day did not.""";
   prov:qualifiedGeneration [
      a prov:Generation, prov:InstantaneousEvent;
      prov:atTime "2012-04-03T00:00:01Z"^^xsd:dateTime;
   ];
   prov:qualifiedInvalidation [
      a prov:Invalidation, prov:InstantaneousEvent;
      prov:atTime "2012-04-03T23:59:59Z"^^xsd:dateTime;
   ];
.
An instantaneous event, or event for short, happens in the world and marks a change in the world, in its activities and in its entities. The
term 'event' is commonly used in process algebra with a similar meaning. Events represent communications or interactions; they are
assumed to be atomic and instantaneous.
described with properties:
prov:atTime dp
prov:hadRole op , prov:atLocation op
has subclasses
prov:Generation , prov:Start , prov:Invalidation , prov:End , prov:Usage
(55) Class: prov:Role
IRI:
http://www.w3.org/ns/prov#Role
A role is the function of an entity or agent with respect to an activity, in the context of a usage, generation, invalidation, association, start, and
end.
Example
back to qualified properties
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:divideActivity 
   a prov:Activity;   
   prov:used :variableA, :variableB;
   prov:qualifiedUsage [
      a prov:Usage;
      prov:entity  :variableA;
      prov:hadRole :dividend;          
   ];
   prov:qualifiedUsage [
      a prov:Usage;
      prov:entity  :variableB;
      prov:hadRole :divisor;          
   ];
   prov:generated :result_112234;
.
:variableA 
   a prov:Entity;
   prov:value 10;
.
:variableB 
   a prov:Entity;
   prov:value 2;
.
:dividend a prov:Role.
:divisor  a prov:Role.
:result_112234 
   a prov:Entity;
   prov:value 5;
   prov:wasGeneratedBy :divideActivity;
.
in range of
prov:hadRole op
PROV-DM term
attribute-role
(56) Property: prov:wasInfluencedBy op
IRI:
http://www.w3.org/ns/prov#wasInfluencedBy
Influence is the capacity of an entity, activity, or agent to have an effect on the character, development, or behavior of another by means of
usage, start, end, generation, invalidation, communication, derivation, attribution, association, or delegation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:illustrationActivity 
   a prov:Activity;
   prov:used              :aggregatedByRegions;
   prov:wasAssociatedWith :derek;
   prov:wasInformedBy     :aggregationActivity;
.
:illustrationActivity 
   a prov:Activity;
   prov:wasInfluencedBy :aggregatedByRegions, # prov:wasInfluencedBy is a superproperty of
                        :derek,               # many of the direct binary
                        :aggregationActivity; # PROV-O properties.
.
:aggregationActivity a prov:Activity .  
:derek               a prov:Agent .
:aggregatedByRegions a prov:Entity .
Because prov:wasInfluencedBy is a broad relation, its more specific subproperties (e.g. prov:wasInformedBy, prov:actedOnBehalfOf,
prov:wasEndedBy, etc.) should be used when applicable.
This property has multiple RDFS domains to suit multiple OWL Profiles. See PROV-O OWL Profile.
has domain
prov:Activity or prov:Agent or prov:Entity
has range
back to qualified properties
prov:Activity or prov:Agent or prov:Entity
has sub-properties
prov:hadMember
prov:wasAttributedTo
prov:wasAssociatedWith
prov:wasGeneratedBy
prov:wasDerivedFrom
prov:wasInvalidatedBy
prov:used
prov:actedOnBehalfOf
prov:wasInformedBy
prov:wasStartedBy
prov:wasEndedBy
can be qualified with
prov:qualifiedInfluence op
prov:Influence
PROV-DM term
influence
(57) Property: prov:qualifiedInfluence op
IRI:
http://www.w3.org/ns/prov#qualifiedInfluence
Influence is the capacity of an entity, activity, or agent to have an effect on the character, development, or behavior of another by means of
usage, start, end, generation, invalidation, communication, derivation, attribution, association, or delegation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix my:   <http://example.com/ontology#> .
@prefix :     <http://example.com/> .
# Although domain extension 'my:wasConductedBy' is not defined by PROV-O,
# the relation between a surgery and an agent can still be qualified
# by reusing prov:Influence and one of its three subclasses:
# AgentInfluence, EntityInfluence, and ActivityInfluence
# (depending on the type of the influencing object).
:conductingSurgery_1
   a prov:Activity;
   # This unqualified influence is unknown in PROV;
   # it would be a subproperty of prov:wasAssociatedWith.
   my:wasConductedBy    :bob;
   prov:wasInfluencedBy :bob;  
   prov:qualifiedInfluence [   
      # Even though PROV systems do not understand my:wasConductedBy, 
      # they will at least understand that :bob influenced the 
      # surgery in some way.
      a prov:Influence;      # Inferred
      prov:agent   :bob;     # The object of my:wasConductedBy
      # Domain extension properties may be used to describe the
      # influences that an Entity, Activity, or Agent
      # have upon another Entity, Activity, or Agent.
      my:degree .72;
   ];
.
:bob a prov:Agent .
Because prov:qualifiedInfluence is a broad relation, the more specific relations (qualifiedCommunication, qualifiedDelegation, qualifiedEnd,
etc.) should be used when applicable.
has domain
prov:Activity or prov:Agent or prov:Entity
has range
prov:Influence
has sub-properties
prov:qualifiedAssociation
prov:qualifiedRevision
prov:qualifiedInvalidation
prov:qualifiedPrimarySource
prov:qualifiedDerivation
prov:qualifiedGeneration
prov:qualifiedUsage
prov:qualifiedQuotation
prov:qualifiedStart
back to qualified properties
back to qualified properties
prov:qualifiedAttribution
prov:qualifiedEnd
prov:qualifiedCommunication
prov:qualifiedDelegation
qualifies
prov:wasInfluencedBy op
PROV-DM term
influence
(58) Property: prov:qualifiedGeneration op
IRI:
http://www.w3.org/ns/prov#qualifiedGeneration
Generation is the completion of production of a new entity by an activity. This entity did not exist before generation and becomes available for
usage after this generation.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:bar_chart
   a prov:Entity;
   prov:wasGeneratedBy :illustrating;
   prov:qualifiedGeneration [
      a prov:Generation;
      prov:activity :illustrating;
      rdfs:comment "Ended up with bar chart as line chart looked ugly."@en;
   ];
.
:illustrating a prov:Activity .
If this Activity prov:generated Entity :e, then it can qualify how it performed the Generation using prov:qualifiedGeneration [ a prov:Generation;
prov:entity :e; :foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Entity
has range
prov:Generation
qualifies
prov:wasGeneratedBy op
PROV-DM term
Generation
(59) Property: prov:qualifiedDerivation op
IRI:
http://www.w3.org/ns/prov#qualifiedDerivation
A derivation is a transformation of an entity into another, an update of an entity resulting in a new one, or the construction of a new entity based
on a pre-existing entity.
Example
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix :     <http://example.com/> .
:bar_chart
   a prov:Entity;
   prov:wasDerivedFrom :aggregatedByRegions;
   prov:qualifiedDerivation [
      a prov:Derivation;
      prov:entity :aggregatedByRegions; 
      
      ## More details about the activity underpinning the derivation        
      prov:hadGeneration :chat_plotting; 
      prov:hadActivity   :chart_creation ;
   ];
.
back to qualified properties
### The process of creating the chart, from loading the data, to process it, and plot it to end users
:chart_creation
    a    prov:Activity ;
    prov:wasAssociatedWith :derek;
    prov:startedAtTime  "2011-07-16T01:52:02Z"^^xsd:dateTime;
    prov:endedAtTime "2011-07-16T03:00:02Z"^^xsd:dateTime;
.
#### Now the chart is plotted
:chat_plotting
    a    prov:Generation ;
    prov:atTime    "2011-07-16T03:00:02Z"^^xsd:dateTime;
.
If this Entity prov:wasDerivedFrom Entity :e, then it can qualify how it was derived using prov:qualifiedDerivation [ a prov:Derivation; prov:entity
:e; :foo :bar ].
has super-properties
prov:qualifiedInfluence op
has domain
prov:Entity
has range
prov:Derivation
qualifies
prov:wasDerivedFrom op
PROV-DM term
Derivation
