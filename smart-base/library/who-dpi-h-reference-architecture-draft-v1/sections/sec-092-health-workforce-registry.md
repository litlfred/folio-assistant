---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-092-health-workforce-registry
section_title: "Health Workforce Registry"
section_number: null
pages: 146-156
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
225 
Core Registries for Health  ·  DPI-H Foundational Layer   
226 
 
227 
ARCHITECTURE 
PLACEMENT 
The Health Workforce Registry is a core DPI-H foundational component — the 
shared identity and credential anchor for health workers across the health 
ecosystem. It is architecturally distinct from two operational systems: the Human 
Resources Information System (HRIS), which manages employment transactions, 
payroll processing, leave management, and workforce scheduling; and the Learning 
Management System (LMS), which manages training delivery, course enrolment, 
and assessment. The Health Workforce Registry holds the authoritative master 
record of who a health worker is and what they are qualified and licensed to do. The 
HRIS and LMS consume this registry as their reference source; neither replaces it. 
 
228 
1  WHAT IT IS 
 
229 
The Health Workforce Registry is the national authoritative record of identity, credential, and classification 
230 
data for all health workers recognised as part of the national health workforce — including licensed or 
231 
certified professionals employed in both public and private sectors and, where nationally defined and 
232 
registered, community health workers and other cadres operating in informal or semi-formal capacities. It 
233 
maintains a standardised, uniquely identified record for each health worker, providing the common 
234 
reference point against which clinical, administrative, financing, and regulatory systems can consistently 
235 
identify, verify, and classify the people delivering health services. 
236 
The registry holds two interlocking categories of information: 
237 
1. The first is identity: who the health worker is — their demographics, unique identifier, and may 
238 
cross-reference to foundational identification systems.  
239 
2. The second is credentials: what the health worker is qualified and authorised to do — their 
240 
occupational classification, professional registration, licensing status, and qualifications.  
241 
Together, these form the data foundation for a health system that can assure the quality and accountability 
242 
of its workforce at scale. 
243 
The WHO National Health Workforce Accounts (NHWA) handbook (Second Edition, 2023) defines 29 
244 
indicators that underpin health workforce monitoring, planning, and policy — covering stock, flow, 
245 
education, migration, and expenditure. The national health workforce registry is a key data source for 12 of 
246 
these indicators, notably those measuring stock and flow – critical to workforce planning and equitable 
247 
distribution. The Health Workforce Registry, as defined in the DPI-H reference architecture, provides the 
248 
foundational data infrastructure from which these indicators can be derived. 
249 
 
250 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
251 
Health systems deliver care through people. The quality, safety, and equity of that care depend on knowing 
252 
who those people are, what they are qualified to do, and where they are deployed. Ministries of Health need 
253 
to determine whether a health worker is legitimately registered, where workforce shortages are emerging, 
254 
or whether payroll rolls include inactive or unqualified personnel. Without a reliable national registry, health 
255 
worker data can be fragmented across professional councils, employer HR systems, facility registers, and 
256 
paper-based records and these can sometimes be inconsistent, incomplete, and may not always be current.  
257 
 
 
136 
Other considerations are that patients want to be assured that they are receiving care from practitioners 
258 
whose registration status or licence can be verified at the point of service, health system managers want to 
259 
know that fraud in payroll and insurance claims can be detected when provider identity can be confirmed, 
260 
and ministries of health want to be able to make workforce planning decisions on reliable data, to address 
261 
shortages and ensure distribution of the health workforce relative to population need. The WHO reports 
262 
that the lack of sufficient health workers was consistently the most common cause of disruptions to essential 
263 
health services, including during health emergencies like COVID-19 — a finding that depends on the kind 
264 
of reliable workforce data that a functioning registry can provide (WHO NHWA handbook, Second Edition, 
265 
2023). 
266 
When a Health Workforce Registry is in place, systems that employ, pay, deploy, or regulate health workers 
267 
can orient around a shared authoritative record, thus providing the enabling conditions for a health system 
268 
that is both safe for patients and accountable in its use of public resources. 
269 
 
270 
3  CORE ATTRIBUTES 
 
