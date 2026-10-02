---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-103-public-health-surveillance-platform
section_title: "Public Health Surveillance Platform"
section_number: null
pages: 229-240
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
2 
Business Services Layer  ·  Public Health and Epidemic Preparedness 
3 
 
4 
ARCHITECTURE 
PLACEMENT 
AND 
BOUNDARY 
WITH THE HMIS 
The Public Health Surveillance Platform (PHSP) sits in the business services layer 
of the DPI-H reference architecture. It is architecturally distinct from the HMIS in both 
function and focus. The HMIS aggregates routine health indicators from facility-level 
reporting to support programme monitoring and strategic planning. The PHSP 
supports the systematic detection, investigation, and coordinated response to public 
health threats through case-based, event-based, and indicator-based surveillance. 
The two components exchange data bidirectionally and are complementary; where 
their boundaries are unclear in a specific country context, countries should define 
them through their national health information architecture. There is no direct 
equivalent of the PHSP in the OpenHIE architecture specification; the component 
draws on the international framework of Integrated Disease Surveillance and 
Response (IDSR), the WHO Event Information System, and the legal obligations 
established under the International Health Regulations 2005. 
 
5 
1  WHAT IT IS 
 
6 
The Public Health Surveillance Platform is a governed, shared application component for the systematic, 
7 
ongoing collection, analysis, interpretation, and dissemination of health data to detect, monitor, and respond 
8 
to public health threats at local, national, and international levels. It supports both routine indicator-based 
9 
surveillance, aggregated from health facility reporting and the Lifelong Health Record, and event-based 
10 
surveillance, capturing signals from community reports, laboratory alerts, environmental monitoring, and 
11 
other non-routine sources. Together, these modalities provide the analytical and operational foundation for 
12 
early warning, outbreak detection, case investigation, and coordinated public health response. 
13 
The PHSP draws on the shared data foundations of the DPI-H ecosystem — including the Client Registry, 
14 
Health Facility Registry, Terminology Service, and Lifelong Health Record — to avoid parallel data 
15 
collection and ensure that surveillance data is semantically consistent with clinical and administrative data 
16 
across the health system. This integration with shared infrastructure is a defining architectural characteristic 
17 
that distinguishes the PHSP in a DPI-H ecosystem from traditional public health surveillance systems, which 
18 
typically operate as parallel infrastructure maintaining their own person registries, facility lists, and reporting 
19 
pipelines independently of the clinical data ecosystem. By deriving surveillance information from data 
20 
already captured at the point of care, the PHSP simultaneously reduces the reporting burden on health 
21 
workers, improves the timeliness and completeness of surveillance data, and ensures that the picture 
22 
surveillance generates is consistent with the clinical and administrative data on which the rest of the health 
23 
system operates. 
24 
A public health surveillance platform of this scope is more accurately described as an Electronic Integrated 
25 
Disease Surveillance and Response (eIDSR) system in the terminology used by the WHO IDSR framework 
26 
and the broader public health informatics community. Evidence from national eIDSR implementations 
27 
suggests that well-governed electronic integrated surveillance systems can substantially improve 
28 
surveillance completeness and timeliness of case notification, with corresponding improvements in 
29 
 
 
219 
outbreak detection and response capacity.60,61 The PHSP is the DPI-H reference architecture's expression 
30 
of this eIDSR concept, positioned as shared digital infrastructure governed in the public interest and 
31 
integrated with the broader health information ecosystem. 
32 
 
33 
 
