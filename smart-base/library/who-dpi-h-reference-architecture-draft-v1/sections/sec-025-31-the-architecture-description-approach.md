---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-025-31-the-architecture-description-approach
section_title: "The architecture description approach"
section_number: 3.1
pages: 52-59
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
26 
An architecture describes a system in terms of its elements, the relationships among them, and 
27 
the principles guiding its design and evolution. For architectures to be compared or assessed 
28 
against one another, they need a shared way of describing these things: agreed types of 
29 
elements, agreed types of relationship between them, and consistent rules for how they fit 
30 
together. Where such a shared description is absent, familiar terms such as “component”, 
31 
“service”, and “capability” can carry different meanings in different settings, which makes 
32 
systematic comparison difficult and limits the value of cross-country analysis. 
33 
 
 
42 
Rather than define a new vocabulary, the reference architecture is expressed using ArchiMate®, 
34 
an open modelling language for enterprise architecture maintained by The Open Group.2 
35 
ArchiMate® provides defined types of element — among them goals, capabilities, services, 
36 
application components, and data objects — and defined types of relationship between them, 
37 
organised across business, application, and technology layers — broadly aligning with the 
38 
architecture domains of established enterprise-architecture practice1 — together with motivation 
39 
elements that capture why an element matters and to whom. Drawing on an established language 
40 
brings several practical benefits. Each element has a defined type with clear meaning, so that a 
41 
capability, a component, and a service are not confused with one another. The architecture can 
42 
be authored, checked, and published using widely available tools. Because the language is 
43 
broadly adopted, descriptions expressed in it can be read and compared across organisations 
44 
and countries without translation. And the typed relationships make it possible to trace from goals, 
45 
through the capabilities that serve them, to the components that realise them — a property that 
46 
matters for governance and for assessing whether the architecture is delivering on its goals. 
47 
On that note, it is worth drawing out the following points, because they shape how the rest of the 
48 
chapter should be read: 
49 
• 
First, the architecture is more than a set of concepts: it is the way those concepts are 
50 
articulated. An element is defined in part by what it depends on and what depends on it, 
51 
and much of the value of the description comes from these relationships being made 
52 
explicit and kept consistent. Expressing the architecture in a formal language in this way 
53 
turns it into a set of criteria against which a candidate architecture can, in time, be checked 
54 
for completeness and consistency, and from which a country-specific architecture can be 
55 
derived rather than assembled from scratch.  
56 
• 
Second, only a subset of the available element and relationship types is used here — 
57 
those relevant to the scope of DPI-H. The remainder of the modelling language is not 
58 
required for this purpose and is not used. 
59 
The element types used in the reference architecture are summarised in table 3.1 below, each 
60 
with a short health-sector example. Fuller definitions, and the complete catalogue of elements 
61 
and relationships, are maintained with the models themselves — authored in Archi®15 and 
62 
published as navigable views — as described in Section 3.2. 
63 
 
64 
 
65 
 
66 
 
67 
 
68 
 
15 Archi is a free, open-source ArchiMate modelling tool, available under the MIT licence and maintained by Phillip Beauvoir and 
Jean-Baptiste Sarrodie at archimatetool.com. It runs on Windows, macOS, and Linux. Archi® is a registered trademark of Phillip 
Beauvoir; ArchiMate®, TOGAF®, and The Open Group® are registered trademarks of The Open Group. The reference architecture 
models are also exchangeable through The Open Group's ArchiMate Model Exchange File Format, so they may be opened and 
adapted in any conformant ArchiMate tool. 
 
 
43 
Table 3.1: The element types used in the DPI-H reference architecture and what they 
69 
represent 
70 
ArchiMate element 
Element type 
What it represents 
Example in the health 
sector 
 
Stakeholder 
An individual, role, or organisation 
with an interest in the architecture 
and its outcomes. 
A patient/ health service 
user, a health worker, a 
public-health agency, a 
regulator. 
 
Goal 
A statement of intent, direction or 
desired state. 
Universal access to a 
trusted personal health 
record. 
 
Outcome 
An achieved, and often 
measurable, result that signals 
progress towards a goal. 
A defined share of citizens 
issued with a verifiable 
health record. 
 
Value 
The benefit or utility a stakeholder 
gains from using a service, 
product, or capability. 
A clinician’s access to a 
complete clinical history at 
the point of care. 
 
Capability 
An ability the health system 
possesses or needs, expressed 
independently of how it is 
implemented. 
Medication prescribing and 
dispensing; clinical decision 
support. 
 
Application 
component 
A deployable, modular piece of 
software that provides 
functionality and holds data, 
exposing both through services. 
The Client Registry; a 
terminology service. 
 
Application service 
The functionality an application 
component exposes to its 
environment, as a unit of useful 
behaviour. 
Resolving and matching a 
person’s identity across 
systems. 
 
Data object 
A defined unit of structured data 
used or produced by an 
application component. 
A client identity record; a 
coded entry in the lifelong 
health record. 
 
Product 
A coherent offering that bundles 
services and data for use by 
stakeholders. 
A digital health wallet. 
 
71 
The relationships among these elements are themselves of defined types. Such as: 
72 
• 
Realises — a capability is realised by the components and services that provide it;  
73 
 
 
44 
• 
Composes — a component is composed of the functions and data objects it contains;  
74 
• 
Serves — a service serves the stakeholders and other elements that use it; and 
75 
• 
Accesses — a component accesses the data objects it reads or writes.  
76 
 