271 
– Health worker identity and master record management. Creation, maintenance, and lifecycle 
272 
management of authoritative identity records for all health workers, covering the full scope of the 
273 
WHO health worker classification framework — health professionals, health associate 
274 
professionals, personal care workers, health management and support personnel, and other health 
275 
service providers (WHO, 2010). 
276 
– Unique health worker identifier assignment and management. Assignment of a nationally 
277 
unique, non-intelligent identifier to each registered health worker, persistent across changes in 
278 
name, employer, or administrative boundary, and cross-referenced to foundational identification 
279 
systems where available. 
280 
– Occupational classification and multi-scheme coding. Classification of health workers using 
281 
the ISCO-08 based WHO health worker classification framework, with support for concurrent 
282 
national occupational codes, enabling consistent workforce data aggregation for national reporting 
283 
and NHWA indicator production. 
284 
– Licensing and registration management. Storage and governance of professional registration 
285 
and licensing data, including registration number, issuing licensing body, licence status (active, 
286 
expired, suspended, revoked), and licence expiry date, with real-time or near-real-time updates 
287 
from licensing authorities. 
288 
– Qualification and credential management. Maintenance of each health worker's qualifications — 
289 
degree, certificate, issuing institution, and date of completion — and continuing professional 
290 
development (CPD) status where national frameworks require it, supporting credential recognition 
291 
and workforce development tracking. 
292 
– Deployment and facility affiliation management. Linkage of each health worker to their primary 
293 
employer or facility and any secondary affiliations, cross-referenced to the Facility Registry, 
294 
enabling workforce distribution analysis and payroll attribution by location. 
295 
– Verification service. Provision of standards-based identity and credential verification services 
296 
enabling any consuming system — clinical, financial, or regulatory — to confirm a health worker's 
297 
registration status, licence validity, and occupational classification in real or near-real time. 
298 
– Workforce analytics and NHWA reporting support. Support for the production of NHWA-aligned 
299 
indicators on workforce stock, distribution, qualifications, and employment, enabling Ministries of 
300 
Health to meet their national and international reporting obligations using registry data. 
301 
 
302 
4  HOW IT CONNECTS 
 
303 
Relationship with other DPI-H components 
304 
 
 
137 
The Health Workforce Registry is one of the Core Registries for Health within the DPI-H reference 
305 
architecture. Its closest structural counterpart is the Client Registry with each providing a shared identity 
306 
anchor — one for health service users, the other for health workers. Both follow similar patterns of unique 
307 
identifier management, multi-identifier cross-referencing, and standards-based query APIs. 
308 
The Health Facility Registry is the Health Workforce Registry's primary peer dependency. A health worker 
309 
record without a facility affiliation has limited operational value; a facility record without linked workforce 
310 
data cannot support staffing analysis. The two registries are designed to be jointly queried — through the 
311 
IHE Mobile Care Services Discovery (mCSD) profile, which covers both health worker and facility data — 
312 
to answer questions about workforce distribution, service availability, and facility capacity. 
313 
The Terminology Service can host the standardised occupation codes, qualification categories, and 
314 
specialisation taxonomies that give health worker classification data its semantic meaning. Without 
315 
consistent coding anchored in a Terminology Service, it may prove difficult to reliably aggregate workforce 
316 
data from different sources. The Logical Information Model Repository holds the canonical schema defining 
317 
what attributes a health worker record should contain, their cardinalities, and their terminology bindings. 
318 
 
319 
Relationship with point of service and functional applications 
320 
The Health Workforce Registry is consumed by a wide range of downstream systems. For example: 
321 
• 
Clinical systems can verify prescribing authority, referral eligibility, and facility-level staffing at point 
322 
of care.  
323 
• 
Health coverage schemes and claims management systems can use the registry to confirm that a 
324 
provider submitting a claim is legitimately registered and affiliated with the relevant facility.  
325 
• 
Payroll and incentive payment systems can use it to validate worker eligibility before disbursement. 
326 
• 
Health workforce planning and analytics systems can draw on it to produce supply-side workforce 
327 
indicators.  
328 
• 
Learning management systems can reference it to track CPD completion and update qualification 
329 
records. 
330 
 