34 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
35 
The ability to detect, respond to, and recover from disease outbreaks, climate-related health threats, and 
36 
other public health emergencies depends on surveillance infrastructure that is continuously operating, not 
37 
assembled in a crisis. The history of epidemic response is substantially a history of the consequences of 
38 
surveillance systems that were too slow, too fragmented, or too dependent on manual processes to detect 
39 
and communicate threats before they had spread beyond the point where early containment was possible. 
40 
The difference between a contained outbreak and a public health emergency of international concern is 
41 
frequently measured in days, and those days are determined in large part by the speed and reliability of the 
42 
surveillance infrastructure that generates the first signal. 
43 
In most health systems, surveillance infrastructure has been built in the same fragmented, programme-
44 
specific way as other digital health investments. Disease-specific surveillance systems have been 
45 
established for priority conditions, each with their own case definitions, reporting forms, data formats, and 
46 
management arrangements. Laboratory information systems operate independently of clinical reporting 
47 
systems. Community health worker reporting flows through channels that are disconnected from facility-
48 
based surveillance. Environmental and climate-related health monitoring sits outside the health information 
49 
architecture. The consequence is a surveillance landscape that is expensive to operate, difficult to integrate, 
50 
and less able to detect cross-programme patterns and anomalies that signal emerging threats. This 
51 
fragmentation has direct consequences for outbreak response: assembling a coherent picture from data 
52 
held in multiple systems and reported through multiple channels takes time, and this is time an outbreak 
53 
uses to spread. 
54 
The challenge extends beyond communicable disease. Climate change is increasingly a determinant of 
55 
health system performance, driving changes in disease distribution, intensifying heat-related illness, 
56 
creating conditions for vector-borne disease emergence, and generating acute health crises through 
57 
extreme weather events. Surveillance infrastructure limited to communicable disease reporting is not 
58 
capable of detecting or responding to this broader range of threats. 
59 
Evidence from national electronic IDSR implementations supports the value of investing in integrated digital 
60 
surveillance infrastructure. Evaluations of eIDSR systems in multiple countries have demonstrated 
61 
substantial improvements in reporting completeness, timeliness of case notification, and speed of outbreak 
62 
detection and response following the transition from paper-based to electronic integrated surveillance.  
63 
A governed Public Health Surveillance Platform addresses these failures, enabling: 
64 
• 
Continuous, routine surveillance as the foundation of epidemic preparedness, so that the data 
65 
infrastructure, reporting relationships, case definitions, and analytical capabilities required for outbreak 
66 
detection are operational before an emergency occurs, rather than being assembled under crisis 
67 
conditions when speed is most critical and capacity is most constrained. 
68 
• 
Early detection of emerging threats through the application of configurable detection algorithms and 
69 
statistical methods to routine surveillance data, identifying unusual patterns, clusters, and threshold 
70 
exceedances that may signal the onset of an outbreak or other public health emergency before it 
71 
becomes clinically apparent at the population level. 
72 
 
60 Magoba Bridget, Gebrekrstos Negash Gebru, George S Odongo, Calle Hedberg, Adel Hussein Elduma, Joseph Sam Kanu, 
James Bangura, James Sylvester Squire, Monique A Foster, Digitalizing disease surveillance: experience from Sierra Leone, Health 
Policy and Planning, Volume 40, Issue 1, January 2025, Pages 85–96, https://doi.org/10.1093/heapol/czae039 
61 Mugasha R, Kwiringira A, Ntono V, Nakiire L, Ayebazibwe I, Kyozira C, Muruta AN, Kasule JN, Byonanebye DM, Nanyondo J, 
Walwema R, Kakooza F, Lamorde M. Scaling Up and Enhancing the Functionality of the Electronic Integrated Diseases 
Surveillance and Response System in Uganda, 2020-2022: Description of the Journey, Challenges, and Lessons Learned. JMIR 
Public Health Surveill. 2025 Apr 14;11:e59783. doi: 10.2196/59783. PMID: 40228314; PMCID: PMC12011313. 
 
 
220 
• 
Integration of multiple surveillance modalities — combining routine indicator-based surveillance from 
73 
health facilities, event-based surveillance from community and non-routine sources, laboratory-
74 
confirmed diagnostic data, and environmental and climate-related health monitoring — into a coherent 
75 
operational picture than any single-modality surveillance system can readily provide. 
76 
• 
Elimination of parallel surveillance data collection by drawing on clinical data already held in the LHR, 
77 
aggregate data from the HMIS, and person and facility references from the shared registries, reducing 
78 
the reporting burden on health workers and facilities that would otherwise be required to submit the 
79 
same data through multiple surveillance channels simultaneously. 
80 
• 
Coordinated public health response through shared operational infrastructure within which investigation 
81 
tasks, containment measures, resource deployment, and communication actions are planned, 
82 
assigned, tracked, and reported, giving response teams a common operational picture. 
83 
• 
Fulfilment of international reporting obligations, supporting the timely, accurate, and standardised 
84 
reporting required under the International Health Regulations and other international surveillance 
85 
frameworks. 
86 
• 
Surveillance for climate-related health threats, extending the PHSP's scope beyond communicable 
87 
disease to encompass environmental health monitoring, heat-related illness surveillance, vector habitat 
88 
tracking, and the health consequences of extreme weather events. 
89 
• 
Feedback into clinical care and decision support, ensuring that population-level surveillance signals — 
90 
including antimicrobial resistance patterns, vaccine effectiveness data, and emerging pathogen 
91 
characteristics — are available to the CDSE and HMIS to inform clinical guidance and programme 
92 
management. 
93 
The PHSP in a DPI-H ecosystem is architecturally distinct from traditional public health surveillance 
94 
systems in one critical respect: it is designed to derive its data from shared infrastructure rather than to 
95 
maintain parallel data collection channels that duplicate what the health system already captures. This 
96 
reduces the burden of surveillance on health workers and facilities, improves the timeliness and 
97 
completeness of surveillance data, and ensures that the picture surveillance generates is consistent with 
98 
the clinical and administrative data on which the rest of the health system operates. It also means that the 
99 
investment made in shared registries, the LHR, and the Terminology Service delivers surveillance value as 
100 
well as clinical value, compounding the return on shared infrastructure across multiple health system 
101 
functions simultaneously. 
102 
 
