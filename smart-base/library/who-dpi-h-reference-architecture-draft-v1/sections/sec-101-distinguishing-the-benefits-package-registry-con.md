---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-101-distinguishing-the-benefits-package-registry-con
section_title: "Distinguishing the Benefits Package Registry, Contract & Benefits Management System, and Beneficiary Registry"
section_number: null
pages: 218-221
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
1 
Beneficiary Registry 
2 
 
3 
Three closely related components serve distinct roles in the health financing architecture. The Benefits Package Registry defines what benefit 
4 
packages exist. The Contract and Benefits Management System manages the operational relationships through which those packages are 
5 
administered. The Beneficiary Registry records which individuals are enrolled in which schemes. Conflating any of these produces both architectural 
6 
and governance confusion. The table below draws the distinction systematically across nine dimensions. 
7 
 
8 
 
Benefits Package Registry 
Contract & Benefits Management System 
Beneficiary Registry 
Architecture layer 
Where it sits in the DPI-H 
framework 
Business Services Layer — reusable, 
shared reference component with DPI-H 
characteristics. Directly adjacent to the core 
registry layer; may qualify as DPI-H 
depending on country context. 
Financial Domain Functional Application — 
operational system managing scheme-specific 
transactions. 
Not 
DPI-H; 
country-specific 
implementation. 
Financial Domain Functional Appli
scheme-management component
person-specific enrolment data. No
managed by scheme operators an
financing institutions. 
Core question 
answered 
The fundamental 
problem each 
component exists to 
solve 
What benefit packages exist — what do they 
cover, who defines them, who finances 
them, and under what conditions are they 
available? 
Example: "What services does the Maternal 
Health Voucher Programme cover, who 
funds it, and which facility levels may 
provide them?" 
How are benefit packages administered — who 
has contracted with whom, which providers are 
empanelled, what are the payment terms, and 
how are claims and contributions processed? 
Example: "Is Facility X contractually empanelled 
for the Maternal Health Voucher Programme, 
and at what reimbursement tariff?" 
Who is enrolled — which individ
covered by which schemes, from
when, under what terms, and what
household 
or 
family 
relations
financing purposes? 
Example: "Is this patient currently e
in the Maternal Health Voucher 
Programme, and has she reached 
annual utilisation cap?" 
What it manages 
The artefacts it stores, 
governs, and publishes 
Benefit 
package 
definitions: 
covered 
services, procedures, medicines, devices, 
exclusions, co-payment rules, utilisation 
caps, annual limits, eligibility criteria, payer 
attribution, and facility-type linkages. 
Payer-provider contracts and empanelment 
agreements; 
premium 
and 
contribution 
schedules; 
pre-authorisation 
rules; 
claims 
submissions, adjudication outcomes, dispute 
records, and provider payment records. 
Individual enrolment records: whic
is enrolled in which scheme, enrolm
and end dates, premium or co
status, 
household 
or 
family
membership for coverage purpo
scheme-specific beneficiary identifi
Relationship to the 
Client Registry 
References the Client Registry as the 
anchor identity source. Records scheme 
associations at the population level — which 
Consumes the Client Registry to verify individual 
identity 
during 
enrolment 
and 
claims 
transactions. May record a scheme-specific 
Directly extends the Client Regi
scheme-specific enrolment attribut
person-level enrolment data that s
 
 
208 
 