77 
Table 3.2: The relationship types used in the DPI-H reference architecture and what they 
78 
represent  
79 
ArchiMate relationship 
Relationship type 
What it represents 
 
Realises 
A capability is realised by the 
components and services that 
provide it 
 
Composes 
A component is composed of 
the functions and data objects it 
contains 
 
Serves 
A service serves the 
stakeholders and other 
elements that use it 
 
Accesses 
A component accesses the 
data objects it reads or writes 
 
80 
 
81 
It is this network of typed relationships — not the elements in isolation — that allows the 
82 
architecture to be traced from health goals to the infrastructure that supports them. 
83 
 
84 
 
 
45 
 
85 
Each lower element realises the one above 
Figure 3.1: Realisation relationships among architectural elements 
86 
 
87 
 
88 
The comprehensive list of standard relationships is below: 
89 
Table 3.3: List of standard relationships used in the reference architecture 
90 
Source 
Relationship Target 
Note 
Application 
Service 
Realisation 
Capability 
A service realises (provides) a capability 
Application 
Component 
Realisation 
Application Service 
A component realises a service it offers 
Application 
Function 
Realisation 
Application Service 
A function realises the service it provides 
Application 
Component 
Realisation 
Application 
Component 
A concrete system realises an actor (role) 
Outcome 
Realisation 
Goal 
An outcome signals achievement of a goal 
Application 
Service 
Serving 
Application 
Component 
A required service serves the component 
that consumes it 
Application 
Service 
Serving 
Stakeholder 
A service serves the stakeholders that use 
it 
 
 
46 
Capability 
Serving 
Goal 
A capability serves the goal it supports 
Goal 
Composition 
Goal 
A goal is composed of sub-goals 
Product 
Composition 
Application Service 
A product bundles the services it offers 
Product 
Composition 
Data Object 
A product bundles the data it carries 
Application 
Component 
Access 
Data Object 
A component reads/writes the data it holds 
Application 
Function 
Access 
Data Object 
A function reads/writes data objects 
Application 
Component 
Assignment 
Application 
Interaction 
An actor performs the interaction it 
participates in. 
Application 
Component 
Assignment 
Application 
Function 
A component performs its internal function  
Application 
Interaction 
Triggering 
Application 
Function 
A transaction triggers the function that 
handles it 
 
91 
3.2 Reading and navigating the reference 
92 
architecture 
93 
The reference architecture is expressed through complementary, linked outputs, each suited to a 
94 
different need. This guidance provides a stable narrative — the concepts, the structure, and the 
95 
reasoning behind them. The detailed model is maintained separately as a set of navigable views 
96 
that architects and implementers can explore directly, and that continue to evolve as the work 
97 
matures and as countries contribute experience. Simplified, non-technical views summarise each 
98 
health goal for readers who do not work with the modelling language. A linked online reference 
99 
brings these together and carries the model's evolving detail over time. The narrative explains 
100 
what the architecture means, what it is intended to achieve, and the value it offers; the model 
101 
provides the current, navigable detail. Readers are encouraged to treat the narrative as an entry 
102 
point and the model as the authoritative source for element-level detail. 
103 
Different readers come to the architecture with different concerns, and established practice 
104 
describes an architecture through views, each meaningful to a particular audience.16  
105 
• 
A reader concerned with health-system function — for example, which capabilities a given 
106 
goal depends on — will look first to the goal and capability views.  
107 
 
16 The Open Group, The TOGAF® Standard, 10th Edition. The Open Group, 2022. 
 
 
47 
• 
A reader concerned with realisation — how a capability is provided, by which components, 
108 
and over which data — will look to the layered views that connect capabilities to services, 
109 
components, and data.  
110 
• 
A reader concerned with motivation — who benefits, and why a goal matters — will look 
111 
to the views that relate stakeholders, goals, outcomes, and value.17  
112 
The same elements appear across these views: a registry referenced in one view is the same 
113 
registry referenced in another, so that the architecture presents a single, consistent picture rather 
114 
than a set of disconnected diagrams. 
115 
The model is also intended to be a practical starting point. Countries can adapt and adopt the 
116 
reference architecture to their own context rather than apply it unchanged; it offers a common 
117 
structure and vocabulary, not a prescription. To support this, the model is made available in a 
118 
form that national teams can take as a baseline and tailor — adjusting, extending, or setting aside 
119 
elements to reflect local priorities and constraints — so that a country begins from an established 
120 
structure rather than from a blank page. 
121 
Adopting the architecture also depends on factors that sit beyond its structural description, among 
122 
them the legal and institutional governance, workforce capabilities, organisational practices, and 
123 
change-management arrangements needed to put new systems into use. These considerations 
124 
are important to successful implementation and are addressed separately in the guidance rather 
125 
than within the architecture itself. 
126 
A note on reading the views: an element shown in a view represents a capability or a type of 
127 
component and the role it plays, not an instruction to procure a particular system. A country may 
128 
realise several elements within a single platform (one deployed software system), or one element 
129 
across several systems. The architecture describes what needs to be present and how the parts 
130 
relate and leaves the choice of implementation — including whether a function is held centrally, 
131 
federated across systems, or distributed — to the country. 
132 
 
17 The Open Group, ArchiMate® 3.2 Specification. The Open Group, 2022. 
 
 
48