103 
3  CORE  ATTRIBUTES 
 
104 
– Routine indicator-based surveillance. Systematic collection and processing of notifiable disease 
105 
reports, syndromic surveillance data, and health event notifications from health facilities, 
106 
laboratories, and community health programmes, drawing on clinical data held in the LHR 
107 
wherever possible to reduce parallel reporting burden. 
108 
– Event-based surveillance. Capture, triage, and verification of signals from non-routine sources, 
109 
including community reports, informal health alerts, and laboratory signals, with configurable 
110 
workflows for signal assessment, source confidentiality protection where applicable, and escalation 
111 
to formal public health investigation. 
112 
– Case registration and management. Registration, investigation, classification, and outcome 
113 
tracking of individual suspected and confirmed cases, linked to verified person identities in the 
114 
Client Registry (or foundational identity where available), clinical data in the LHR, and reporting 
115 
facilities in the Health Facility Registry, with full provenance of data contributions and status 
116 
changes. 
117 
– Contact tracing. Identification, registration, and follow-up of contacts associated with confirmed or 
118 
suspected cases, with person identity linkage through the Client Registry (or foundational identity 
119 
where available), monitoring schedule management, symptom check recording, and support for 
120 
offline contact tracing in low-connectivity field settings. 
121 
 
 
221 
– Outbreak detection and early warning. Application of configurable detection algorithms, 
122 
statistical thresholds, and spatial analysis methods to incoming surveillance data — contextualised 
123 
against baseline trends from the HMIS — to identify unusual patterns, clusters, or threshold 
124 
exceedances that may signal the onset of a public health emergency, with timely, structured alert 
125 
generation to responsible authorities. 
126 
– Laboratory data integration. Receipt and association of confirmed diagnostic results, pathogen 
127 
characterisation data, and antimicrobial resistance profiles from laboratory information systems 
128 
with reported cases, supporting case classification, outbreak investigation, and pathogen evolution 
129 
monitoring. 
130 
– Climate and environmental health surveillance. Monitoring and analysis of environmental and 
131 
climate-related health signals — including heat-related illness, vector habitat indicators, air quality, 
132 
and health consequences of extreme weather events — extending the PHSP's scope beyond 
133 
communicable disease to encompass the health threats associated with climate change and 
134 
environmental degradation. 
135 
– Epidemiological analysis. Tools for descriptive and exploratory epidemiological analysis 
136 
including calculation of incidence, prevalence, case fatality rates, attack rates, and reproductive 
137 
numbers, with disaggregation by time, geography, and person characteristics, enabling public 
138 
health authorities to characterise threats, track progression, and evaluate containment 
139 
effectiveness. 
140 
– Geographic information and spatial analysis. Geographic mapping and spatial analysis of 
141 
surveillance data, linked to the Health Facility Registry (and foundational Common Geo Registry 
142 
(CGR) where available) and administrative boundary data, for disease distribution visualisation, 
143 
cluster detection, hotspot identification, and spatial targeting of response activities. 
144 
– Alert and notification management. Configurable alert management workflow covering 
145 
generation, severity classification, escalation, assignment, acknowledgement, and resolution, with 
146 
notification through multiple channels and a complete record of alert lifecycle events for 
147 
accountability and after-action review. 
148 
– Response coordination and action tracking. Planning, assignment, and tracking of public health 
149 
response activities associated with verified events and outbreaks — including investigation tasks, 
150 
containment measures, resource deployment, and communication actions — providing a shared 
151 
operational picture and a documented record that supports after-action review. 
152 
– International reporting. Generation and submission of standardised surveillance reports and 
153 
event notifications to international health authorities and platforms, including WHO IHR 
154 
mechanisms, in compliance with the PHSP's obligations under the International Health Regulations 
155 
2005. 
156 
 
