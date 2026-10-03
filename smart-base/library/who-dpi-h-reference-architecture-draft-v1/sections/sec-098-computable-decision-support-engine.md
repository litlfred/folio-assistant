---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-098-computable-decision-support-engine
section_title: "Computable Decision Support Engine"
section_number: null
pages: 191-202
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
• 
Supplier Registry 
• 
Benefits Package Registry 
• 
Health Management Information System 
• 
Public Health Surveillance Platform 
 
 
 
181 
DPI-H Reference Architecture  |  Component Articulation 
1 
Computable Decision Support Engine 
2 
Business Services Layer  ·  Clinical and Operational Decision Support 
3 
 
4 
ARCHITECTURE 
PLACEMENT 
AND SCOPE 
The Computable Decision Support Engine (CDSE) provides decision support across 
multiple health system domains — including clinical care, supply chain 
management, public health surveillance, and health financing — reflecting a scope 
that extends beyond point-of-care clinical use cases. It sits as a DPI-H component 
within the business services layer. There is no equivalent component in the 
OpenHIE architecture specification. Given the significant data quality, longitudinal 
record completeness, and knowledge engineering capacity it requires, the CDSE 
should be treated as a progressive capability rather than a foundational requirement, 
particularly for countries at earlier stages of digital health maturity. 
 
5 
1  WHAT IT IS 
 
6 
The Computable Decision Support Engine is a governed, shared application component that delivers 
7 
context-appropriate, evidence-based guidance at the point of clinical decision-making by applying 
8 
computable clinical rules, algorithms, and logic to person-specific data drawn from the Lifelong Health 
9 
Record and other relevant sources. It generates recommendations, alerts, reminders, risk assessments, 
10 
and care pathway guidance that support safer, more consistent, and more effective health service delivery 
11 
across the digital health ecosystem. The CDSE operates on computable representations of clinical 
12 
guidelines, care protocols, and public health policies — including those expressed in the WHO SMART 
13 
Guidelines and national clinical pathways — resolving clinical concepts against the Terminology Service 
14 
and validating input data against logical information models published in the LIMR to ensure that decision 
15 
logic operates on consistently coded and structured data regardless of the contributing source system. 
16 
A defining architectural characteristic of the CDSE is the separation of decision logic from the applications 
17 
that consume it. Clinical rules are authored, governed, and updated through the LIMR, while point-of-care 
18 
systems invoke the CDSE through standardised interfaces such as CDS Hooks and SMART on FHIR, and 
19 
present its outputs within their own workflows. This separation enables governed, system-wide updating of 
20 
clinical guidance without requiring changes to every consuming application, and ensures that the most 
21 
current, validated evidence is consistently available across all points of care without each application 
22 
independently maintaining and updating the clinical knowledge it embeds. 
23 
The CDSE is structured around three interdependent elements that parallel the components of any decision 
24 
support system. The knowledge base — sourced from and governed through the LIMR — provides the 
25 
computable rules, guidelines, algorithms, and care pathway logic that the engine evaluates. The inference 
26 
engine is the CDSE itself: the computational service that retrieves patient and contextual data, evaluates it 
27 
against the applicable rules, and produces a structured output. The communication mechanism is the 
28 
interface through which the output is delivered to the consuming system; in standards-based 
29 
implementations this is expressed through CDS Hooks or SMART on FHIR integration patterns embedded 
30 
within point-of-care clinical applications. 
31 
The CDSE does not replace clinical judgement. It supports it, by making the relevant evidence base 
32 
consistently available through digital infrastructure at the point of care, applied to the individual's specific 
33 
circumstances, and communicated transparently in a way that the health worker can evaluate, accept, or 
34 
override with documented justification. 
35 
 
