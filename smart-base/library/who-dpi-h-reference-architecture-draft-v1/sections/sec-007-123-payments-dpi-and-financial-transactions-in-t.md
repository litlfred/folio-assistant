---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-007-123-payments-dpi-and-financial-transactions-in-t
section_title: "Payments DPI and financial transactions in the health sector"
section_number: 1.2.3
pages: 27-28
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
231 
 
232 
Foundational payments DPI provides the rails for moving money securely and at scale between 
233 
parties — for example, instant payment systems, mobile money platforms, and government-to-
234 
person (G2P) transfer mechanisms.8 
235 
 
236 
For the health sector, these rails offer genuine value, supporting provider payment and 
237 
collection of health insurance contributions, at scale. Health financing, however, is concerned 
238 
with far more than moving money. Its goals are efficient and equitable use of resources and 
239 
protection of people from financial hardship, pursued through three core functions: revenue 
240 
raising, pooling, and purchasing. The funds involved come from several sources — government 
241 
budget appropriations through Ministries of Finance, development partner financing, social 
242 
health insurance contributions from workers and employers, private insurance, and direct 
243 
contributions from patients. Achieving financing goals depends on aligning these flows with a 
244 
range of health-specific data and events, including eligibility and benefit entitlement, clinical 
245 
coding, verification of service delivery, provider and facility credentials, and budget and 
246 
expenditure rules. Foundational payments DPI can execute the movement of funds once these 
247 
determinations have been made — a useful capability — but it does not itself capture, evaluate, 
248 
or align this information. 
249 
 
250 
The nature of a health financial transaction compounds this. Such a transaction is rarely a 
251 
simple bilateral transfer; it is typically contingent on health-specific determinations — benefit 
252 
entitlement, clinical coding, prior authorisation, service delivery verification — and becomes 
253 
meaningful as financing data only when linked to the records that establish those conditions: the 
254 
person, the encounter, the provider, the entitlement, and the relevant budget line. Many flows 
255 
also operate within public financial management (PFM) frameworks — budget appropriations, 
256 
treasury controls, expenditure reporting, and fiscal accountability mechanisms — that sit outside 
257 
both health systems and foundational payments DPI, requiring integration with government-wide 
258 
PFM systems as well as sector-specific health financing processes. Box 4 sets out where 
259 
general-purpose payments DPI falls short of these requirements, and why health-specific 
260 
financing capabilities would need to extend or complement foundational DPI. 
261 
 
262 
Box 1.4: Why foundational payments DPI is not sufficient for health on its own 
 
Foundational payments DPI provides secure, reliable movement and settlement of funds 
between parties. Its limitation for health centres on a specific requirement: that health sector 
payments hinge on determinations the foundational payments DPI cannot make. 
 
1. Agnostic to health-specific determinations. The payment rails move funds once a 
decision to pay has been made, but they are agnostic to the determinations that decide 
whether, what, and to whom to pay. In health, those determinations are relevant because a 
payment may depend on adjudicating a claim against a benefit package; coordinating several 
payers — government schemes, public and private insurance, donor programmes, and patient 
contributions — across a single encounter; confirming the payee is a licensed provider or 
 
 
17 
facility; verifying that a clinical event, service delivery, or supply-chain condition has actually 
occurred; or calculating amounts from enrolled populations or measured performance. 
Foundational payments DPI can execute a disbursement once these determinations have 
been made, but it does not make these determinations, assess them, or maintain the 
underlying records and rules over time. 
 
These determinations are the work of health-specific financing components rather than the 
payment rails. The reference architecture provides for a shared component that defines 
coverage, entitlements, and the rules against which claims and payments are assessed (the 
Benefits Package Registry), drawing on health registries for the person, product, and provider 
information involved — establishing what a payment should be before foundational payments 
DPI moves the funds. 
 
263 
 
264