157 
4  HOW IT CONNECTS 
 
158 
The PHSP is a major consumer of shared data infrastructure and a primary contributor to international 
159 
health security, with relationships spanning the full DPI-H ecosystem and extending to international 
160 
surveillance frameworks. 
161 
The Lifelong Health Record is the PHSP's primary source of person-level clinical data. Clinical data on 
162 
notifiable conditions, laboratory results, diagnoses, and clinical presentations recorded in the LHR can 
163 
populate surveillance case records, improving timeliness and completeness of surveillance reporting and 
164 
reducing the burden on facilities simultaneously providing care and fulfilling surveillance obligations. The 
165 
PHSP accesses LHR data through standardised query interfaces, subject to the consent and access 
166 
governance frameworks that govern the LHR, and does not hold its own duplicate copy of person-level 
167 
clinical data beyond what is required for case management and contact tracing. 
168 
The Client Registry provides the verified person identity used to register and link surveillance cases, 
169 
ensuring that cases reported from different facilities or through different channels are correctly attributed to 
170 
the same individual and that duplicates are detected.  
171 
 
 
222 
The Health Facility Registry provides authoritative references for reporting facilities, enabling attribution of 
172 
cases and events to specific locations, aggregation at defined administrative levels, and geographic 
173 
analysis of disease distribution. Facility attributes including location, type, and catchment population 
174 
support the spatial targeting of response activities. 
175 
The Terminology Service ensures that disease codes, pathogen identifiers, clinical findings, and other 
176 
coded concepts used in surveillance case definitions are consistently interpreted across contributing 
177 
systems. Surveillance depends on the consistent application of case definitions, and the Terminology 
178 
Service provides the governed, authoritative coding infrastructure on which that consistency depends. The 
179 
PHSP subscribes to Terminology Service updates to ensure case definitions remain aligned with current 
180 
terminology versions. 
181 
The LIMR provides the structural definitions that govern how surveillance case data, contact tracing 
182 
records, and outbreak reports are organised and exchanged. Consistent data structures across surveillance 
183 
programmes are a prerequisite for reliable case counting and epidemiological analysis.  
184 
The PHSP and the HMIS are complementary but distinct. The PHSP contributes case-level and outbreak 
185 
data to the HMIS, enriching the aggregate health information picture during public health events. The HMIS 
186 
provides aggregate health indicators and baseline trend data to the PHSP, supplying the statistical 
187 
baselines against which outbreak detection algorithms identify anomalies. Countries should coordinate the 
188 
governance of the two components to prevent duplication and maintain consistency between the indicators 
189 
each produces. 
190 
The PHSP and the CDSE interact where surveillance intelligence should modify clinical recommendations 
191 
at the point of care. Surveillance signals generated by the PHSP — including antimicrobial resistance 
192 
patterns, vaccine effectiveness data, outbreak alerts, and emerging pathogen characteristics — can inform 
193 
the review and updating of clinical decision support logic in the CDSE, ensuring point-of-care guidance 
194 
reflects current epidemiological conditions. The CDSE can also support automated case classification and 
195 
risk scoring logic that feeds back into the PHSP's surveillance functions. 
196 
The Health Workforce Registry provides references for public health officers, surveillance coordinators, and 
197 
response team members who access the PHSP, supporting role-based access controls. During outbreak 
198 
response, the Health Workforce Registry would also provide information on workforce availability and 
199 
credentials that supports the deployment of qualified personnel to response activities. 
200 
International surveillance platforms and frameworks — including the WHO Integrated Data Platform, the 
201 
WHO Event Information System, and the IHR reporting mechanisms — define the external exchange and 
202 
reporting obligations that shape significant dimensions of the PHSP's functional and governance 
203 
requirements. Countries should ensure that the PHSP's data standards, exchange protocols, and reporting 
204 
workflows are aligned with these international frameworks from the outset, rather than treating international 
205 
reporting as a function to be accommodated after the national architecture is established. 
206 
Where general-purpose data exchange infrastructure exists at the foundational DPI level, the PHSP may 
207 
leverage it to exchange surveillance alerts and notifications with non-health sector actors — including 
208 
emergency management authorities, civil protection agencies, and environmental monitoring systems — 
209 
supporting the cross-sectoral coordination that effective public health emergency response requires. The 
210 
health-specific semantic and structural requirements of clinical surveillance data mean, however, that 
211 
standards-based health interoperability infrastructure and the Terminology Service remain the primary 
212 
exchange infrastructure for clinical data flows into and out of the PHSP. 
213 
 