331 
Relationship with foundational identification systems 
332 
The relationship with foundational identification systems mirrors that of the Client Registry. Where a national 
333 
ID system exists, the Health Workforce Registry can store the foundational identifier as a cross-reference 
334 
and may verify identity against it at registration. Where it does not, the registry would provide the health 
335 
sector's own identity anchor. Professional regulatory councils and licensing bodies are primary upstream 
336 
data providers, as they hold the authoritative source for registration and licensing data, and the governance 
337 
framework should specify how data from these sources is incorporated and which takes precedence in 
338 
cases of conflict. 
339 
 
340 
5  FUNCTIONAL REQUIREMENTS 
 
341 
Requirements are grouped by the business process they support. OpenHIE Health Worker Registry (HWR) 
342 
workflow and functional requirement references (HWWF-1 to HWWF-4; HWRF-1 to HWRF-12) are noted 
343 
where applicable. The DPI-H reference architecture extends the OpenHIE specification in the following 
344 
respects: licensing and credential management are made explicit as distinct requirement groups; NHWA 
345 
reporting alignment is introduced; verification service requirements are elevated; and facility affiliation 
346 
management is added to reflect the joint mCSD query model. Sources are cited where requirements extend 
347 
beyond OpenHIE. 
348 
 
349 
 
 
138 
# 
Business process 
Functional requirement 
Status 
RECORD MANAGEMENT AND DATA INGESTION 
1 
Health worker 
registration 
Health worker record creation.  The Health Workforce 
Registry shall support the creation of an authoritative 
identity and credential record for each health worker, 
covering the minimum dataset defined in Section 6, and 
assigning a unique health worker identifier at registration. 
(Extends HWRF-8) 
Required 
2 
Record update · 
HWRF-1 
Retention of updates from source systems.  The 
Health Workforce Registry shall support the ability to 
retain updates received from source data systems — 
including professional licensing authorities, employers, 
and HR systems — incorporating changes to health 
worker records in accordance with the defined data 
governance policy. 
Required 
3 
Record update 
Configurable attribute schema.  The Health Workforce 
Registry shall support a configurable schema, allowing 
countries to define and extend the attributes captured per 
health 
worker 
record 
to 
meet 
national 
context 
requirements, referenced against the canonical schema 
maintained in the Logical Information Model Repository. 
(HWRF-8) 
Required 
4 
Data onboarding 
Bulk data import.  The Health Workforce Registry shall 
support bulk import of health worker data from external 
sources, including employer HR systems, professional 
councils, and training institutions, with insert-or-update 
capability and import reporting. (HWRF-12) 
Recommended 
QUERY AND VERIFICATION 
5 
Identity resolution · 
HWRF-2 · HWWF-1 
Query health worker records.  The Health Workforce 
Registry shall support retrieval of a health worker's record 
and associated identifiers by any known identifier — 
unique health worker identifier, professional registration 
number, or national ID — returning the canonical record 
and cross-reference map. (HWWF-1; HWRF-2) 
Required 
6 
Care services 
discovery · HWWF-
2 
Query care services records.  The Health Workforce 
Registry shall support querying of care services records 
to retrieve information on health workers in combination 
with the facilities and services they are associated with, 
conformant with the IHE mCSD profile. (HWWF-2) 
Required 
7 
Care services 
discovery · HWWF-
3 
Search care services.  The Health Workforce Registry 
shall support search of health worker and care services 
records by attribute, including name, cadre, location, 
facility affiliation, and specialisation, returning ranked 
results. (HWWF-3) 
Recommended 
8 
Credential 
verification 
Real-time verification service.  The Health Workforce 
Registry shall expose a standards-based verification API 
enabling consuming systems — including clinical, claims, 
and payroll systems — to confirm a health worker's 
Required 
 
 
139 
# 
Business process 
Functional requirement 
Status 
registration 
status, 
licence 
validity, 
occupational 
classification, and facility affiliation in real time or near-
real time. 
LICENSING AND CREDENTIAL MANAGEMENT 
9 
Licensing 
management 
Licence status management.  The Health Workforce 
Registry shall store and maintain licence status for each 
health worker — active, expired, suspended, or revoked 
— with the issuing licensing body and expiry date, 
updated by authorised licensing authorities. Status 
changes shall be propagated to consuming systems 
without delay. 
Required 
10 Licensing 
management 
Licence expiry notification.  The Health Workforce 
Registry shall support automated notification to the health 
worker, their employer, and relevant consuming systems 
when a professional licence is approaching expiry or has 
expired or been revoked, reducing the risk of 
unintentional practice with a lapsed licence. 
Recommended 
11 Credential 
management 
Qualification record management.  The Health 
Workforce Registry shall support the capture and 
maintenance of each health worker's educational 
qualifications, including degree or certificate title, issuing 
institution, country, and date of completion, aligned with 
the WHO minimum dataset for health workers (WHO, 
2015; HWRF-7). 
Required 
12 Workforce 
development 
Continuing professional development tracking.  The 
Health Workforce Registry shall support recording of CPD 
activities and credits against each health worker's record 
where national CPD frameworks require it, enabling 
licence renewal decisions to reference verified CPD 
compliance status. 
Recommended 
WORKFORCE ANALYTICS AND NHWA REPORTING 
13 Workforce planning 
· NHWA 
Standard workforce reports.  The Health Workforce 
Registry shall support the generation of standard reports 
aligned with NHWA core indicators — including workforce 
stock by cadre, qualification, employment type, facility, 
and administrative unit — supporting national reporting 
obligations and evidence-based workforce planning. 
(HWRF-10; WHO NHWA Second Edition, 2023) 
Required 
14 Workforce planning 
· HWRF-11 
Customisable 
workforce 
reports. 
 
