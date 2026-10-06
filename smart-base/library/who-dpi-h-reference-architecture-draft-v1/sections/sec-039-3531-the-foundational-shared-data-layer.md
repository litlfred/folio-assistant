---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-039-3531-the-foundational-shared-data-layer
section_title: "The foundational shared data layer"
section_number: 3.5.3.1
pages: 78-81
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
633 
The foundational shared data layer holds the components on which the rest of the ecosystem 
634 
depends. At its core are the metadata registries and the lifelong health record that make up 
635 
REDDHI — Resilient Essential Data and Digital Health Infrastructure — the essential, resilient 
636 
foundation that a country would do well to prioritise for sustainable digital health transformation: 
637 
• Client Registry for Health — the authoritative index of the people a health system serves, 
638 
supporting a unique health identity, identity reconciliation, and record linkage across 
639 
systems. 
640 
• Health Facility Registry — the authoritative list of health facilities and service-delivery 
641 
points, integrating with a national geospatial registry where one exists. 
642 
• Health Workforce Registry — the authoritative record of health workers, their roles, 
643 
credentials, and facility assignments. 
644 
• Product Registry — the authoritative source for health products and their attributes, 
645 
supporting supply-chain, regulatory, and clinical use. 
646 
• Lifelong Health Record — the governed, person-centred capability that maintains a 
647 
longitudinal record of an individual's health and healthcare encounters across providers, 
648 
programmes, and time. It is defined to allow centralised, federated, or hybrid 
649 
implementation, rather than implying a single central store. person-centred that  
650 
 
651 
The Client Registry, Health Facility Registry, Health Workforce Registry, and Lifelong Health 
652 
Record are closely interdependent. A way to identify a person and a governed place to hold their 
653 
health information gain their full value when each entry can be attributed to a known person, 
654 
recorded by a known health worker, at a known facility — hence the facility and workforce 
655 
registries supply this provenance. The Product Registry connects in turn, as products recur across 
656 
almost every health goal. Countries adopt and strengthen these registries in the sequence that 
657 
fits their priorities and resources, rather than treating any one configuration as a precondition for 
658 
the others. 
659 
The shared data layer also includes two components that give data its meaning and structure. 
660 
Both are foundational to quality interoperability, and countries typically adopt them as the 
661 
foundation matures: 
662 
• Terminology Service — manages the codes, value sets, and vocabularies that define what 
663 
data means, supporting semantic interoperability across systems. 
664 
• Logical Information Model Repository (LIMR) — governs how data is structured and 
665 
contextualised, providing a nationally governed anchor that keeps information models 
666 
consistent and constrains uncontrolled local variation. 
667 
Because the distinction between these two components is a frequent source of confusion, the 
668 
table below compares them across the dimensions that matter in practice. 
669 
 
670 
 
671 
 
672 
 
 
68 
A Comparative view of the LIMR and TS 
673 
 
674 
The Logical Information Model Repository (LIMR) and the Terminology Service (TS) are distinct 
675 
but tightly coupled components necessary for semantic governance. Both address different 
676 
dimensions of the same underlying problem: how to ensure that health data means the same 
677 
thing wherever it is created, exchanged, or used. Whilst they are interdependent, the boundary 
678 
is not always intuitive; and whilst one controls syntax (the structure and hierarchy of the 
679 
language), the other controls semantics (meaning). The table below draws the distinction: 
680 
 
681 
 
682 
Table 3.5: Comparison of the Logical Information Model Repository and the Terminology Service  
683 
 
684 
  
Logical Information Model Repository 
(LIMR) 
Terminology Service (TS) 
Core question 
answered 
 
The fundamental 
problem each 
component exists 
to solve  
How should health data be structured — 
what fields exist, what constraints apply, and 
how do they relate to each other? 
 
Example: "What is a blood pressure reading 
— what data elements does it contain, what 
are their types, which are mandatory, and 
what value set should be used for the 
method of measurement?" 
What do the coded values in those fields 
mean — what concept does a code 
represent, and are codes equivalent 
across systems? 
Example: "What does code 271649006 
mean — it is the SNOMED CT concept 
for Systolic blood pressure — and how 
does it relate to the LOINC code 8480-6 
for the same concept?" 
What it manages 
 