214 
5  FUNCTIONAL REQUIREMENTS 
 
215 
Requirements draw on the WHO Integrated Disease Surveillance and Response (IDSR) technical 
216 
guidelines (3rd edition, 2019)62, the International Health Regulations 2005 reporting framework63, the WHO 
217 
 
62 https://www.who.int/publications/i/item/WHO-AF-WHE-CPI-01-2019  
63 https://www.who.int/publications/i/item/9789241580496  
 
 
223 
Event Information System (EIS) operational standards64, the WHO Integrated Data Platform 
218 
specifications65, and published evidence from national eIDSR implementations. There is no direct 
219 
equivalent of the PHSP in the OpenHIE architecture specification. 
220 
 
221 
# 
Business process 
Functional requirement 
Status 
ROUTINE AND EVENT-BASED SURVEILLANCE 
1 
Epidemic 
preparedness · 
IDSR 
Routine indicator-based surveillance.  The PHSP shall 
support the collection and processing of notifiable 
disease reports and syndromic surveillance data from 
health facilities, laboratories, and community health 
programmes, drawing on clinical data held in the LHR 
wherever possible to reduce parallel reporting burden, 
aligned 
to 
national 
surveillance 
protocols 
and 
International Health Regulations obligations. 
Required 
2 
Epidemic 
preparedness 
Event-based surveillance.  The PHSP shall support the 
capture, triage, and verification of signals from non-
routine sources, including community reports, informal 
health alerts, and laboratory signals, with configurable 
workflows for signal assessment, source confidentiality 
protection, and escalation to formal public health 
investigation, complementing routine surveillance to 
accelerate detection of emerging threats. 
Required 
3 
Surveillance 
programme 
management 
Configurable surveillance programmes.  The PHSP 
shall support the configuration of multiple, concurrent 
surveillance programmes with programme-specific case 
definitions, 
reporting 
forms, 
workflows, 
detection 
thresholds, and indicator sets, enabling the platform to 
serve as shared operational infrastructure for diverse 
functions including communicable disease surveillance, 
antimicrobial resistance monitoring, vaccine safety 
surveillance, and climate-related health monitoring. 
Required 
CASE MANAGEMENT AND CONTACT TRACING 
4 
Case investigation 
Case registration and management.  The PHSP shall 
support the registration of individual suspected and 
confirmed cases, linking demographic data to verified 
person identities in the Client Registry and clinical data to 
the LHR, attributing cases to reporting facilities in the 
Health Facility Registry, and tracking each case through 
its investigation, classification, and outcome lifecycle with 
full provenance of data contributions and status changes. 
Required 
5 
Case investigation 
Contact tracing.  The PHSP should support the 
identification, registration, and follow-up of contacts 
associated with confirmed or suspected cases, with 
person identity linkage through the Client Registry, 
monitoring schedule management, symptom check and 
outcomes recording. 
Required 
 
