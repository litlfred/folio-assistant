---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-005-121-identity-dpi-and-identification-in-healthcar
section_title: "Identity DPI and Identification in Healthcare"
section_number: 1.2.1
pages: 24-26
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
195 
 
196 
Consider identity. A national ID system establishes who a person is, but health requires knowing 
197 
what a person is eligible for, what treatments they are receiving, what medications have been 
198 
dispensed, and whether they have consented to share specific data with specific actors. 
199 
Foundational identity DPI also has genuine coverage gaps for populations the health sector is 
200 
obligated to serve; it does not typically cover newborns prior to civil registration, refugees, 
201 
undocumented migrants, or other marginalised groups. Clinical settings also routinely encounter 
202 
patients who present without documentation, requiring probabilistic matching, duplicate 
203 
detection, and family linkage capabilities that are simply outside the scope of general-purpose 
204 
identity DPI. These represent routine operational requirements in health systems worldwide, 
205 
rather than edge cases. Box 2 sets out where foundational identity DPI, on its own, does not 
206 
meet health-sector needs. 
207 
 
 
14 
 
208 
 
209 
Box 1.2: Why foundational identity DPI is not sufficient for health on its own 
 
Foundational digital identity provides authoritative identification and authentication of 
individuals. The health requirements below reflect genuine gaps, others reflect capabilities 
that belong with health components by design — in both cases, foundational identity is 
necessary but not sufficient on its own: 
 
1. Coverage Gaps: Foundational identity systems may not cover vulnerable populations who 
need health services—newborns (before civil registration), refugees, undocumented migrants, 
and marginalized communities. The health sector is required to provide universal access 
regardless of legal identity status. These gaps have downstream consequences: where 
individuals are missing from or inconsistently identified in the population base, it becomes 
harder to establish reliable denominators for disease surveillance and population health 
monitoring, and continuity of care is weakened when a person cannot be consistently 
recognised across visits, providers, or over time. 
 
2. Purpose Limitations: National ID proves who you are but not what you're eligible for. 
Health services require additional context: health coverage schemes, programme enrollment 
(e.g., for HIV treatment, TB medication), service entitlements, and consent status—which are 
not provided by foundational identity systems. 
 
3. Privacy and Consent Granularity: Health data demands more stringent privacy 
protections and granular consent management than general identity systems typically provide. 
Patients may consent to sharing data with their physician but not with researchers, or allow 
access to vaccination records but not mental health records—nuances foundational identity 
systems don't address. 
 
4. Clinical Matching Requirements: Healthcare requires probabilistic matching algorithms 
for patients presenting without identification, duplicate detection across misspelled names or 
missing data, and family relationship linkages—capabilities beyond simple identity verification. 
 
5. Multiple Health Identifiers: Health ecosystems often have context-specific identifiers—
patient medical record numbers, health coverage scheme member IDs, clinical trial participant 
IDs—that serve different purposes than national identity and these cannot be simply replaced 
by a single foundational ID. 
 
6. Cross-Border Care: National identity systems are country-specific, but health services 
increasingly require cross-border recognition for migrants, travelers, and regional health 
initiatives—a gap foundational identity DPI doesn't inherently solve. 
 
These highlight the need for a health-specific DPI component that bridges foundational 
identity (when available) with health-specific requirements. It provides universal coverage 
including those without legal ID, manages health-specific attributes and consents, enables 
clinical matching algorithms, and maintains health system identifiers while linking to national 
ID where it exists. The reference architecture positions Client Registry as the health sector's 
identity DPI that integrates with but doesn't depend entirely on foundational DPI identity 
systems. 
 
 
15