The artefacts each 
component stores, 
governs, and 
publishes  
Logical 
information 
models: 
structural 
definitions of clinical and administrative data 
objects (e.g., blood pressure measurement, 
medication order, referral request), including 
the context in which the data is captured or 
used, 
data 
elements, 
data 
types, 
cardinalities, relationships, and bindings to 
terminology value sets. The definitions are 
precise and unambiguous, leaving no room 
for reinterpretation by consuming systems. 
Example: For a blood pressure observation, 
the LIMR holds the logical model specifying 
that the record must contain a systolic value 
(decimal, mmHg, mandatory), a diastolic 
value (decimal, mmHg, mandatory), a 
measurement method (coded, optional, 
bound to the Blood Pressure Method value 
set), and a body position at time of 
measurement (coded, optional). It defines 
the structural rules — not what the codes 
mean. 
Code systems, value sets, and concept 
maps: the coded vocabularies and their 
meanings (e.g., SNOMED CT, ICD-11, 
LOINC, 
ATC), 
including 
concept 
properties, hierarchical relationships, and 
mappings between code systems. 
 
Example: For the same blood pressure 
observation, the TS holds the Blood 
Pressure Method value set — containing 
codes such as SNOMED 37931006 
(Auscultation) and 113011001 
(Palpation) with their definitions and 
relationships — and the concept 
271649006 (Systolic blood pressure), 
including its LOINC equivalent (8480-6) 
via a concept map. It defines what the 
codes mean — not how the record is 
structured. 
 
 
 
69 
What it defines 
about data 
elements 
 
The specific 
properties each 
component 
controls — what it 
can assert about a 
field that the other 
component cannot  
Which elements are mandatory or optional, 
their data types, cardinalities (how many 
times an element may or must appear), and 
their relationships to other elements. A 
logical model specifies the rules of data 
structure independently of what the values in 
those structures mean. 
Example: The blood pressure model states 
that systolic value is mandatory (cardinality 
1..1), diastolic is mandatory (1..1), 
measurement method is optional (0..1), and 
only one primary blood pressure reading is 
permitted per encounter. These rules are 
entirely about structure — the LIMR does 
not define what "auscultation" means or 
which methods are clinically valid. 
What concepts mean and what values are 
permitted — not whether a field is 
mandatory or how many times it appears. 
The TS has no concept of cardinality or 
element optionality; it only defines the 
meaning and permitted values within a 
field, once the LIMR has established that 
the field exists and is required. 
Example: The TS knows that the Blood 
Pressure Method value set contains 
permitted codes (e.g., auscultation, 
palpation, oscillometric), and it knows 
what each code means and how they 
relate to one another in the SNOMED CT 
hierarchy. It has no knowledge of 
whether recording the method is required 
— that rule lives in the LIMR. 
When it is used 
 
Whether the 
component is 
consulted at design 
time (when building 
systems), at 
runtime (when 
systems are 
operating), or both  
Primarily a design-time asset: consulted 
when building or procuring systems, defining 
data 
specifications, 
authoring 
FHIR 
implementation guides, or generating data 
entry forms. May also be invoked at runtime 
for validation. 
 
Example: A developer building a blood 
pressure data entry screen consults the 
LIMR to determine which fields to include, 
which to mark as required, and which value 
set to bind to the measurement method 
drop-down. This happens once, at build time 
— not each time a clinician records a 
reading. 
Both design-time and runtime: consulted 
when defining value set bindings, and 
invoked at runtime whenever a system 
needs to validate a code, expand a value 
set, look up a concept, or translate 
between code systems. 
Example: Each time a clinician opens the 
blood pressure entry screen, the system 
calls the TS to expand the Blood 
Pressure Method value set and populate 
the drop-down options. When the 
clinician saves the record, the system 
calls the TS again to validate that the 
selected code exists in the value set 
before committing the data. Both calls 
happen at runtime, for every consultation. 
Relationship to 
each other 
 