36 
 
 
182 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
37 
Clinical guidelines represent the distillation of the best available evidence about how health conditions 
38 
should be prevented, diagnosed, and treated. The gap between what clinical guidelines recommend and 
39 
what is consistently delivered at the point of care remains one of the most persistent and consequential 
40 
failures of health systems. Health workers are expected to remain current with a growing body of clinical 
41 
guidance, apply it accurately to the specific circumstances of each patient encounter, and do so under 
42 
conditions of time pressure, incomplete information, and competing demands. In most health systems, the 
43 
tools available to support this are a printed or downloaded guideline document, an occasional training 
44 
session, and the health worker's own memory and judgement. The result is significant variation in care 
45 
quality, preventable adverse events, and systematic underuse of effective interventions. 
46 
This gap is not primarily a problem of health worker competence or motivation. It reflects a structural 
47 
problem of how clinical knowledge is produced, distributed, and made available at the moment of decision. 
48 
Narrative clinical guidelines are lengthy and written for a general clinical audience rather than for the specific 
49 
context of each encounter. A community health worker conducting a maternal health visit, a clinician 
50 
managing a chronic condition in a busy primary care setting, and a pharmacist verifying a prescription each 
51 
need different subsets of the same evidence base, presented in a way that is immediately actionable within 
52 
their specific workflow. Narrative guidelines alone are not well suited to providing this level of contextual, 
53 
role-specific guidance consistently and at scale. 
54 
The challenge is compounded by how clinical knowledge is typically embedded in health systems. Where 
55 
digital tools exist, clinical guidance is frequently hard-coded into individual point-of-care applications rather 
56 
than governed centrally as a shared resource. When a guideline is updated, every application that contains 
57 
a hard-coded version must be independently updated — a process that is slow, expensive, and frequently 
58 
incomplete. The consequence is a health system in which different facilities, programmes, and systems 
59 
simultaneously operate on different versions of the same clinical guidance, with no mechanism for ensuring 
60 
consistency or currency across the ecosystem. 
61 
A governed CDSE addresses these failures by: 
62 
• 
Delivering consistent application of evidence-based guidance across the health system, so that the 
63 
same clinical rules, thresholds, and recommendations are available at every point of care 
64 
regardless of the application used, the facility visited, or the health worker consulted.  
65 
• 
Enabling timely ecosystem-wide updating of clinical guidance, so that when a guideline is revised 
66 
the updated logic is available to all consuming applications without requiring each to be individually 
67 
updated. 
68 
• 
Separating clinical knowledge governance from application development, enabling clinical experts 
69 
and guideline developers to govern the content of decision support logic independently of the 
70 
technical teams that build and maintain point-of-care applications. 
71 
• 
Surfacing context-sensitive guidance at the point of care, delivering recommendations tailored to 
72 
the individual's specific clinical circumstances — drawing on their longitudinal health record, current 
73 
medications, allergies, risk factors, and care plan — rather than generic population-level 
74 
recommendations. 
75 
• 
Operationalising WHO SMART Guidelines and national clinical pathways, providing the runtime 
76 
infrastructure through which computable representations of clinical guidelines are deployed into 
77 
digital health systems and executed at the point of care, bridging the gap between guideline 
78 
development and consistent guideline application at scale 
79 
• 
Supporting medication safety through systematic checking of drug interactions, allergy 
80 
contraindications, dosage ranges, and duplicate therapies at the point of prescribing, reducing the 
81 
risk of preventable adverse drug events. 
82 
• 
Reducing the cognitive burden on health workers, surfacing the right clinical information at the right 
83 
moment rather than requiring health workers to navigate lengthy guidelines, track updates, and 
84 
reconcile guidance from multiple sources during a clinical encounter. 
85 
 
 
183 
• 
Supporting equity in care quality, ensuring the same evidence-based guidance becomes available 
86 
to a health worker in a remote community health post as to a clinician in a well-resourced urban 
87 
facility, reducing the care quality disparities that arise when access to clinical knowledge is 
88 
unevenly distributed. 
89 
The effective deployment of the CDSE is contingent on data quality, longitudinal record completeness, and 
90 
knowledge engineering capacity that cannot be assumed in all settings. Countries should assess their 
91 
readiness across these dimensions before treating the CDSE as an immediate implementation priority. Its 
92 
value compounds as foundational data infrastructure matures; its full potential is unrealised where the data 
93 
it evaluates is incomplete or inconsistently coded. 
94 
 