The 
Health 
Workforce Registry shall support the generation of 
customisable reports and data exports, enabling 
Ministries of Health and subnational authorities to 
produce context-specific workforce analyses beyond 
standard NHWA reporting. (HWRF-11) 
Recommended 
15 Workforce 
distribution 
analytics 
Workforce-to-facility deployment mapping.  The 
Health Workforce Registry shall support queries that 
combine health worker and facility data to produce 
Recommended 
 
 
140 
# 
Business process 
Functional requirement 
Status 
workforce distribution analyses — including staffing ratios 
by facility type, service category, and geographic unit — 
using the joint mCSD query model with the Facility 
Registry. 
INTEGRATION AND INTEROPERABILITY 
16 System integration · 
HWRF-5 
Standards-based APIs.  The Health Workforce Registry 
shall expose flexible, standards-based machine-readable 
APIs conformant with the IHE mCSD profile (preferred) or 
the IHE Care Services Directory (CSD) profile, enabling 
any conformant system to query, retrieve, and exchange 
health worker and care services data. (HWRF-5) 
Required 
17 System integration · 
HWWF-4 
Request care services updates.  The Health Workforce 
Registry shall support the ability to request updates to 
care services records from upstream source systems, 
including professional councils, licensing bodies, and 
employer HR systems, enabling the registry to maintain 
current, accurate data from authoritative sources. 
(HWWF-4; HWRF-3) 
Required 
18 System integration · 
HWRF-4 
Upstream federation.  The Health Workforce Registry 
shall support sending updates to upstream or federated 
repositories, including inter-linked national registries or 
regional health workforce data systems, enabling cross-
border workforce monitoring and international reporting. 
(HWRF-4) 
Recommended 
GOVERNANCE AND ACCESS CONTROL 
19 Governance · 
HWRF-9 
Role-based access control.  The Health Workforce 
Registry shall enforce role-based access control with 
distinct permissions for record creation, update, query, 
verification, and administration — differentiating between 
licensing 
authorities, 
employers, 
health 
workers 
themselves, and consuming systems. (HWRF-9) 
Required 
20 Governance · 
HWRF-6 
Version history and audit logging.  The Health 
Workforce Registry shall maintain a full audit log and 
version history for all changes to health worker records — 
including licence status changes, credential updates, and 
affiliation changes — with attribution to the source system 
or user and timestamp. Elevated to Required from 
OpenHIE Recommended status given the patient safety 
implications of licence status data. (HWRF-6) 
Required 
CROSS-CUTTING 
21 System integration 
Subscription and notification.  The Health Workforce 
Registry shall support subscription-based notification for 
consuming systems, enabling notification of record 
creation, credential updates, licence status changes, and 
affiliation changes, for clinical, financial, and regulatory 
consumers. 
Recommended 
 
 
141 
# 
Business process 
Functional requirement 
Status 
22 Performance · 
Availability 
Performance and availability.  The Health Workforce 
Registry shall be designed for high availability and low-
latency response, 
given that licence verification, 
prescribing authority checks, and claims validation are 
invoked synchronously by clinical and financial systems 
at the point of care and adjudication. 
Required 
 
