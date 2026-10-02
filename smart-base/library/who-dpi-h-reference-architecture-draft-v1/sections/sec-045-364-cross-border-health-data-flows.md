---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-045-364-cross-border-health-data-flows
section_title: "Cross-border health data flows"
section_number: 3.6.4
pages: 88-89
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
905 
 
906 
People, and the care they need, cross borders — migrant and mobile workers, displaced 
907 
populations, those seeking care abroad, and populations served by regional health initiatives — 
908 
and infectious-disease events and other emergencies require information to move between 
909 
jurisdictions quickly and reliably. Cross-border exchange rests on the same principles as 
910 
national exchange: shared content standards, preserved meaning, and federated exchange 
911 
through national gateways rather than a central supranational store of personal health data. 
912 
 
913 
Regional experience illustrates the pattern. In the European cross-border health services 
914 
infrastructure, each participating country connects through a national contact point, and a set of 
915 
shared core services provides common terminology, translation and interoperability functions; 
916 
on this basis countries exchange a patient summary — covering information such as allergies, 
917 
current medications and significant history — together with electronic prescriptions that a 
918 
traveller can have dispensed in another country, with imaging, laboratory results and discharge 
919 
reports planned to follow.30,31,32 The personal data remains held nationally and is exchanged on 
920 
demand between contact points, so that continuity of care is achieved without centralising 
921 
records. The accompanying legal framework distinguishes the use of health data for direct care 
922 
from its governed secondary use for research, policy and planning, each with its own access 
923 
and oversight arrangements.33 
924 
 
925 
The Global Digital Health Certification Network (GDHCN) 
926 
 
927 
Where the European infrastructure illustrates federated exchange of clinical content within a 
928 
region, a complementary global initiative addresses the trust on which any cross-border 
929 
 
30 https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services_en 
31 https://health.ec.europa.eu/document/download/b744f30b-a05e-4b9c-9630-
ad96ebd0b2f0_en?filename=ehn_guidelines_eprescriptions_en.pdf  
32 https://health.ec.europa.eu/document/download/e020f311-c35b-45ae-ba3d-
03212b57fa65_en?filename=ehn_guidelines_patientsummary_en.pdf  
33 Regulation (EU) 2025/327 of the European Parliament and of the Council of 11 February 2025 on the European Health Data 
Space and amending Directive 2011/24/EU and Regulation (EU) 2024/2847. It was published in the Official Journal on 5 March 
2025 and applies, with a phased timeline, from 26 March 2027 onward. https://eur-lex.europa.eu/eli/reg/2025/327/oj/eng  
 
 
78 
exchange depends. WHO’s Global Digital Health Certification Network (GDHCN) is an openly 
930 
governed trust network through which participating authorities verify the authenticity and 
931 
provenance of verifiable health documents issued by one another — confirming, through a 
932 
shared public-key infrastructure, that a document was genuinely issued by a trusted authority 
933 
and has not been altered.34 It establishes trust without centralising data: the personal content of 
934 
a document remains with the issuing authority, and the network conveys only the means to 
935 
verify it. And it applies the same trust mechanism across many document types, keeping the 
936 
trust layer separate from — and reusable across — the clinical content it secures, in the same 
937 
way that, within a country, trust and transport are kept separate from the data they carry. 
938 
 
939 
For countries and regions designing cross-border exchange, several requirements follow: 
940 
• 
A shared, internationally aligned patient summary specification, such as the International 
941 
Patient Summary (IPS), should define the meaningful minimum exchanged for care.  
942 
• 
Terminology and language translation services should allow a receiving clinician to 
943 
interpret content in their own working language.  
944 
• 
A cross-jurisdiction trust framework — mutual recognition of identities, credentials and 
945 
digital signatures, underpinned by appropriate public-key infrastructure — shall establish 
946 
that participants, and the data they exchange, can be trusted.  
947 
• 
The legal basis and consent arrangements for cross-border processing shall be explicit.  
948 
• 
These cross-border arrangements should build on foundational cross-border identity and 
949 
trust DPI where it exists, extending it with the health-specific content and consent 
950 
considerations rather than duplicating it. 
951 
 
952