95 
3  CORE ATTRIBUTES 
 
96 
– Clinical knowledge management. Authoring, importing, versioning, and lifecycle management of 
97 
computable decision logic — including clinical rules, scoring algorithms, care pathway definitions, 
98 
and protocol-driven recommendations — stored in standards-based representation formats with full 
99 
version history, lifecycle states, and traceability of changes over time. This capability ensures that 
100 
clinical knowledge is governed as a shared, versioned asset rather than embedded in individual 
101 
applications. 
102 
– Standards-based knowledge representation. Support for internationally recognised knowledge 
103 
representation standards, including HL7 FHIR Clinical Reasoning resources, CDS Hooks, Clinical 
104 
Quality Language, and WHO SMART Guidelines L3 computable content, enabling decision logic to 
105 
be authored in portable, interoperable formats that can be shared, adapted, and reused across 
106 
systems and jurisdictions. 
107 
– Context-aware decision support invocation. Reception of requests containing person-specific 
108 
clinical data, encounter context, and workflow triggers, and return of recommendations, alerts, risk 
109 
assessments, or suggested actions tailored to the specific clinical scenario presented, drawing on 
110 
the individual's longitudinal health record rather than on generic population-level rules. 
111 
– Clinical workflow integration. Invocation at configurable points within clinical workflows — 
112 
including at order entry, during prescribing, at encounter start, and at discharge — through 
113 
standardised integration mechanisms such as CDS Hooks, enabling the CDSE to be embedded 
114 
within point-of-care applications without requiring bespoke integration for each consuming system. 
115 
– Terminology and information model alignment. Resolution of clinical concepts referenced in 
116 
decision logic against the Terminology Service, and validation of input data against logical 
117 
information models published in the LIMR, ensuring that decision logic operates on consistently 
118 
coded and structured data regardless of the source system that contributed it and that 
119 
recommendations are based on correctly interpreted clinical information. 
120 
– Medication safety support. Systematic checking of drug-drug interactions, allergy and 
121 
contraindication alerts, dosage range validation, and duplicate therapy detection at the point of 
122 
prescribing, drawing on up-to-date pharmaceutical knowledge bases to reduce the risk of 
123 
preventable adverse drug events. 
124 
– Risk assessment and screening. Computation of clinical risk scores, screening tool results, and 
125 
eligibility assessments based on published and validated scoring algorithms, enabling consistent 
126 
identification of individuals who require further investigation, targeted intervention, or enrolment in 
127 
specific health programmes. 
128 
– Care plan and pathway guidance. Generation of recommended care plans and next-step actions 
129 
based on longitudinal patient data and defined care pathways, supporting protocol-driven care 
130 
delivery for chronic disease management, antenatal care, child health, immunisation, and other 
131 
programme areas where consistent adherence to evidence-based pathways is a determinant of 
132 
care quality. 
133 
– Alert prioritisation and management. Configurable alert severity levels, prioritisation logic, and 
134 
suppression rules that ensure clinically significant recommendations are surfaced prominently 
135 
 
 
184 
while lower-priority or previously acknowledged alerts are managed appropriately, reducing alert 
136 
fatigue without compromising patient safety. 
137 
– Override and justification capture. Mechanisms for authorised users to override or dismiss a 
138 
recommendation with a documented reason, supporting clinical autonomy while maintaining 
139 
accountability for departures from evidence-based guidance and enabling retrospective analysis of 
140 
override patterns as a quality improvement feedback mechanism. 
141 
– Transparency and explainability. Provision, alongside each recommendation, of a human-
142 
readable explanation of the reasoning applied — including the rules evaluated, the data inputs 
143 
considered, and the evidence or guideline source referenced — enabling clinicians to understand, 
144 
evaluate, and exercise informed judgement about the guidance they receive. 
145 
– Knowledge base governance and update. A governed update process for clinical rules and 
146 
knowledge bases, including clinical review and approval workflows, staged rollout, version 
147 
management, consuming system notification, and rollback capability, ensuring that changes to 
148 
decision logic are clinically validated, transparently communicated, and do not introduce 
149 
unintended consequences into the care workflows that depend on them. 
150 
– Cross-domain decision support. Application of decision logic beyond clinical use cases to 
151 
include operational decision support for supply chain management, public health surveillance, and 
152 
health financing, using the same shared CDSE infrastructure as clinical decision support. 
153 
 