64 https://iris.who.int/server/api/core/bitstreams/1e38533c-30b3-419e-89b5-94d63b30df6f/content  
65 https://www.who.int/tools/who-integrated-data-platform  
 
 
224 
# 
Business process 
Functional requirement 
Status 
OUTBREAK DETECTION AND RESPONSE 
6 
Early warning 
Outbreak detection and early warning.  The PHSP 
shall apply configurable detection algorithms, statistical 
thresholds, and spatial analysis methods to incoming 
surveillance data, contextualised against baseline trend 
data from the HMIS, to identify unusual patterns, clusters, 
or threshold exceedances that may signal the onset of a 
public health emergency, generating timely, structured 
alerts with sufficient information to support rapid 
verification and response decisions. 
Required 
7 
Alert management 
Alert and notification management.  The PHSP shall 
support a configurable alert management workflow 
including 
alert 
generation, 
severity 
classification, 
escalation, 
assignment, 
acknowledgement, 
and 
resolution, with notification of designated public health 
officers through multiple channels and a complete record 
of alert lifecycle events and response actions for 
accountability and after-action review. 
Required 
8 
Response 
coordination 
Response coordination and action tracking.  The 
PHSP should support the planning, assignment, and 
tracking of public health response activities associated 
with verified events and outbreaks — including 
investigation tasks, containment measures, resource 
deployment, and communication actions — providing a 
shared operational picture for response teams and a 
documented record that supports after-action review. 
Recommended 
9 
Continuous 
improvement 
After-action review support.  The PHSP should 
maintain comprehensive records of surveillance and 
response activities associated with verified public health 
events — including detection timelines, alert lifecycle 
records, response action logs, and outcome data — in 
formats that support structured after-action review and 
systematic identification of preparedness and response 
gaps. 
Recommended 
LABORATORY INTEGRATION AND CLIMATE SURVEILLANCE 
10 Laboratory 
surveillance 
Laboratory data integration.  The PHSP should 
integrate with laboratory information systems to receive 
and associate confirmed diagnostic results, pathogen 
characterisation data, and antimicrobial resistance 
profiles 
with 
reported 
cases, 
supporting 
case 
classification, outbreak investigation, and the monitoring 
of pathogen evolution and treatment resistance patterns 
over time. 
Recommended 
11 Climate health 
surveillance 
Climate and environmental health surveillance.  The 
PHSP should support integration with relevant climate 
and 
environmental 
data 
sources 
— 
including 
meteorological 
services, 
environmental 
monitoring 
agencies, and where applicable IoT-based sensor 
Recommended 
 
 
225 
# 
Business process 
Functional requirement 
Status 
networks — to receive the environmental data streams on 
which climate-related health surveillance depends. This 
would 
support 
the 
monitoring 
and 
analysis 
of 
environmental and climate-related health signals — 
including heat-related illness, vector habitat indicators, air 
quality data, and health consequences of extreme 
weather events — through configurable surveillance 
programmes extending the platform's scope beyond 
communicable disease to encompass the health threats 
associated with climate change. 
EPIDEMIOLOGICAL ANALYSIS AND GIS 
12 Epidemiological 
analysis 
Epidemiological analysis tools.  The PHSP shall 
provide analytical tools for descriptive and exploratory 
epidemiological 
analysis, 
including 
calculation 
of 
incidence, prevalence, case fatality rates, attack rates, 
and reproductive numbers, with disaggregation by time, 
person characteristics, geography, and surveillance 
programme, enabling public health authorities to 
characterise threats, track progression, and evaluate 
containment effectiveness. 
Required 
13 Geographic 
analysis 
Geographic information and spatial analysis.  The 
PHSP should support geographic mapping and spatial 
analysis of surveillance data — linked to the Health 
Facility Registry (and foundational Common Geo Registry 
where available) and administrative boundary data — for 
disease distribution visualisation, cluster detection, 
hotspot identification, and spatial targeting of response 
activities, with support for integration of environmental 
and climate data layers for climate-related health 
surveillance. 
Recommended 
REPORTING AND INTERNATIONAL EXCHANGE 
14 IHR compliance 
Reporting and international data exchange.  The 
PHSP shall generate standard surveillance reports, 
situation reports, and epidemiological bulletins in both 
human-readable 
and 
machine-readable 
formats, 
supporting 
national 
reporting 
requirements 
and 
international obligations under the International Health 
Regulations 2005, and shall maintain documentation of 
IHR notification decisions, timelines, and supporting 
evidence sufficient to demonstrate compliance. 
Required 
15 International 
surveillance 
Cross-border and international data exchange.  The 
PHSP shall support the secure exchange of surveillance 
data and event notifications with international health 
authorities 
and 
platforms, 
including 
WHO 
IHR 
mechanisms and the WHO Integrated Data Platform, 
using agreed data standards and exchange protocols, 
and shall support the receipt of international surveillance 
alerts and advisories relevant to national surveillance and 
response. 
Required 
 
 
226 
# 
Business process 
Functional requirement 
Status 
INTEGRATION AND INTEROPERABILITY 
16 System integration 
LHR data integration.  The PHSP shall integrate with the 
LHR to receive clinical data on notifiable conditions, 
diagnoses, and laboratory results through standardised 
query interfaces, enabling the derivation of surveillance 
information from data already captured at the point of 
care and reducing parallel reporting obligations on health 
facilities and health workers. 
Required 
17 System integration 
DPI-H ecosystem integration.  The PHSP shall 
exchange data with other DPI-H components — including 
the Client Registry for person identity linkage, the Health 
Facility Registry for location attribution, the HMIS for 
aggregate indicators and baseline trend data, the 
Terminology Service for standardised coding, the LIMR 
for structural consistency, and the CDSE for automated 
case classification — using standardised integration 
profiles. 
Required 
18 Semantic 
consistency 
Terminology alignment for case definitions.  The 
PHSP shall use coded disease identifiers, pathogen 
classifications, 
clinical 
findings, 
and 
surveillance 
indicators governed by the Terminology Service, and 
shall subscribe to update notifications from the 
Terminology Service to ensure surveillance case 
definitions and reporting forms remain aligned with 
current terminology versions as international standards 
evolve. 
Required 
DATA QUALITY, GOVERNANCE, AND ACCESS CONTROL 
19 Data quality 
Data quality and completeness monitoring.  The 
PHSP shall provide tools for monitoring the timeliness, 
completeness, 
and 
quality 
of 
surveillance 
data 
submissions from reporting sites, generating structured 
alerts when reporting falls below defined thresholds, and 
supporting supervisory follow-up and accountability 
processes to maintain the reliability of the surveillance 
picture on which outbreak detection depends. 
Required 
20 Access control 
Role-based access and confidentiality.  The PHSP 
shall enforce role-based access controls appropriate to 
surveillance functions — including facility reporters, 
district surveillance officers, national epidemiologists, 
laboratory staff, and response coordinators — and shall 
protect the confidentiality of individual case data in 
accordance with national data protection regulations and 
the legal framework governing public health surveillance, 
including source confidentiality protections for event-
based surveillance signals where applicable. 
Required 
21 Operational 
resilience 
Offline and low-connectivity operation.  The PHSP 
should support case registration, contact tracing, and 
event-based signal capture in low-connectivity and offline 
Recommended 
 
 
227 
# 
Business process 
Functional requirement 
Status 
environments, with reliable synchronisation to the central 
platform when connectivity is restored, ensuring 
surveillance continuity in remote settings and during the 
infrastructure disruptions that frequently accompany the 
public health emergencies the PHSP is designed to 
manage. 
22 Governance 
Audit 
logging. 
 