350 
Note: Requirements align with the OpenHIE Health Worker Registry specification (HWWF-1 to HWWF-4; 
351 
HWRF-1 to HWRF-12). The DPI-H reference architecture extends OpenHIE in five respects: (1) licensing 
352 
and credential management are made explicit as a distinct requirement group; (2) NHWA reporting 
353 
alignment is introduced as a new group; (3) the verification service is elevated to Required; (4) audit 
354 
logging (HWRF-6) is elevated from Recommended to Required given patient safety implications; and (5) 
355 
facility deployment and mCSD joint querying are made explicit requirements. Sources: OpenHIE HWR 
356 
Specification (https://guides.ohie.org/arch-spec/openhie-component-specifications-1/openhie-health-
357 
worker-registry-hwr); WHO NHWA Second Edition (2023); WHO Minimum Dataset for Health Workers 
358 
(2015); WHO Classifying Health Workers (2010). 
359 
6  DATA REQUIREMENTS 
 
360 
The following table defines the minimum dataset for a health worker record in the Health Workforce 
361 
Registry. It draws on the WHO Minimum Dataset for Health Workers (WHO, 2015), the WHO National 
362 
Health Workforce Accounts handbook (WHO NHWA Second Edition, 2023), and the WHO health worker 
363 
classification framework (WHO, 2010). Status reflects the minimum requirement for a record to support 
364 
identity resolution, credential verification, and workforce analytics. Mandatory elements should be present 
365 
for a record to be published as active. 
366 
Note: This is illustrative rather than an exhaustive list and countries can extend based on needs. 
367 
 