Benefits Package Registry 
Contract & Benefits Management System 
Beneficiary Registry 
How each component 
uses the shared identity 
layer 
schemes exist and who may be eligible — 
but does not record individual enrolment. 
beneficiary identifier linked to the client registry 
identifier. 
be stored in the Client Registry its
maintaining a linkage to the canon
identity record. 
When it is used 
Design-time reference vs 
runtime operational 
Both design-time and runtime. Consulted at 
design time when defining new schemes or 
revising coverage rules; invoked at runtime 
by eligibility and claims systems querying 
current package definitions. 
Example: A claims system queries the 
registry at validation time to confirm the 
submitted service is within the package's 
covered list and has not exceeded the 
annual cap. 
Operational runtime. Active throughout every 
transaction cycle — enrolment, renewal, pre-
authorisation, claims submission, adjudication, 
payment, and dispute resolution. 
Example: A provider submits a claim; the CBMS 
checks the payer contract to confirm the service 
tariff, validates the claim against adjudication 
rules, and records the payment instruction. 
Operational runtime. Queried a
eligibility check 
and claims v
transaction to confirm that a 
individual is currently enrolled in the
scheme and within their entitlemen
Example: A provider queries the 
Beneficiary Registry at point of care
confirm the patient is enrolled in the
scheme before rendering the servic
What it does NOT do 
The boundaries of each 
component's scope 
Does not enrol individuals. Does not 
manage payer-provider relationships or 
contracts. Does not adjudicate claims. Does 
not record who is covered — only what 
coverage consists of. 
Does not define what a benefit package is (that is 
the BPR's role). Does not hold canonical identity 
records (that is the Client Registry). Does not 
record what packages exist at the national level 
— it operates only within the scheme(s) it 
manages. 
Does not define what benefits ex
not manage provider contracts o
Does not hold canonical health ide
is the Client Registry). Does not d
coverage rules — it records who is
the BPR determines what their e
entitles them to. 
Relationship to each 
other 
How the three 
components depend on 
and interact with one 
another 
The BPR is the reference source for both the 
CBMS and the Beneficiary Registry. When 
the CBMS creates a payer-provider contract, 
it references the package definition in the 
BPR to determine what services are 
covered. When the Beneficiary Registry 
records an enrolment, it links the individual 
to a specific package version held in the 
BPR. 
The CBMS consumes both the BPR (for 
coverage definitions 
and tariffs) and the 
Beneficiary Registry (to confirm individual 
enrolment before processing transactions). The 
CBMS also feeds back into the Beneficiary 
Registry — enrolment transactions processed by 
the CBMS update the individual's enrolment 
record. 
The Beneficiary Registry depend
BPR to know what each enrolled
entitles an individual to. It depend
CBMS to receive enrolment status
It feeds eligibility information back
of-care systems and claims sys
demand. 
FHIR alignment 
Relevant FHIR resources 
for each component 
(FHIR R6) 
InsuranceProduct — the general definition of 
a benefit product. InsurancePlan — a 
product configured for a specific scheme or 
population. 
These 
are 
the 
design-
time/reference-level resources. 
Coverage (in its operational form — linking a plan 
to a payer relationship). Claim, ClaimResponse. 
CoverageEligibilityRequest 
/ 
CoverageEligibilityResponse. 
Contract 
(for 
payer-provider agreements). 
Coverage 
(person-specific 
insta
linking a specific individual to a
plan). Group (for household o
coverage structures). EpisodeOfC
long-term scheme relationships). 
 
 
209 
 
Benefits Package Registry 
Contract & Benefits Management System 
Beneficiary Registry 
Risk if absent 
The specific failure that 
results if each 
component is not in 
place 
No shared definition of what is covered: 
every claims system, eligibility engine, and 
provider portal maintains its own local copy 
of benefit definitions, which diverge over 
time. Coverage disputes multiply; cross-
scheme 
analysis 
becomes 
impossible; 
coverage gaps are invisible to governments. 
Benefits cannot be administered: without a 
system to manage contracts, process claims, 
collect contributions, and adjudicate entitlements, 
the benefit package remains a policy document 
with no operational mechanism for delivery or 
reimbursement. 
No 
individual-level 
enrolment 
providers cannot confirm at poin
whether a person is covered; claim
be attributed to a specific in
scheme; duplicate enrolment and
fraud become difficult to detect. 
Primary users 
The roles and institutions 
that interact directly with 
each component 
Ministry of Health (package steward); health 
financing analysts and planners; scheme 
regulators; eligibility and claims systems 
(consuming via API); beneficiary-facing 
portals. 
Health insurance agencies and SHP bodies; 
private insurers; healthcare providers submitting 
claims; 
finance 
departments 
processing 
payments; audit and fraud detection services. 
Health insurance agencies and SH
(managing 
enrolment); 
ben
verifying their own coverage; 
querying eligibility at point of car
systems confirming active enrolme
 
9 
Note: The three components above are complementary, not competing. A functioning health financing system requires all three. The Benefits 
10 
Package Registry provides the what; the Contract and Benefits Management System provides the operational how; and the Beneficiary Registry 
11 
provides the who. Conflating them — most commonly by building enrolment and operational management directly into the package registry, or by 
12 
including package definitions inside a scheme-specific system — produces fragmentation, duplication, and the inability to see the national coverage 
13 
picture as a whole. 
14 
 
15 
 
 
210 
DPI-H Reference Architecture  |  Component Articulation 
1