The 
PHSP 
shall 
maintain 
a 
comprehensive audit log of all data submissions, case 
modifications, alert actions, response assignments, 
international reporting events, access to confidential 
surveillance data, and system configuration changes, 
recording the actor, the action, the affected data, and the 
timestamp, to support accountability and regulatory 
compliance. 
Required 
 
222 
Sources: WHO. Integrated Disease Surveillance and Response (IDSR): technical guidelines, 3rd edition. 
223 
Geneva: WHO, 2019. International Health Regulations 2005 (IHR 2005), World Health Organization. 
224 
WHO Integrated Data Platform (https://www.who.int/tools/who-integrated-data-platform).  
225 
GOVERNANCE 
Governance of the PHSP follows the cross-cutting governance framework in Section 
3.4 of the guidance document. Component-specific considerations include:  
(1) Institutional ownership and public health authority. Stewardship should be vested 
in the national public health authority with a clear legal mandate for communicable 
disease surveillance, outbreak response, and public health emergency management, 
grounded in national legislation. Ownership should not be fragmented across multiple 
programme-specific authorities, as the PHSP's value as shared infrastructure 
depends on governance that is coherent across all surveillance programmes and 
health system levels.  
(2) Legal framework for mandatory reporting and data use. Public health surveillance 
requires a legal framework explicitly authorising the collection and use of identifiable 
personal health data without individual consent in defined public health 
circumstances, while establishing clear limits on the purposes for which that authority 
may be exercised. The legal basis for mandatory case reporting, contact tracing data 
retention, international sharing, and individual rights in relation to surveillance data 
should be publicly accessible, regularly reviewed, and aligned with the national data 
protection framework governing other DPI-H components.  
(3) Privacy and consent governance. Countries should establish clear policies on the 
minimum identifiable data required for each surveillance function, retention periods 
for case and contact tracing records, conditions under which surveillance data may 
be de-identified for secondary use, and individual rights in relation to data held in the 
PHSP. Emergency access provisions that override normal consent requirements 
should be explicitly defined, time-limited, and subject to audit.  
(4) Outbreak declaration and communication governance. Countries should establish 
clear protocols for who has authority to declare a public health emergency, at what 
threshold, through what process, and with what obligations for public communication 
and international notification. The PHSP provides the technical infrastructure; 
governance determines the decision rights and accountability structures.  
(5) Event-based surveillance governance. Countries should establish policies on 
which sources of event-based signals are monitored, how signals are triaged and 
verified before triggering formal action, how unverified signals are managed, and how 
source confidentiality is protected where relevant.  
 
 
228 
(6) IHR compliance governance. Countries should ensure that the PHSP's data 
standards and reporting workflows are aligned with IHR requirements from the outset, 
that designated national focal points have the access and authority to submit required 
notifications, and that the PHSP supports the audit trail required to demonstrate IHR 
compliance.  
(7) Laboratory network governance. Countries should define the reporting obligations 
of public and private laboratories, the data standards through which laboratory results 
flow into the PHSP, turnaround time requirements for public health-critical diagnostic 
testing, and governance of national reference laboratory functions.  
(8) Climate and environmental health surveillance governance. Countries should 
establish cross-sectoral governance arrangements bringing together health 
authorities, environmental agencies, meteorological services, and emergency 
management bodies to define surveillance indicators, data sharing protocols, and 
response coordination mechanisms for climate-related health threats — formalised 
before an emergency occurs.  
(9) Data quality and completeness governance. The reliability of outbreak detection 
depends directly on the completeness and timeliness of surveillance data 
submissions from reporting sites. Countries should establish minimum reporting 
standards — including defined reporting frequencies, completeness thresholds, and 
timeliness requirements — and create accountability mechanisms through which 
persistent reporting failures are escalated and addressed. Data quality governance 
for surveillance should be treated as an ongoing supervisory responsibility with clear 
lines of accountability from facility-level reporters through district surveillance officers 
to national public health authorities, rather than delegated solely to technical quality 
assurance functions. 
(10) After-action review and continuous improvement. Countries should establish a 
formal after-action review process triggered by defined events, following a structured 
methodology, producing documented findings, and tracking implementation of 
recommendations.  
(11) Sustainability and financing. Public health surveillance is a continuous 
operational requirement, not a project activity. Countries should avoid models 
financed primarily through emergency response funding or donor-specific project 
cycles. Sustainable financing requires the PHSP to be recognised as core national 
public health infrastructure within national health budgets. 
 
226 
 
 
229