154 
4  HOW IT CONNECTS 
 
155 
The CDSE depends on foundational health components for its data inputs and knowledge sources, and 
156 
serves point-of-care and operational systems that consume its outputs. 
157 
The Lifelong Health Record is the CDSE's primary source of person-specific clinical data. At the moment a 
158 
decision support request is triggered — typically by a clinical action in a point-of-care system — the CDSE 
159 
queries and retrieves the relevant clinical context from the LHR: the patient's active diagnoses, current 
160 
medications, allergies, recent observations, and care history. The CDSE does not hold its own copy of 
161 
person-level clinical data; it accesses the LHR in context and at the moment of decision. Clinical actions 
162 
that result from CDSE guidance are recorded back into the LHR by the point-of-care system, closing the 
163 
loop between decision support and the longitudinal record. 
164 
The Logical Information Model Repository is the CDSE's source of computable knowledge artefacts — 
165 
clinical rules, care pathway logic, and decision algorithms maintained as governed, version-controlled 
166 
content that the CDSE retrieves at evaluation time, ensuring it applies current, approved guidance rather 
167 
than locally cached versions. It also provides the structural definitions against which the CDSE validates 
168 
input data at the point of invocation; decision logic is authored with reference to specific data elements as 
169 
defined in the LIMR, and the CDSE depends on the LIMR to ensure that data retrieved from the LHR and 
170 
other sources conforms to the expected structures before being evaluated against clinical rules. The CDSE 
171 
subscribes to change notifications from the LIMR so that updates to either computable knowledge or 
172 
information models are incorporated through a governed process that preserves the integrity of dependent 
173 
decision logic. 
174 
The Terminology Service ensures semantic consistency between the codes used in clinical rules and the 
175 
codes present in patient data. It provides the coded vocabularies against which the CDSE resolves clinical 
176 
concepts referenced in its decision logic, ensuring that those concepts are consistently interpreted 
177 
regardless of how the underlying data was recorded in the contributing source system. Without this 
178 
alignment, the same clinical concept recorded with different codes in different systems could be evaluated 
179 
inconsistently, producing unreliable or contradictory recommendations. The CDSE subscribes to update 
180 
notifications from the Terminology Service to ensure its knowledge base remains aligned with current 
181 
terminology versions. 
182 
The Client Registry provides the verified person identity that the CDSE uses to request person-specific 
183 
clinical data from the LHR. The CDSE relies on the Client Registry identifier to ensure that the clinical data 
184 
 
 
185 
it retrieves and evaluates belongs to the correct individual and that recommendations are generated in the 
185 
context of that person's verified longitudinal record. 
186 
The Health Workforce Registry provides the authoritative references for the professional role and 
187 
credentials of the requesting health worker, supporting role-based filtering of recommendations so that 
188 
guidance is calibrated to the scope of practice of the receiving clinician.  
189 
The Health Facility Registry provides information about the type, level, and service delivery capacity of the 
190 
facility at which an encounter is taking place, which may be relevant to the appropriateness of specific 
191 
recommendations — including referral guidance or recommendations for diagnostic procedures that require 
192 
specific equipment. These recommendations need to be contextualised by knowledge of what the current 
193 
facility can provide, and the Health Facility Registry provides the authoritative reference for this 
194 
contextualization. 
195 
The HMIS and the CDSE observe a critical architectural boundary. The CDSE evaluates rules at individual 
196 
patient level; the HMIS evaluates data at population and cohort level. Aggregate override patterns captured 
197 
by the CDSE can be reported through the HMIS to support quality improvement and guideline governance. 
198 
Population-level patterns detected through the HMIS — such as shifts in treatment outcomes or screening 
199 
coverage — may trigger the review of decision support logic to ensure it remains current. 
200 
The Public Health Surveillance Platform and the CDSE interact where clinical decision support logic 
201 
incorporates public health intelligence, such as outbreak alerts, antimicrobial resistance patterns, or 
202 
environmental health signals that should modify clinical recommendations at the point of care. The CDSE 
203 
can also support automated case classification and risk scoring logic that feeds back into the surveillance 
204 
platform's functions. 
205 
The WHO SMART Guidelines framework, while not a DPI-H component in its own right, provides the 
206 
computable clinical content that the CDSE operationalises. L3 SMART Guidelines content, expressed in 
207 
standards-based representation formats, provides decision logic for different health areas. The governance 
208 
processes through which that content is reviewed, adapted, and approved at the national level — typically 
209 
expressed through the LIMR's knowledge governance workflow — are a prerequisite for the CDSE to 
210 
function as a trusted source of evidence-based guidance across the health system. 
211 
 
