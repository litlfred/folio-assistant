---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-048-372-the-model
section_title: "The model"
section_number: 3.7.2
pages: 90-94
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
991 
Each construct is bound to one ArchiMate element type. Section 3.1 establishes the core of the 
992 
modelling language: the Application Component and Application Service element types, 
993 
together with the four structural relationships — Realises, Composes, Serves, Accesses — that 
994 
carry most of the model. Describing conformance and testing calls for a small, self-contained 
995 
extension to that core — two further element types and two further relationships, used only in 
996 
modelling behaviour and its evaluation — which this section introduces where they are needed 
997 
and summarises in Table 3.7.1. 
998 
 
999 
Table 3.7.1: Element and relationship types used for conformance and testing 
1000 
 
1001 
Type 
What it represents 
Example 
Application 
Interaction 
(element) 
Collective application behaviour 
performed by two or more 
components 
A transaction such as Provide and Register 
between a Document Source and a Document 
Repository 
Application 
Function 
(element) 
Internal automated behaviour of a 
component 
The document-registration behaviour that 
realises a registration service 
 
 
80 
Assignment 
(relationship) 
Allocates an active structure 
element to the behaviour it 
performs 
An actor performs the interaction it takes part in; 
a component performs its function 
Triggering 
(relationship) 
A causal "leads to" between 
behaviours 
A user's create-and-submit action triggers the 
transaction 
 
1002 
These constructs extend the section 3.1 palette for the purposes of conformance and testing. 
1003 
The additions are: 
1004 
• 
Application Interaction and Application Function — the two element types above; 
1005 
• 
Assignment and Triggering — the two relationship types above. (Realisation, already 
1006 
declared, also carries the country-to-reference mapping.) 
1007 
 
1008 
A further set — Application Interface, Business Process, Business Role, and 
1009 
Requirement/Constraint — is needed only by the UI-testing and explicit-criteria views and 
1010 
would be added when those views are adopted. The verdict of an evaluation is left implicit for 
1011 
now; in ArchiMate it would be recorded as an Assessment.  
1012 
 
1013 
Actors as Application Components 
1014 
 
1015 
An actor is an abstract information-processing role — for example a Document Source or a 
1016 
Patient Demographics Consumer. It names a set of responsibilities, independently of any 
1017 
product that fulfils them. An actor is modelled as an Application Component. A concrete 
1018 
system — a vendor product, a national service — is also an Application Component, bound to 
1019 
the actor by a realisation relationship: the system realises the actor. One system may realise 
1020 
several actors; one actor may be realised by many systems. 
1021 
 
1022 
Offered and required Application Services 
1023 
 
1024 
What an actor does is expressed as Application Services, related to the actor by two different 
1025 
relationship types according to whether the service is offered or required: 
1026 
• 
A service the actor offers is one it realises — a service it exposes, which in turn serves 
1027 
its consumers. This is the responder role in an interaction. 
1028 
• 
A service the actor requires is one that serves the actor — a capability it depends on. 
1029 
This is the initiator role in an interaction. 
1030 
A component thus realises the services it provides and is served by the services it consumes; it 
1031 
does not serve its own service. These offered and required services are the contractually 
1032 
meaningful surface of the actor — the externally observable behaviour against which 
1033 
conformance is declared. 
1034 
 
1035 
Each actor–service association additionally carries a support qualifier: the service may be 
1036 
mandatory or optional for that actor. A mandatory service is supported by any system claiming 
1037 
the actor; an optional service may be supported or not, and where it is, behaves as specified. 
1038 
This is independent of the offered/required direction, and corresponds to the required/optional 
1039 
(R/O) designation an IHE profile gives each transaction. ArchiMate has no native qualifier for it, 
1040 
 
 
81 
so it is recorded as a Property on the serving relationship, or — where normative and testable 
1041 
— as a motivation-layer Constraint. (Note the two senses of "required": a required service is 
1042 
one the actor depends on; a mandatory service is one whose support is obligatory. This 
1043 
document reserves offered/required for the direction and mandatory/optional for support.) 
1044 
 
1045 
Interactions and transactions 
1046 
 