How each 
component 
depends on, feeds 
into, and is 
affected by the 
other — including 
the direction of that 
dependency  
The LIMR declares value set bindings — 
specifying which terminology value set 
applies to a given data element. It depends 
on the TS to hold and serve those value sets. 
The dependency is bidirectional: when a 
value 
set 
in 
the 
TS 
is 
deprecated, 
restructured, or its concepts change, the 
logical models that bind to it are affected and 
may require review and update. Changes in 
the TS should therefore trigger impact 
analysis in the LIMR. 
The TS holds the value sets that the LIMR 
references. It does not define data 
structure; it provides the meaning of the 
coded 
values 
that 
populate 
data 
structures. Because logical models bind to 
terminology value sets, changes in the TS 
propagate into the LIMR — a terminology 
update may require corresponding model 
updates, meaning the two components 
share 
a 
joint 
change 
management 
obligation. 
Risk if absent 
 
The specific data 
quality or 
interoperability 
failure that results 
Semantic 
fragmentation: 
every 
system 
defines its own data structures for the same 
clinical concepts, making data incomparable 
across systems even when the same codes 
are used. 
 
Semantic drift: the same coded value is 
interpreted 
differently 
by 
different 
systems, or systems maintain inconsistent 
local copies of code systems, making 
aggregation and comparison unreliable. 
 
 
70 
if each component 
is not in place  
Example: Facility A records blood pressure 
as a single combined string ("120/80 
mmHg"). Facility B records systolic and 
diastolic as separate numeric fields. Both 
may correctly use SNOMED codes for the 
measurement method, but the data cannot 
be aggregated for hypertension surveillance 
because the underlying structures are 
incompatible. 
Example: Facility A uses the local code 
"AUSC" for auscultatory measurement; 
Facility B uses SNOMED 37931006. 
Both systems record blood pressure with 
identically structured fields, but their 
measurement method values cannot be 
compared or aggregated in national 
reporting without a concept map to 
reconcile the two — a map the TS would 
have managed centrally if it were in place 
Primary users 
The roles and 
functions that 
interact directly 
with each 
component in the 
course of their 
work  
Clinical informaticians, health data architects, 
standards bodies, implementation guide 
authors, procurement officers specifying 
what systems must support. 
Clinical systems (at design time and 
runtime), analytics platforms, clinical 
decision support engines, interoperability 
services, and any system that captures or 
exchanges coded clinical data. 
Standards it uses 
or produces 
 
The technical 
specifications and 
content standards 
each component is 
built on or 
expected to 
publish  
 
(Examples of 
standards provided 
are not exhaustive) 
FHIR StructureDefinitions, Implementation 
Guides, and Profiles; openEHR archetypes 
and templates; SMART Guidelines data 
dictionaries. 
Example: The blood pressure model might 
be published as a FHIR StructureDefinition 
profiling the FHIR Observation resource, 
constraining it to the national blood pressure 
specification — or as an openEHR 
archetype (openEHR-EHR-
OBSERVATION.blood_pressure.v2) for 
implementations using that platform. 
FHIR 
CodeSystem, 
ValueSet, 
and 
ConceptMap 
resources; 
FHIR 
Terminology Service operations ($lookup, 
$validate-code, 
$expand, 
$translate); 
SNOMED CT, ICD-11, LOINC, ATC, ICF, 
ICPC. 
Example: The Blood Pressure Method 
value set would be published as a FHIR 
ValueSet resource and served via a 
standard API call such as GET 
/ValueSet/blood-pressure-
method/$expand, returning the full list of 
permitted codes. A concept map 
translating local auscultation codes to 
SNOMED 37931006 would be published 
as a FHIR ConceptMap resource and 
invoked via $translate. 
Practical analogy 
A non-technical 
comparison to 
make the 
distinction 
intuitively clear for 
policy and 
leadership 
audiences  
The blueprint for a data form: defines what 
fields the form contains, their order, their 
rules, and which vocabulary list each field 
draws from. 
The vocabulary list itself: defines what 
each term on a drop-down list means, 
which other terms are equivalent, and how 
terms translate across languages or 
standards. 
 
685 
 
686