212 
5  FUNCTIONAL REQUIREMENTS 
 
213 
There is no equivalent component in the OpenHIE architecture specification. Requirements draw on the 
214 
WHO SMART Guidelines framework (L3 computable artefacts), HL7 FHIR Clinical Reasoning module 
215 
($apply operation, PlanDefinition, ActivityDefinition, CQL), CDS Hooks specification, SMART on FHIR, and 
216 
the FDA definition of Clinical Decision Support as a software function providing knowledge and person-
217 
specific information intelligently filtered at appropriate times (FDA Digital Health Center of Excellence). 
218 
Given the significant data quality, longitudinal record completeness, and knowledge engineering capacity 
219 
the CDSE requires, several capabilities are marked Recommended rather than Required, reflecting the 
220 
progressive nature of this component and the varying levels of digital health maturity across country 
221 
contexts. 
222 
 
223 
# 
Business process 
Functional requirement 
Status 
KNOWLEDGE MANAGEMENT 
1 
Knowledge 
management 
Rule and logic management.  The CDSE shall support 
the 
authoring, 
import, 
versioning, 
and 
lifecycle 
management of computable decision logic — including 
clinical 
rules, 
scoring 
algorithms, 
care 
pathway 
definitions, and protocol-driven recommendations — 
stored in standards-based formats including CQL, 
PlanDefinition, ActivityDefinition, and WHO SMART 
Required 
 
 
186 
# 
Business process 
Functional requirement 
Status 
Guidelines L3 computable content, with full version 
history, lifecycle states, and traceability of changes over 
time. 
2 
Knowledge 
management 
Standards-based knowledge representation.  The 
CDSE shall support internationally recognised knowledge 
representation standards, including HL7 FHIR Clinical 
Reasoning resources, CDS Hooks, Clinical Quality 
Language, and WHO SMART Guidelines L3 content, 
enabling decision logic to be authored in portable, 
interoperable formats that can be shared, adapted, and 
reused across systems and jurisdictions. 
Required 
3 
Knowledge 
management 
Knowledge base governance and update workflow.  
The CDSE shall support a governed update process for 
clinical rules and knowledge bases, including clinical 
review and approval workflows, staged rollout, version 
management, consuming system notification, and 
rollback capability, ensuring that changes to decision 
logic 
are 
clinically 
validated, 
transparently 
communicated, and do not introduce unintended 
consequences. 
Required 
4 
Knowledge 
management 
Versioning and backward compatibility.  The CDSE 
shall maintain full version history of all decision logic 
artefacts, support concurrent active versions where 
required, and enforce defined policies on backward 
compatibility, version pinning for consuming systems, 
and the conditions under which a breaking change to 
decision logic may be deployed. 
Required 
5 
Knowledge 
management 
Subscription to terminology and information model 
updates.  The CDSE should subscribe to update 
notifications from the Terminology Service and the LIMR 
and should support a governed process for reviewing and 
incorporating 
terminology 
and 
information 
model 
changes into dependent decision logic, ensuring that 
clinical rules remain aligned with current terminology 
versions and structural definitions as they evolve. 
Recommended 
DECISION SUPPORT INVOCATION 
6 
Clinical decision 
support 
Context-aware invocation.  The CDSE shall accept 
requests containing person-specific clinical data retrieved 
from the LHR, encounter context, and workflow triggers, 
and 
shall 
return 
recommendations, 
alerts, 
risk 
assessments, or suggested actions tailored to the 
specific clinical scenario presented, ensuring that 
guidance reflects the individual's verified longitudinal 
health record rather than generic population-level rules. 
Required 
7 
Clinical decision 
support 
Clinical workflow integration via CDS Hooks.  The 
CDSE should support invocation at configurable points 
within clinical workflows — including at order entry, during 
prescribing, at encounter start, and at discharge — 
Recommended 
 
 
187 
# 
Business process 
Functional requirement 
Status 
through the CDS Hooks standard, enabling embedding 
within 
point-of-care 
applications 
without 
requiring 
bespoke integration for each consuming system. 
8 
Clinical decision 
support 
SMART on FHIR application support.  The CDSE 
should support SMART on FHIR as a standards-based 
integration pattern enabling decision support applications 
to launch within the context of a point-of-care session and 
access patient data from the LHR with appropriate 
authorisation. 
Recommended 
9 
Clinical decision 
support 
Separation of logic and presentation.  The CDSE shall 
deliver decision support outputs in a structured, machine-
readable format independent of any specific user 
interface, so that consuming applications can present 
recommendations in a manner appropriate to their own 
workflow, without the CDSE prescribing how its outputs 
are displayed or acted upon. 
Required 
10 System integration 
Terminology and information model alignment.  The 
CDSE shall resolve clinical concepts referenced in 
decision logic against the Terminology Service and shall 
validate input data against logical information models 
published in the LIMR, ensuring that decision logic 
operates on consistently coded and structured data 
regardless of the source system that contributed it. 
Required 
CLINICAL SAFETY AND CARE SUPPORT 
11 Medication safety 
Medication safety support.  The CDSE should support 
medication-related decision support, including drug-drug 
interaction checking, allergy and contraindication alerts, 
dosage range validation, and duplicate therapy detection, 
drawing on up-to-date pharmaceutical knowledge bases 
to reduce the risk of preventable adverse drug events. 
Recommended 
12 Clinical assessment 
Risk assessment and screening.  The CDSE should 
support the computation of clinical risk scores, screening 
tool results, and eligibility assessments based on 
published and validated scoring algorithms, enabling 
consistent identification of individuals requiring further 
investigation, targeted intervention, or programme 
enrolment. 
Recommended 
13 Care coordination 
Care plan and pathway guidance.  The CDSE should 
support the generation of recommended care plans and 
next-step actions based on longitudinal patient data and 
defined care pathways, enabling protocol-driven care 
delivery for chronic disease management, antenatal care, 
child health, immunisation, and other programme areas. 
Recommended 
14 Clinical safety 
Alert prioritisation and suppression.  The CDSE 
should support configurable alert severity levels, 
prioritisation logic, and suppression rules to reduce alert 
fatigue, ensuring clinically significant recommendations 
are 
surfaced 
prominently 
while 
lower-priority 
or 
Recommended 
 
 
188 
# 
Business process 
Functional requirement 
Status 
previously 
acknowledged 
alerts 
are 
managed 
appropriately without compromising patient safety. 
CONTEXT AND ROLE AWARENESS 
15 Personalised 
guidance 
Role-based filtering of recommendations.  The CDSE 
should filter and calibrate decision support outputs based 
on the verified professional role and credentials of the 
invoking health worker, as referenced against the Health 
Workforce Registry, ensuring that recommendations are 
appropriate to the scope of practice of the receiving 
clinician. 
Recommended 
16 Contextual 
appropriateness 
Facility context awareness.  The CDSE should 
incorporate facility-level context — referenced against the 
Health Facility Registry — into the evaluation of decision 
logic where the type, level, or service delivery capacity of 
the facility is relevant to the appropriateness of specific 
recommendations, including referral guidance and 
recommendations for facility-dependent procedures. 
Recommended 
17 Cross-domain 
decision support 
Operational decision support interfaces.  The CDSE 
should provide integration interfaces enabling supply 
chain management systems, public health surveillance 
platforms, and health financing systems to invoke 
decision logic relevant to their operational contexts, using 
the same shared decision support infrastructure as 
clinical use cases. 
Recommended 
TRANSPARENCY AND ACCOUNTABILITY 
18 Clinical 
transparency 
Transparency and explainability.  The CDSE shall 
provide, alongside each recommendation, a human-
readable explanation of the reasoning applied — 
including the rules evaluated, the data inputs considered, 
and the evidence or guideline source referenced — 
enabling clinicians to understand, evaluate, and exercise 
informed judgement about the guidance they receive. 
Required 
19 Clinical 
accountability 
Override and justification capture.  The CDSE shall 
allow authorised users to override or dismiss a 
recommendation and shall require the recording of a 
reason, supporting clinical autonomy while maintaining 
accountability for departures from evidence-based 
guidance. Override data shall be retained in a structured, 
reportable format to support retrospective analysis and 
knowledge governance. 
Required 
20 Quality 
improvement 
Override pattern reporting.  The CDSE should support 
the aggregation and reporting of override patterns to 
authorised governance bodies and, where appropriate, to 
the HMIS, enabling systematic review of decision support 
performance, identification of rules requiring refinement, 
and evidence-based improvement of the clinical 
knowledge base. 
Recommended 
 
 
189 
# 
Business process 
Functional requirement 
Status 
GOVERNANCE, SAFETY, AND ACCESS CONTROL 
21 Governance 
Role-based access control.  The CDSE shall enforce 
role-based access controls governing which users and 
systems may invoke decision support, configure or 
deploy computable knowledge artefacts, and access 
audit logs, aligned to the roles established in the Health 
Workforce Registry and the national access governance 
framework. 
Required 
22 Clinical safety 
Fail-safe behaviour.  The CDSE shall be designed to fail 
safely: in the event of a failure to retrieve patient context, 
evaluate a rule, or deliver an output, the consuming 
system shall be informed of the failure and proceed with 
clinical care without being blocked, and the failure shall 
be logged for investigation. 
Required 
23 Governance 
Audit 
logging. 
 