1047 
The architecture models the exchange between two actors as an Application Interaction — 
1048 
collective application behaviour performed by two or more cooperating components. The 
1049 
interaction is the shared behaviour the initiator and responder jointly perform; each actor owns 
1050 
its side, and each is assigned to the interaction. (Application Interaction is a new element 
1051 
type being added to the reference architecture, together with the Assignment relationship it 
1052 
depends on — see 3.7.2 – The model, above.) 
1053 
 
1054 
A transaction — a fully specified machine-to-machine protocol exchange, with defined trigger 
1055 
events, message semantics, and expected actions — is one kind of Application Interaction: its 
1056 
precise, specifiable subset. The architecture works at the broader level of interaction, because 
1057 
the same service is often reached by interactions that are not machine-to-machine transactions 
1058 
(see Multiple access patterns to a single service) and by exchanges not yet specified to 
1059 
transaction level. Where an interaction is specified as a transaction, that specification may be 
1060 
supplied by a framework such as IHE rather than restated here (see Alignment with IHE 
1061 
profiles). 
1062 
 
1063 
Crucially, the interaction is not the unit of conformance. It describes an exchange — useful 
1064 
for documentation, sequence diagrams, and message specification — but a product is not 
1065 
certified as "conformant to an interaction" in isolation; it is certified as correctly playing an actor's 
1066 
role in that interaction. Figure 3.7.1 brings these pieces together. 
1067 
 
1068 
 
 
82 
1069 
Figure 3.7.1. A system realising an actor with its offered and required services, and the two actors 
1070 
connected by a transaction. The concrete system (Vendor EHR Product) realises the Document Source 
1071 
actor; the actor realises the service it offers (Provide Documents) and is served by the service it requires; 
1072 
and both actors are assigned to the Provide and Register [ITI-41] interaction, each owning its side. A 
1073 
component realises the services it provides and is served by the services it consumes — it does not serve 
1074 
its own service. 
1075 
 
1076 
Multiple access patterns to a single service 
1077 
 
1078 
The architecture treats the Application Service as the stable unit of capability and the 
1079 
Application Interaction as one way of reaching it. A single service can be reached through more 
1080 
than one interaction — a machine-to-machine transaction is one access pattern; a human-
1081 
initiated UI workflow is another — and both reach the same Application Service. This matters for 
1082 
conformance: conformance is asserted about the service the component provides, not about 
1083 
any one channel through which it is invoked. 
1084 
 
1085 
Conformance at the Application Component level 
1086 
 
1087 
Conformance is a statement about a system, expressed in terms of the actors it claims to 
1088 
realise and the options it supports: 
1089 
 
1090 
Conformance is the assertion that a given Application Component correctly realises the 
1091 
Application Services associated with a named actor role — as initiator, as responder, or 
1092 
both. 
1093 
 
1094 
It follows that: 
1095 
1. The unit of conformance is the Application Component (the system realising the 
1096 
actor), not the Application Interaction. 
1097 
 
 
83 
2. Conformance is role-directional. A system may conform as the responder without 
1098 
conforming as the initiator, and vice versa, because these are distinct services. 
1099 
3. Testing exercises one side of an interaction at a time. The component under test 
1100 
plays one actor role; a simulator — itself an Application Component realising the 
1101 
opposite actor — plays the other side. The test verifies that the system-under-test's 
1102 
services behave as specified. 
1103 
4. The support qualifier determines what is tested. Every mandatory service is tested; 
1104 
an optional service is tested only where the system declares support for it. 
1105 
 
1106 
 
1107 
Figure 3.7.2 shows this arrangement, including the alternative of driving the test through the 
1108 
system's user interface. 
1109 
1110 
Figure 3.7.2. Conformance testing view. The System Under Test realises one actor role (here Document 
1111 
Source, the initiator) while a Simulator realises the opposite actor (Document Repository); both are 
1112 
assigned to the Provide and Register [ITI-41] interaction, so the test exercises one side at a time. The 
1113 
same system can also be driven through its UI: a Test Operator who creates and submits a document 
1114 
through the Document Capture UI triggers the same transaction — verifying the system end-to-end, as a 
1115 
user would, rather than by invoking the machine interface directly. 
1116 
 
1117
