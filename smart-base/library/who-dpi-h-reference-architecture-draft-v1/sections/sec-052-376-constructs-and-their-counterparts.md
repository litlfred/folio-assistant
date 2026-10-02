---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-052-376-constructs-and-their-counterparts
section_title: "Constructs and their counterparts"
section_number: 3.7.6
pages: 97-99
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
1233 
The stable, conformance-bearing elements are the Application Service (capability) and the 
1234 
Application Component (system in an actor role); the Application Interaction is the 
1235 
descriptive connection between them, and where it is a transaction its specification may be 
1236 
deferred to IHE. 
1237 
 
1238 
Table 3.7.2: Architectural constructs and their ArchiMate and IHE counterparts 
1239 
 
1240 
Architectural 
concept 
ArchiMate 3.2 
element 
Bound by 
IHE counterpart 
Actor 
(abstract role) 
Application 
Component 
— 
Actor 
System 
realising an 
actor 
Application 
Component 
Realisation (system → 
actor) 
a product claiming an 
actor (IHE Integration 
Statement) 
Service an 
actor offers 
(responder) 
Application Service 
Realisation (actor → 
service); service then 
serves consumers 
responder side of a 
transaction 
Service an 
actor requires 
(initiator) 
Application Service 
Serving (service → 
actor) 
initiator side of a 
transaction 
 
 
87 
Support 
qualifier 
(mandatory / 
optional) 
Property on the 
serving relationship 
(or Constraint) 
— 
the R/O designation in 
the profile's 
actor/transaction table 
Interaction 
(transaction = 
one kind) 
Application 
Interaction 
Assignment (actors → 
interaction) 
transaction (machine-
to-machine subset) 
Conformance 
(per actor role) 
assertion over a 
component's 
services 
— 
conformance to an 
actor within a profile 
Simulator 
Application 
Component realising 
the opposite actor 
Realisation (simulator 
→ opposite actor) 
an IHE-supplied 
simulator / test tool 
Goal criterion 
Outcome 
Realisation (outcome → 
goal) 
— 
Country-to-
reference 
mapping 
Application 
Component (country) 
Realisation (country 
element → reference 
element) 
— 
 
1241 
 
1242 
 
1243 
 
1244 
 
1245 
 
1246 
 
1247 
 
 
88 
4. 
Implementing a National Digital 
1 
Health Architecture  
2 
 
3 
The preceding chapters describe a reference architecture. This chapter addresses how 
4 
countries move toward it: how to assess the starting point, sequence investment, specify the 
5 
profiles that make the architecture implementable, verify conformance and progress, and put in 
6 
place the people, skills, and financing that sustain it. It is written for the range of actors a 
7 
national effort depends on — the ministries and agencies that govern it, the architects and 
8 
modellers who design it, the implementers who build it, and the development partners who 
9 
support it — and it is explicit, throughout, about who is accountable for each of these 
10 
responsibilities. 
11