368 
Data element 
Description 
Status 
Unique health 
worker identifier 
Nationally 
assigned, 
non-intelligent 
alphanumeric 
identifier unique to each registered health worker, 
persistent across name changes, employer changes, 
and administrative boundary changes. 
Mandatory 
Full name 
First/given name and family/surname, with support for 
other names, maiden names, and culturally relevant 
name formats. 
Mandatory 
Date of birth 
Full date of birth or estimated date where exact date is 
unavailable. 
Mandatory 
Sex at birth 
Biological sex recorded at birth, using standardised 
coded values. 
Mandatory 
Nationality / 
citizenship 
Country of nationality, including for international health 
workers and those with dual nationality. 
Mandatory 
Place of birth 
(domestic/foreign) 
Whether the health worker was born within the country 
(domestic) or outside it (foreign), supporting NHWA 
Module 1 indicators on health workforce migration, 
international recruitment patterns, and foreign-trained 
health worker stock. A binary categorisation is the 
Recommended 
 
 
142 
Data element 
Description 
Status 
minimum required for NHWA reporting; country of birth 
may be captured additionally where national policy 
requires more granular migration data. 
Physical address 
Current residential address, including administrative unit 
hierarchy. 
Mandatory 
Contact information 
Telephone number(s) and/or professional email address. 
Mandatory 
Occupation / cadre 
code 
Standardised occupational classification using ISCO-08 
codes, as mapped in the WHO health worker 
classification framework (WHO, 2010). Supports multi-
classification where national codes are also used. 
Mandatory 
Specialisation 
Clinical or technical specialisation where applicable (e.g., 
obstetrics, radiology, public health). 
Recommended 
Professional 
registration number 
Registration or licence number issued by the relevant 
national licensing or regulatory authority, with issuing 
authority name. 
Mandatory 
Licensing body 
Name of the professional regulatory or licensing body 
that issued the registration. 
Mandatory 
Licence status 
Current status of the professional licence: active, expired, 
suspended, or revoked. Updated in real time or near-real 
time by the relevant licensing authority. 
Mandatory 
Licence expiry date 
Date on which the current professional licence expires, 
enabling advance notification workflows. 
Mandatory 
Qualification details 
Degree or certificate held, issuing educational institution, 
country, and date of completion. Based on WHO 
minimum dataset (WHO, 2015). 
Mandatory 
Employment status 
Current employment status (active, inactive, retired, on 
leave), employment type (public, private, faith-based, 
NGO), and occupational category. 
Mandatory 
Contract type 
The hours arrangement of the health worker’s primary 
employment contract classified as full-time or part-time. 
Used by the NHWA to support full-time equivalent (FTE) 
calculations that enable more accurate assessment of 
effective workforce capacity than headcount alone, and 
to inform analysis of workforce utilisation and retention 
across employment settings. 
Recommended 
Activity level 
Classification of the health worker's current activity status 
in accordance with NHWA definitions: practising 
(providing 
health 
services 
directly 
to 
patients), 
professionally active (working in the health sector but not 
necessarily in direct patient care), or licensed to practise 
(holding a valid licence regardless of current working 
status). Used for disaggregation of NHWA workforce 
stock indicators. 
Recommended 
 
 
143 
Data element 
Description 
Status 
Type of exit 
The nature of the departure from active health workforce 
status, recorded when a health worker transitions to 
inactive or retired status. Classified as voluntary 
(resignation, retirement, emigration) or involuntary 
(dismissal, 
death 
in 
service, 
licence 
revocation, 
incapacity). Supports NHWA Module 1 flow indicators on 
health workforce attrition and retention. 
Recommended 
Primary employer / 
facility affiliation 
Identifier of the primary employer or facility where the 
health worker is currently deployed, linked to the Facility 
Registry. 
Mandatory 
Secondary facility 
affiliations 
Additional facility affiliations for health workers practising 
in more than one location, each linked to the Facility 
Registry. 
Recommended 
Continuing 
professional 
development (CPD) 
status 
Record of CPD activities, credits accrued, and 
compliance status against national CPD requirements, 
where applicable. 
Recommended 
Foundational 
identifier 
National ID number or equivalent government-issued 
foundational identifier, where available and consented, 
stored as a cross-reference attribute. 
Recommended 
Record creation and 
update metadata 
Dates of record creation, last update, source system, and 
user responsible for each change. 
Mandatory 
 
369 
Note: The occupation/cadre code field shall reference the WHO health worker classification framework 
370 
based on ISCO-08. Countries that maintain their own national occupational classifications should store 
371 
both the national code and the ISCO-08 mapping, enabling international comparability for NHWA 
372 
reporting. Source: WHO, Classifying Health Workers (2010), available at: 
373 
https://www.who.int/publications/m/item/classifying-health-workers 
374 
GOVERNANCE 
Governance of the Health Workforce Registry follows the cross-cutting governance 
framework in Section 3.4 of the guidance document. Component-specific 
considerations include:  
(1) The Health Workforce Registry has a structurally complex multi-institutional 
governance context. Professional licensing authorities, Ministries of Health, employer 
HR systems, training institutions, and subnational health administrations are all 
authoritative sources for different attributes of a health worker record. The governance 
framework should specify which institution is the steward for each attribute type, and 
what verification is required before an attribute can be published.  
(2) Licence status data has direct patient safety implications: a system that publishes 
an incorrect licence status — particularly one that shows a revoked licence as active 
— can contribute to a patient safety incident. Governance should therefore specify 
the maximum permissible latency between a licensing authority revoking a licence 
and that change being reflected in the registry, and should define the incident 
response process for discovered discrepancies.  
(3) Health workers have a direct personal interest in their own registry record — their 
ability to practise depends on it. Governance should provide a defined process for 
health workers to review their own record, raise disputes, and have errors corrected 
within a specified timeframe.  
 
 
144 
(4) For community health workers and cadres without formal professional regulation, 
the governance framework should specify which institution is responsible for 
maintaining their registry records, how their identity is verified at registration, and what 
attributes are required. 
 
375 
376 
 
 
145 
DPI-H Reference Architecture  |  Component Articulation 
377