The 
CDSE 
shall 
maintain 
a 
comprehensive audit log of all decision support 
invocations, 
knowledge 
artefact 
versions 
applied, 
recommendations 
generated, 
overrides 
recorded, 
knowledge management actions, and access events, 
recording the actor, timestamp, clinical data inputs used, 
and decision support output produced. 
Required 
CROSS-CUTTING 
24 Performance · 
Availability 
Performance and availability.  The CDSE shall return 
recommendations within timeframes compatible with 
real-time clinical workflows and shall be designed for high 
availability commensurate with the clinical criticality of the 
decision support functions it provides. 
Required 
25 Low-resource 
settings 
Graceful 
degradation 
in 
low-connectivity 
environments.  The CDSE should support graceful 
degradation in low-connectivity environments, enabling 
point-of-care systems to function with cached or pre-
evaluated decision support outputs where real-time 
invocation is not possible, with defined processes for 
updating cached knowledge when connectivity is 
restored. 
Recommended 
 
224 
Note: The CDSE has no equivalent in the OpenHIE architecture specification and is a DPI-H-specific 
225 
component. Requirements draw on the HL7 FHIR Clinical Reasoning module ($apply operation, 
226 
PlanDefinition, ActivityDefinition, Library resources), CDS Hooks specification (https://cds-hooks.org), 
227 
Clinical Quality Language (https://cql.hl7.org), SMART on FHIR, WHO SMART Guidelines framework (L3 
228 
computable artefacts), and the FDA definition of Clinical Decision Support (FDA Digital Health Center of 
229 
Excellence, https://www.fda.gov/medical-devices/digital-health-center-excellence). Descriptions of CDSS 
230 
architecture (knowledge base, inference engine, communication mechanism) draw on: Sutton et al., 'An 
231 
overview of clinical decision support systems', npj Digital Medicine, 2020 
232 
(https://www.nature.com/articles/s41746-020-0221-y). Knowledge engineering is resource-intensive and 
233 
countries should assess their data quality and analytical readiness before treating the CDSE as an 
234 
implementation priority. 
235 
 
 
190 
GOVERNANCE 
Governance of the CDSE follows the cross-cutting governance framework in Section 
3.4 of the guidance document. Component-specific considerations include:  
(1) Clinical authority and institutional ownership. Stewardship should be vested in a 
national health authority working in active partnership with professional clinical bodies, 
academic institutions, and public health authorities. Unlike other DPI-H components 
whose governance is primarily a data management responsibility, the CDSE's 
governance is fundamentally a clinical responsibility: the rules it executes encode 
clinical authority, and the institutions that govern them should have the professional 
legitimacy to do so. Ownership should not be delegated to a vendor or implementing 
partner.  
(2) Clinical knowledge governance framework. Countries should establish a formal 
framework governing the full lifecycle of decision support content: identification of 
priority areas, adaptation of international guidelines to national context, peer review 
and clinical validation, publication, deployment, and retirement. This framework 
should define roles and responsibilities at each stage, evidence standards that 
decision logic should meet before deployment, versioning and change management 
processes, and conditions under which logic can be deployed, suspended, or rolled 
back. Clinical knowledge governance is a sustained institutional commitment.  
(3) Evidence review and guideline adaptation. Decision support logic should be 
grounded in the best available clinical evidence. Countries should establish processes 
for monitoring currency of deployed logic against evolving evidence and for 
incorporating updates from international guideline development bodies in a timely and 
governed manner. Adaptation of international guidelines to national context should be 
documented and traceable. ( 
4) Clinical liability and accountability. The deployment of automated clinical decision 
support raises questions of clinical liability that governance frameworks should 
explicitly address, including the conditions under which recommendations carry 
advisory rather than mandatory status, the obligations of health workers to exercise 
independent clinical judgement, and the mechanisms through which accountability is 
determined when a clinical outcome is associated with a decision support 
recommendation. These questions require engagement with professional regulatory 
bodies and legal authorities.  
(5) Transparency and explainability as governance requirements. Health workers 
should be able to understand the basis of a recommendation in order to exercise 
informed clinical judgement. Countries should treat transparency and explainability as 
non-negotiable properties of deployed decision support logic, requiring evidence 
sources and reasoning to be documented as part of the knowledge authoring process.  
(6) Override governance and quality improvement. Override patterns are a 
governance data source: high override rates for specific rules may indicate that logic 
is poorly calibrated, that alert fatigue is undermining value, or that a guideline requires 
adaptation. Override governance should be embedded in the clinical knowledge 
governance framework as a formal feedback loop.  
(7) Relationship with WHO SMART Guidelines governance. Countries deploying 
WHO SMART Guidelines content should engage with WHO governance processes 
for the development, review, and updating of that content, contributing national 
implementation experience back to the global process rather than managing national 
adaptations in isolation. 
 
236 
 
 
191 
DPI-H Reference Architecture  |  Component Articulation 
1
